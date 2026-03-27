#!/usr/bin/env node

/**
 * Native Messaging Host + HTTP Server Bridge
 *
 * Chrome extension communicates via native messaging (stdin/stdout).
 * Raycast communicates via HTTP on localhost:19816.
 *
 * Endpoints:
 *   GET  /health   — bridge status
 *   GET  /commands — current command list
 *   POST /execute  — trigger a command (relayed to Chrome)
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';

const PORT = 19816;
const DATA_DIR = path.join(os.homedir(), '.popemkt', 'browser-extension');
const COMMANDS_FILE = path.join(DATA_DIR, 'commands.json');
const LOG_FILE = path.join(DATA_DIR, 'bridge.log');

fs.mkdirSync(DATA_DIR, { recursive: true });

// --- Logging ---

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    /* ignore */
  }
}

log(`Bridge started. PID=${process.pid} Node=${process.version}`);

// --- In-memory state ---

interface CommandDef {
  id: string;
  label: string;
  description?: string;
  context: string;
}

let currentCommands: CommandDef[] = [];
let syncedAt: string | null = null;
let extensionId: string | null = null;
let chromeConnected = true;
let pendingRequests = new Map<string, { resolve: (data: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

// Load cached commands so HTTP has data before Chrome syncs
try {
  if (fs.existsSync(COMMANDS_FILE)) {
    const cached = JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf8'));
    currentCommands = cached.commands ?? [];
    syncedAt = cached.syncedAt ?? null;
    extensionId = cached.extensionId ?? null;
    log(`Loaded ${currentCommands.length} cached commands`);
  }
} catch {
  /* ignore corrupt cache */
}

// --- Buffered stdin reader (native messaging protocol) ---

interface NativeMessage {
  type: string;
  commands?: CommandDef[];
  extensionId?: string;
  commandId?: string;
  result?: unknown;
}

let stdinBuffer = Buffer.alloc(0);
let stdinEnded = false;
const waiters: Array<() => void> = [];

process.stdin.on('data', (chunk: Buffer) => {
  stdinBuffer = Buffer.concat([stdinBuffer, chunk]);
  while (waiters.length > 0) waiters.shift()!();
});

process.stdin.on('end', () => {
  log('stdin ended (Chrome disconnected)');
  stdinEnded = true;
  chromeConnected = false;
  while (waiters.length > 0) waiters.shift()!();
});

function waitForData(): Promise<void> {
  return new Promise(resolve => {
    if (stdinBuffer.length > 0 || stdinEnded) resolve();
    else waiters.push(resolve);
  });
}

async function readBytes(n: number): Promise<Buffer | null> {
  while (stdinBuffer.length < n) {
    if (stdinEnded) return null;
    await waitForData();
  }
  const result = Buffer.from(stdinBuffer.subarray(0, n));
  stdinBuffer = stdinBuffer.subarray(n);
  return result;
}

async function readMessage(): Promise<NativeMessage | null> {
  const header = await readBytes(4);
  if (!header) return null;

  const msgLen = header.readUInt32LE(0);
  if (msgLen === 0) return null;

  const body = await readBytes(msgLen);
  if (!body) return null;

  return JSON.parse(body.toString('utf8'));
}

function sendMessage(msg: Record<string, unknown>) {
  const json = JSON.stringify(msg);
  const buf = Buffer.from(json, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buf.length, 0);
  process.stdout.write(header);
  process.stdout.write(buf);
}

// --- Request/response to Chrome ---

function requestChrome(msg: Record<string, unknown>, timeoutMs = 5000): Promise<unknown> {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Timeout waiting for Chrome response'));
    }, timeoutMs);
    pendingRequests.set(requestId, { resolve, timer });
    sendMessage({ ...msg, requestId });
  });
}

// --- HTTP Server ---

function startHttpServer(): http.Server {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          ok: true,
          chromeConnected,
          commandCount: currentCommands.length,
          syncedAt,
          pid: process.pid,
          uptime: Math.floor(process.uptime()),
        }),
      );
      return;
    }

    if (req.method === 'GET' && req.url === '/commands') {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          commands: currentCommands,
          syncedAt,
          extensionId,
          chromeConnected,
        }),
      );
      return;
    }

    if (req.method === 'POST' && req.url === '/execute') {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { commandId } = JSON.parse(body);
          if (!commandId || typeof commandId !== 'string') {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing commandId' }));
            return;
          }
          if (!chromeConnected) {
            res.writeHead(503);
            res.end(JSON.stringify({ error: 'Chrome is not connected' }));
            return;
          }
          log(`HTTP execute: ${commandId}`);
          sendMessage({ type: 'EXECUTE_COMMAND', commandId });
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, commandId }));
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/search-bookmarks?')) {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      const query = url.searchParams.get('q') ?? '';
      if (!query.trim()) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing query parameter q' }));
        return;
      }
      if (!chromeConnected) {
        res.writeHead(503);
        res.end(JSON.stringify({ error: 'Chrome is not connected' }));
        return;
      }
      log(`HTTP search-bookmarks: ${query}`);
      requestChrome({ type: 'SEARCH_BOOKMARKS', query: query.trim() })
        .then(data => {
          res.writeHead(200);
          res.end(JSON.stringify(data));
        })
        .catch(err => {
          res.writeHead(504);
          res.end(JSON.stringify({ error: (err as Error).message }));
        });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(PORT, '127.0.0.1', () => {
    log(`HTTP server listening on http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${PORT} in use — another bridge may be running. HTTP disabled.`);
    } else {
      log(`HTTP server error: ${err.message}`);
    }
  });

  return server;
}

// --- Main loop ---

async function main() {
  const server = startHttpServer();

  fs.writeFileSync(
    path.join(DATA_DIR, 'bridge.pid'),
    JSON.stringify({ pid: process.pid, port: PORT, started: new Date().toISOString() }),
  );

  log('Main loop started, waiting for messages...');

  while (true) {
    const msg = await readMessage();
    if (msg === null) {
      log('No more messages, exiting');
      break;
    }

    log(`Received: ${msg.type}`);

    switch (msg.type) {
      case 'SYNC_COMMANDS': {
        currentCommands = msg.commands ?? [];
        syncedAt = new Date().toISOString();
        extensionId = msg.extensionId ?? null;

        const data = { commands: currentCommands, syncedAt, extensionId };
        fs.writeFileSync(COMMANDS_FILE, JSON.stringify(data, null, 2));
        log(`Synced ${currentCommands.length} commands`);
        sendMessage({ type: 'SYNC_ACK', count: currentCommands.length });
        break;
      }

      case 'COMMAND_RESULT': {
        log('Command result received');
        break;
      }

      case 'RESPONSE': {
        const requestId = msg.requestId as string | undefined;
        if (requestId && pendingRequests.has(requestId)) {
          const pending = pendingRequests.get(requestId)!;
          clearTimeout(pending.timer);
          pendingRequests.delete(requestId);
          pending.resolve(msg.data);
        }
        break;
      }

      default:
        log(`Unknown message type: ${msg.type}`);
        sendMessage({ type: 'ERROR', message: `Unknown message type: ${msg.type}` });
    }
  }

  server.close();
  try {
    fs.unlinkSync(path.join(DATA_DIR, 'bridge.pid'));
  } catch {
    /* ignore */
  }
}

main().catch(err => {
  log(`Fatal: ${(err as Error).message}`);
  process.exit(1);
});
