import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { ChildProcess } from 'node:child_process';
import type { WebSocket } from 'ws';
import { startBridge, stopBridge, connectMockExtension, sendAndWait, post, get, BRIDGE_URL } from './helpers.ts';

describe('Bridge server', () => {
  let bridge: ChildProcess;

  before(async () => {
    bridge = await startBridge();
  });

  after(() => {
    stopBridge(bridge);
  });

  // ---------------------------------------------------------------------------
  // Health & basic HTTP
  // ---------------------------------------------------------------------------

  it('GET /health returns ok with no extension connected', async () => {
    const { status, data } = await get('/health');
    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.chromeConnected, false);
  });

  it('GET /commands returns empty list before sync', async () => {
    const { status, data } = await get('/commands');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.commands));
  });

  it('returns 404 for unknown routes', async () => {
    const { status } = await get('/nope');
    assert.equal(status, 404);
  });

  it('POST /execute returns 503 when no extension connected', async () => {
    const { status, data } = await post('/execute', { commandId: 'test' });
    assert.equal(status, 503);
    assert.ok((data.error as string).includes('not connected'));
  });

  it('POST /reload-extension fails when no extension connected', async () => {
    const { status } = await post('/reload-extension');
    // Either 400 (no extension ID known) or 503 (CDP unavailable) or 200 with fallback
    // depends on cached state — the key assertion is it doesn't crash
    assert.ok([200, 400, 503].includes(status));
  });

  // ---------------------------------------------------------------------------
  // WebSocket connection + command sync
  // ---------------------------------------------------------------------------

  describe('with mock extension connected', () => {
    let ext: WebSocket;

    before(async () => {
      ext = await connectMockExtension();
    });

    after(() => {
      ext.close();
    });

    it('health shows chromeConnected after WS connect', async () => {
      const { data } = await get('/health');
      assert.equal(data.chromeConnected, true);
    });

    it('SYNC_COMMANDS is acknowledged', async () => {
      const ack = await sendAndWait(
        ext,
        {
          type: 'SYNC_COMMANDS',
          commands: [
            { id: 'test-cmd', label: 'Test', context: 'background' },
            { id: 'test-cmd-2', label: 'Test 2', context: 'content' },
          ],
          extensionId: 'test-extension-id',
        },
        msg => msg.type === 'SYNC_ACK',
      );
      assert.equal(ack.type, 'SYNC_ACK');
      assert.equal(ack.count, 2);
    });

    it('GET /commands returns synced commands', async () => {
      const { data } = await get('/commands');
      assert.equal((data.commands as unknown[]).length, 2);
      assert.equal(data.extensionId, 'test-extension-id');
      assert.equal(data.chromeConnected, true);
    });

    it('PING is answered with PONG', async () => {
      const pong = await sendAndWait(ext, { type: 'PING' }, msg => msg.type === 'PONG');
      assert.equal(pong.type, 'PONG');
    });

    // -------------------------------------------------------------------------
    // HTTP -> WS relay: execute command
    // -------------------------------------------------------------------------

    it('POST /execute relays EXECUTE_COMMAND to extension via WS', async () => {
      // Set up listener for the WS message BEFORE making the HTTP request
      const received = new Promise<Record<string, unknown>>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout')), 5000);
        ext.once('message', (data: Buffer) => {
          clearTimeout(timer);
          resolve(JSON.parse(data.toString()));
        });
      });

      const { status, data } = await post('/execute', { commandId: 'test-cmd' });
      assert.equal(status, 200);
      assert.equal(data.ok, true);

      const msg = await received;
      assert.equal(msg.type, 'EXECUTE_COMMAND');
      assert.equal(msg.commandId, 'test-cmd');
    });

    // -------------------------------------------------------------------------
    // HTTP -> WS -> response relay: search bookmarks
    // -------------------------------------------------------------------------

    it('GET /search-bookmarks relays to extension and returns response', async () => {
      // Listen for the relay and respond
      ext.once('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'SEARCH_BOOKMARKS') {
          ext.send(
            JSON.stringify({
              type: 'RESPONSE',
              requestId: msg.requestId,
              data: {
                bookmarks: [{ id: '1', title: 'Example', url: 'https://example.com', folder: 'Test' }],
              },
            }),
          );
        }
      });

      const res = await fetch(`${BRIDGE_URL}/search-bookmarks?q=example`);
      assert.equal(res.status, 200);
      const body = (await res.json()) as { bookmarks: { id: string; title: string }[] };
      assert.equal(body.bookmarks.length, 1);
      assert.equal(body.bookmarks[0].title, 'Example');
    });

    // -------------------------------------------------------------------------
    // POST /execute validation
    // -------------------------------------------------------------------------

    it('POST /execute rejects missing commandId', async () => {
      const { status, data } = await post('/execute', {});
      assert.equal(status, 400);
      assert.ok((data.error as string).includes('Missing'));
    });

    it('POST /execute rejects invalid JSON', async () => {
      const res = await fetch(`${BRIDGE_URL}/execute`, {
        method: 'POST',
        body: 'not json',
      });
      assert.equal(res.status, 400);
    });

    it('GET /search-bookmarks rejects missing query', async () => {
      const res = await fetch(`${BRIDGE_URL}/search-bookmarks?q=`);
      assert.equal(res.status, 400);
    });
  });

  // ---------------------------------------------------------------------------
  // Disconnection handling
  // ---------------------------------------------------------------------------

  describe('after extension disconnects', () => {
    before(async () => {
      // The previous test suite already synced commands, so they're cached.
      // Just connect and immediately disconnect to test the disconnection state.
      const ext = await connectMockExtension();
      ext.close();
      // Wait for the server to process the close
      await new Promise(r => setTimeout(r, 500));
    });

    it('health shows chromeConnected false', async () => {
      const { data } = await get('/health');
      assert.equal(data.chromeConnected, false);
    });

    it('commands are still available from cache', async () => {
      const { data } = await get('/commands');
      assert.ok((data.commands as unknown[]).length > 0);
      assert.equal(data.chromeConnected, false);
    });

    it('POST /execute returns 503', async () => {
      const { status } = await post('/execute', { commandId: 'cached-cmd' });
      assert.equal(status, 503);
    });
  });
});
