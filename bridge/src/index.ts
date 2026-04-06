/**
 * WebSocket + HTTP Bridge Server
 *
 * Chrome extension connects via WebSocket.
 * Raycast and other clients connect via HTTP.
 * Both share port 19816 on localhost.
 *
 * Endpoints:
 *   GET  /health             — bridge status
 *   GET  /commands            — current command list
 *   POST /execute             — trigger a command (relayed to Chrome via WS)
 *   GET  /search-bookmarks    — search bookmarks (relayed to Chrome via WS)
 *   POST /reload-extension    — reload the Chrome extension
 *
 * WebSocket: ws://127.0.0.1:19816
 */

import fs from 'node:fs';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { PORT, DATA_DIR, PID_FILE } from './config.ts';
import { log } from './logger.ts';
import { handleRequest } from './routes.ts';
import { handleConnection } from './websocket.ts';

fs.mkdirSync(DATA_DIR, { recursive: true });

log(`Bridge started. PID=${process.pid} Node=${process.version}`);

// --- HTTP server ---

const server = http.createServer(handleRequest);

// --- WebSocket server (shares the same port) ---

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', handleConnection);

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

fs.writeFileSync(PID_FILE, JSON.stringify({ pid: process.pid, port: PORT, started: new Date().toISOString() }));

// --- Clean shutdown ---

function shutdown() {
  log('Shutting down...');
  wss.clients.forEach(ws => ws.close());
  server.close();
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
