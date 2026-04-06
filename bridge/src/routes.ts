import http from 'node:http';
import { WebSocket } from 'ws';
import { PORT } from './config.ts';
import { log } from './logger.ts';
import { commands, syncedAt, extensionId, chromeSocket, sendToChrome, requestChrome } from './state.ts';

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => resolve(body));
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function requireChrome(res: http.ServerResponse): boolean {
  if (!chromeSocket || chromeSocket.readyState !== WebSocket.OPEN) {
    json(res, 503, { error: 'Chrome is not connected' });
    return false;
  }
  return true;
}

export async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const { method, url } = req;

  if (method === 'GET' && url === '/health') {
    return json(res, 200, {
      ok: true,
      chromeConnected: chromeSocket?.readyState === WebSocket.OPEN,
      commandCount: commands.length,
      syncedAt,
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
    });
  }

  if (method === 'GET' && url === '/commands') {
    return json(res, 200, {
      commands,
      syncedAt,
      extensionId,
      chromeConnected: chromeSocket?.readyState === WebSocket.OPEN,
    });
  }

  if (method === 'POST' && url === '/execute') {
    const body = await readBody(req);
    try {
      const { commandId } = JSON.parse(body);
      if (!commandId || typeof commandId !== 'string') return json(res, 400, { error: 'Missing commandId' });
      if (!requireChrome(res)) return;
      log(`HTTP execute: ${commandId}`);
      sendToChrome({ type: 'EXECUTE_COMMAND', commandId });
      return json(res, 200, { ok: true, commandId });
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  if (method === 'POST' && url === '/reload-extension') {
    if (!requireChrome(res)) return;
    log('HTTP reload-extension');
    sendToChrome({ type: 'RELOAD_EXTENSION' });
    return json(res, 200, { ok: true });
  }

  if (method === 'GET' && url?.startsWith('/search-bookmarks?')) {
    const parsed = new URL(url, `http://127.0.0.1:${PORT}`);
    const query = parsed.searchParams.get('q') ?? '';
    if (!query.trim()) return json(res, 400, { error: 'Missing query parameter q' });
    if (!requireChrome(res)) return;
    log(`HTTP search-bookmarks: ${query}`);
    try {
      const data = await requestChrome({ type: 'SEARCH_BOOKMARKS', query: query.trim() });
      return json(res, 200, data);
    } catch (err) {
      return json(res, 504, { error: (err as Error).message });
    }
  }

  json(res, 404, { error: 'Not found' });
}
