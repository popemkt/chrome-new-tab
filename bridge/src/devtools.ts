import { WebSocket } from 'ws';
import { CDP_PORT } from './config.ts';
import { log } from './logger.ts';
import { ctx } from './state.ts';

export interface CDPTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

/** Send a CDP command over a WebSocket and return the result */
function cdpSend(wsUrl: string, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('CDP command timed out'));
    }, 10_000);

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method, params }));
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

function cdpEvaluate(wsUrl: string, expression: string): Promise<unknown> {
  return cdpSend(wsUrl, 'Runtime.evaluate', { expression, awaitPromise: true });
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
 * Send a keyboard shortcut to the browser at the OS level.
 * CDP can only dispatch to the renderer — browser-level shortcuts (Ctrl+H, etc.)
 * must be sent via OS-level input so the browser process receives them.
 * Uses ctx.browser.pid (populated by probeBrowser) to focus the window.
 */
export async function sendBrowserShortcut(
  key: string,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {},
): Promise<void> {
  const { execSync } = await import('node:child_process');
  const pid = ctx.browser.pid;
  if (!pid) throw new Error('Browser PID not known (is CDP available?)');

  // Build SendKeys string: ^ = Ctrl, + = Shift, % = Alt
  let sendKey = '';
  if (modifiers.ctrl) sendKey += '^';
  if (modifiers.shift) sendKey += '+';
  if (modifiers.alt) sendKey += '%';
  sendKey += key.toLowerCase();

  const ps = `$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate(${pid}) | Out-Null; Start-Sleep -Milliseconds 200; $wshell.SendKeys('${sendKey}')`;
  execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, { timeout: 5000 });

  log(
    `Sent OS shortcut to PID ${pid}: ${modifiers.ctrl ? 'Ctrl+' : ''}${modifiers.shift ? 'Shift+' : ''}${modifiers.alt ? 'Alt+' : ''}${key}`,
  );
}

export async function reloadExtensionViaCDP(extensionId: string): Promise<void> {
  const target = await findOrOpenExtensionsPage();
  const wsUrl = target.webSocketDebuggerUrl!;

  // Ensure the extension is enabled first (no-op if already enabled)
  log(`Enabling + reloading extension ${extensionId} via CDP`);
  await cdpEvaluate(wsUrl, `chrome.management.setEnabled('${extensionId}', true)`);
  await cdpEvaluate(wsUrl, `chrome.developerPrivate.reload('${extensionId}', {failQuietly: true})`);
  log('Extension reloaded via CDP');
}
