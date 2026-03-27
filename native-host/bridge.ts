/**
 * WebSocket + HTTP Bridge Server
 *
 * Chrome extension connects via WebSocket.
 * Raycast and other clients connect via HTTP.
 * Both share port 19816 on localhost.
 *
 * Endpoints:
 *   GET  /health           — bridge status
 *   GET  /commands          — current command list
 *   POST /execute           — trigger a command (relayed to Chrome via WS)
 *   GET  /search-bookmarks  — search bookmarks (relayed to Chrome via WS)
 *
 * WebSocket: ws://127.0.0.1:19816
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 19816;
const DATA_DIR = path.join(os.homedir(), '.popemkt', 'browser-extension');
const COMMANDS_FILE = path.join(DATA_DIR, 'commands.json');
const LOG_FILE = path.join(DATA_DIR, 'bridge.log');

fs.mkdirSync(DATA_DIR, { recursive: true });

// --- Logging ---

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stderr.write(line);
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
let chromeSocket: WebSocket | null = null;
const pendingRequests = new Map<string, { resolve: (data: unknown) => void; timer: ReturnType<typeof setTimeout> }>();

// Load cached commands so HTTP has data before Chrome connects
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

// --- Send to Chrome via WebSocket ---

function sendToChrome(msg: Record<string, unknown>) {
  if (chromeSocket?.readyState === WebSocket.OPEN) {
    chromeSocket.send(JSON.stringify(msg));
  }
}

function requestChrome(msg: Record<string, unknown>, timeoutMs = 5000): Promise<unknown> {
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

// --- Handle WebSocket messages from Chrome ---

function handleChromeMessage(raw: string) {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw);
  } catch {
    log(`Invalid JSON from Chrome: ${raw.slice(0, 100)}`);
    return;
  }

  const type = msg.type as string;
  log(`WS received: ${type}`);

  switch (type) {
    case 'SYNC_COMMANDS': {
      currentCommands = (msg.commands as CommandDef[]) ?? [];
      syncedAt = new Date().toISOString();
      extensionId = (msg.extensionId as string) ?? null;

      const data = { commands: currentCommands, syncedAt, extensionId };
      fs.writeFileSync(COMMANDS_FILE, JSON.stringify(data, null, 2));
      log(`Synced ${currentCommands.length} commands`);
      sendToChrome({ type: 'SYNC_ACK', count: currentCommands.length });
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

    case 'PING':
      sendToChrome({ type: 'PONG' });
      break;

    case 'COMMAND_RESULT':
      log('Command result received');
      break;

    default:
      log(`Unknown message type: ${type}`);
  }
}

// --- HTTP + WebSocket Server ---

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        ok: true,
        chromeConnected: chromeSocket?.readyState === WebSocket.OPEN,
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
        chromeConnected: chromeSocket?.readyState === WebSocket.OPEN,
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
        if (!chromeSocket || chromeSocket.readyState !== WebSocket.OPEN) {
          res.writeHead(503);
          res.end(JSON.stringify({ error: 'Chrome is not connected' }));
          return;
        }
        log(`HTTP execute: ${commandId}`);
        sendToChrome({ type: 'EXECUTE_COMMAND', commandId });
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
    if (!chromeSocket || chromeSocket.readyState !== WebSocket.OPEN) {
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

// WebSocket server on the same port
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', ws => {
  log('Chrome extension connected via WebSocket');
  chromeSocket = ws;

  ws.on('message', (data: Buffer) => {
    handleChromeMessage(data.toString('utf8'));
  });

  ws.on('close', () => {
    log('Chrome extension disconnected');
    if (chromeSocket === ws) chromeSocket = null;
  });

  ws.on('error', err => {
    log(`WebSocket error: ${err.message}`);
  });
});

// --- Start ---

server.listen(PORT, '127.0.0.1', () => {
  log(`Bridge listening on http://127.0.0.1:${PORT} (HTTP + WebSocket)`);
  console.log(`Bridge running on http://127.0.0.1:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    log(`Port ${PORT} in use — another bridge may be running.`);
    console.error(`Port ${PORT} in use — another bridge may be running.`);
    process.exit(1);
  } else {
    log(`Server error: ${err.message}`);
  }
});

fs.writeFileSync(
  path.join(DATA_DIR, 'bridge.pid'),
  JSON.stringify({ pid: process.pid, port: PORT, started: new Date().toISOString() }),
);

// Clean shutdown
function shutdown() {
  log('Shutting down...');
  wss.clients.forEach(ws => ws.close());
  server.close();
  try {
    fs.unlinkSync(path.join(DATA_DIR, 'bridge.pid'));
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
