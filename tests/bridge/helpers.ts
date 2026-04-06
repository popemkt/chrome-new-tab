import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { WebSocket } from 'ws';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');
const BRIDGE_ENTRY = path.join(PROJECT_ROOT, 'bridge', 'src', 'index.ts');

/** Use a different port for tests so we don't conflict with a running dev bridge */
const TEST_PORT = Number(process.env.BRIDGE_TEST_PORT) || 19817;
const BRIDGE_URL = `http://127.0.0.1:${TEST_PORT}`;
const BRIDGE_WS = `ws://127.0.0.1:${TEST_PORT}`;

export { BRIDGE_URL, BRIDGE_WS, TEST_PORT };

/** Spawn the bridge server and wait until it's ready (health check passes) */
export async function startBridge(): Promise<ChildProcess> {
  const proc = spawn('node', ['--experimental-strip-types', BRIDGE_ENTRY], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BRIDGE_PORT: String(TEST_PORT) },
  });

  // Wait for bridge to be ready (max 10s)
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BRIDGE_URL}/health`);
      if (res.ok) return proc;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 200));
  }

  proc.kill();
  throw new Error('Bridge did not start within 10s');
}

/** Kill the bridge process */
export function stopBridge(proc: ChildProcess) {
  proc.kill('SIGTERM');
}

/** Connect a mock "extension" WebSocket client to the bridge */
export function connectMockExtension(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(BRIDGE_WS);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
    setTimeout(() => reject(new Error('WS connect timeout')), 5000);
  });
}

/** Send a JSON message and wait for a response matching a predicate */
export function sendAndWait(
  ws: WebSocket,
  message: Record<string, unknown>,
  predicate: (msg: Record<string, unknown>) => boolean,
  timeoutMs = 5000,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', handler);
      reject(new Error('Timeout waiting for WS response'));
    }, timeoutMs);

    function handler(data: Buffer) {
      const msg = JSON.parse(data.toString());
      if (predicate(msg)) {
        clearTimeout(timer);
        ws.off('message', handler);
        resolve(msg);
      }
    }

    ws.on('message', handler);
    ws.send(JSON.stringify(message));
  });
}

/** Make a JSON POST request */
export async function post(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: (await res.json()) as Record<string, unknown> };
}

/** Make a GET request */
export async function get(path: string) {
  const res = await fetch(`${BRIDGE_URL}${path}`);
  return { status: res.status, data: (await res.json()) as Record<string, unknown> };
}
