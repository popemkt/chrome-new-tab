import { WebSocket } from 'ws';
import { CDP_PORT } from './config.ts';
import { log } from './logger.ts';

interface CDPTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

function cdpEvaluate(wsUrl: string, expression: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('CDP evaluate timed out'));
    }, 10_000);

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true },
        }),
      );
    });

    ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === 1) {
        clearTimeout(timeout);
        ws.close();
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });

    ws.on('error', err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function getTargets(): Promise<CDPTarget[]> {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  if (!res.ok) throw new Error(`CDP not available (is Edge running with --remote-debugging-port=${CDP_PORT}?)`);
  return (await res.json()) as CDPTarget[];
}

async function findOrOpenExtensionsPage(): Promise<CDPTarget> {
  let targets = await getTargets();

  // Look for an existing extensions page
  let target = targets.find(t => /^(chrome|edge):\/\/extensions/.test(t.url));

  if (!target) {
    // Open one via CDP
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?chrome://extensions`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to open extensions page via CDP');
    // Wait for page to load
    await new Promise(r => setTimeout(r, 2000));
    // Re-fetch targets to get the webSocketDebuggerUrl
    targets = await getTargets();
    target = targets.find(t => /^(chrome|edge):\/\/extensions/.test(t.url));
  }

  if (!target?.webSocketDebuggerUrl) {
    throw new Error('Could not find extensions page target with debug URL');
  }

  return target;
}

/**
 * Reload an unpacked extension via CDP using chrome.developerPrivate.reload().
 * This is equivalent to clicking the reload button on chrome://extensions.
 * Requires the browser to be running with --remote-debugging-port=9222.
 */
export async function reloadExtensionViaCDP(extensionId: string): Promise<void> {
  const target = await findOrOpenExtensionsPage();
  const wsUrl = target.webSocketDebuggerUrl!;

  // Ensure the extension is enabled first (no-op if already enabled)
  log(`Enabling + reloading extension ${extensionId} via CDP`);
  await cdpEvaluate(wsUrl, `chrome.management.setEnabled('${extensionId}', true)`);
  await cdpEvaluate(wsUrl, `chrome.developerPrivate.reload('${extensionId}', {failQuietly: true})`);
  log('Extension reloaded via CDP');
}
