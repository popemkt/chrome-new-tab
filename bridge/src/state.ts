import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { WebSocket } from 'ws';
import type { CommandDef } from '@extension/protocol';
import { CDP_PORT, COMMANDS_FILE } from './config.ts';
import { log } from './logger.ts';

export type { CommandDef };

// ---------------------------------------------------------------------------
// Bridge context — single source of truth for all runtime state
// ---------------------------------------------------------------------------

export const ctx = {
  /** Extension WebSocket connection */
  extension: {
    socket: null as WebSocket | null,
    id: null as string | null,
    get connected() {
      return this.socket?.readyState === WebSocket.OPEN;
    },
  },

  /** Browser info (discovered via CDP port) */
  browser: {
    pid: null as number | null,
    cdpAvailable: false,
    browserVersion: null as string | null,
    lastProbe: null as string | null,
  },

  /** Synced commands from the extension */
  commands: [] as CommandDef[],
  syncedAt: null as string | null,
};

// ---------------------------------------------------------------------------
// Load cached state from disk
// ---------------------------------------------------------------------------

try {
  if (fs.existsSync(COMMANDS_FILE)) {
    const cached = JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf8'));
    ctx.commands = cached.commands ?? [];
    ctx.syncedAt = cached.syncedAt ?? null;
    ctx.extension.id = cached.extensionId ?? null;
    log(`Loaded ${ctx.commands.length} cached commands`);
  }
} catch {
  /* ignore corrupt cache */
}

// ---------------------------------------------------------------------------
// Browser / CDP probing
// ---------------------------------------------------------------------------

export async function probeBrowser(): Promise<void> {
  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (!res.ok) throw new Error('CDP not ok');
    const data = (await res.json()) as { Browser?: string };
    ctx.browser.cdpAvailable = true;
    ctx.browser.browserVersion = data.Browser ?? null;

    // Get PID from the CDP port listener
    try {
      const output = execSync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetTCPConnection -LocalPort ${CDP_PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"`,
        { encoding: 'utf8', timeout: 3000 },
      ).trim();
      const pid = Number(output);
      if (pid) ctx.browser.pid = pid;
    } catch {
      // Non-Windows or powershell not available — PID stays null
    }

    ctx.browser.lastProbe = new Date().toISOString();
    log(`Browser probed: ${ctx.browser.browserVersion}, PID=${ctx.browser.pid}, CDP=available`);
  } catch {
    ctx.browser.cdpAvailable = false;
    ctx.browser.pid = null;
    ctx.browser.browserVersion = null;
    ctx.browser.lastProbe = new Date().toISOString();
    log('Browser probe: CDP not available');
  }
}

/** Start periodic browser probing (every 30s) */
export function startBrowserProbe() {
  probeBrowser();
  setInterval(probeBrowser, 30_000);
}

// ---------------------------------------------------------------------------
// Extension WebSocket communication
// ---------------------------------------------------------------------------

export function setExtensionSocket(ws: WebSocket | null) {
  ctx.extension.socket = ws;
  // Re-probe browser when extension connects (it means the browser is running)
  if (ws) probeBrowser();
}

export function sendToChrome(msg: Record<string, unknown>) {
  if (ctx.extension.connected) {
    ctx.extension.socket!.send(JSON.stringify(msg));
  }
}

const pendingRequests = new Map<string, { resolve: (data: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

export function requestChrome(msg: Record<string, unknown>, timeoutMs = 5000): Promise<unknown> {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    if (!ctx.extension.connected) {
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
  ctx.commands = newCommands;
  ctx.syncedAt = new Date().toISOString();
  ctx.extension.id = newExtensionId;

  const data = { commands: ctx.commands, syncedAt: ctx.syncedAt, extensionId: ctx.extension.id };
  fs.writeFileSync(COMMANDS_FILE, JSON.stringify(data, null, 2));
  log(`Synced ${ctx.commands.length} commands`);
}
