import fs from 'node:fs';
import { WebSocket } from 'ws';
import { COMMANDS_FILE } from './config.ts';
import { log } from './logger.ts';

export interface CommandDef {
  id: string;
  label: string;
  description?: string;
  context: string;
}

// --- In-memory state ---

export let commands: CommandDef[] = [];
export let syncedAt: string | null = null;
export let extensionId: string | null = null;
export let chromeSocket: WebSocket | null = null;

const pendingRequests = new Map<string, { resolve: (data: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

// Load cached commands so HTTP has data before Chrome connects
try {
  if (fs.existsSync(COMMANDS_FILE)) {
    const cached = JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf8'));
    commands = cached.commands ?? [];
    syncedAt = cached.syncedAt ?? null;
    extensionId = cached.extensionId ?? null;
    log(`Loaded ${commands.length} cached commands`);
  }
} catch {
  /* ignore corrupt cache */
}

// --- Chrome communication ---

export function setChromeSocket(ws: WebSocket | null) {
  chromeSocket = ws;
}

export function sendToChrome(msg: Record<string, unknown>) {
  if (chromeSocket?.readyState === WebSocket.OPEN) {
    chromeSocket.send(JSON.stringify(msg));
  }
}

export function requestChrome(msg: Record<string, unknown>, timeoutMs = 5000): Promise<unknown> {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    if (!chromeSocket || chromeSocket.readyState !== WebSocket.OPEN) {
      reject(new Error('Chrome is not connected'));
      return;
    }
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Timeout waiting for Chrome response'));
    }, timeoutMs);
    pendingRequests.set(requestId, { resolve, timer });
    sendToChrome({ ...msg, requestId });
  });
}

export function resolvePendingRequest(requestId: string, data: unknown) {
  const pending = pendingRequests.get(requestId);
  if (pending) {
    clearTimeout(pending.timer);
    pendingRequests.delete(requestId);
    pending.resolve(data);
  }
}

export function syncCommands(newCommands: CommandDef[], newExtensionId: string | null) {
  commands = newCommands;
  syncedAt = new Date().toISOString();
  extensionId = newExtensionId;

  const data = { commands, syncedAt, extensionId };
  fs.writeFileSync(COMMANDS_FILE, JSON.stringify(data, null, 2));
  log(`Synced ${commands.length} commands`);
}
