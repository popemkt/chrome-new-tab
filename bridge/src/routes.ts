import http from 'node:http';
import { exec } from 'node:child_process';
import { BRIDGE_PORT, PROJECT_ROOT } from './config.ts';
import { log } from './logger.ts';
import { ctx, sendToChrome, requestChrome } from './state.ts';
import { reloadExtensionViaCDP, sendBrowserShortcut } from './devtools.ts';

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
  if (!ctx.extension.connected) {
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
      chromeConnected: ctx.extension.connected,
      bridge: { pid: process.pid, uptime: Math.floor(process.uptime()) },
      extension: { connected: ctx.extension.connected, id: ctx.extension.id },
      browser: ctx.browser,
      commandCount: ctx.commands.length,
      syncedAt: ctx.syncedAt,
    });
  }

  if (method === 'GET' && url === '/commands') {
    return json(res, 200, {
      commands: ctx.commands,
      syncedAt: ctx.syncedAt,
      extensionId: ctx.extension.id,
      chromeConnected: ctx.extension.connected,
    });
  }

  if (method === 'POST' && url === '/execute') {
    const body = await readBody(req);
    try {
      const { commandId } = JSON.parse(body);
      if (!commandId || typeof commandId !== 'string') return json(res, 400, { error: 'Missing commandId' });

      // Commands handled directly by the bridge (via CDP, no extension needed)
      const browserShortcuts: Record<string, { key: string; ctrl?: boolean }> = {
        'open-history': { key: 'h', ctrl: true },
      };
      const shortcut = browserShortcuts[commandId];
      if (shortcut) {
        log(`HTTP execute (browser shortcut): ${commandId}`);
        try {
          await sendBrowserShortcut(shortcut.key, { ctrl: shortcut.ctrl });
          return json(res, 200, { ok: true, commandId, method: 'cdp-shortcut' });
        } catch (err) {
          log(`CDP shortcut failed: ${(err as Error).message}`);
          return json(res, 500, { error: (err as Error).message });
        }
      }

      // Commands relayed to the extension via WebSocket
      if (!requireChrome(res)) return;
      log(`HTTP execute: ${commandId}`);
      sendToChrome({ type: 'EXECUTE_COMMAND', commandId });
      return json(res, 200, { ok: true, commandId });
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  if (method === 'POST' && url === '/reload-extension') {
    if (!ctx.extension.id) return json(res, 400, { error: 'Extension ID not known yet (has it connected?)' });
    log('HTTP reload-extension');
    try {
      await reloadExtensionViaCDP(ctx.extension.id);
      return json(res, 200, { ok: true, method: 'cdp' });
    } catch (err) {
      log(`CDP reload failed: ${(err as Error).message}, falling back to WS`);
      if (!requireChrome(res)) return;
      sendToChrome({ type: 'RELOAD_EXTENSION' });
      return json(res, 200, { ok: true, method: 'websocket-fallback' });
    }
  }

  if (method === 'POST' && url === '/browser/shortcut') {
    const body = await readBody(req);
    try {
      const { key, ctrl, shift, alt } = JSON.parse(body);
      if (!key || typeof key !== 'string') return json(res, 400, { error: 'Missing key' });
      log(`HTTP browser/shortcut: ${ctrl ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${alt ? 'Alt+' : ''}${key}`);
      await sendBrowserShortcut(key, { ctrl, shift, alt });
      return json(res, 200, { ok: true });
    } catch (err) {
      return json(res, 500, { error: (err as Error).message });
    }
  }

  if (method === 'POST' && url === '/dev/build') {
    log('HTTP dev/build');
    exec('pnpm build', { cwd: PROJECT_ROOT }, (err, stdout, stderr) => {
      if (err) {
        log(`Build failed: ${stderr}`);
        return json(res, 500, { error: 'Build failed', details: stderr });
      }
      log('Build succeeded');
      json(res, 200, { ok: true, output: stdout });
    });
    return;
  }

  if (method === 'GET' && url?.startsWith('/search-bookmarks?')) {
    const parsed = new URL(url, `http://127.0.0.1:${BRIDGE_PORT}`);
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
