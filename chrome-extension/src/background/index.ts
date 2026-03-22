import 'webextension-polyfill';
import { weightedUrlsStorage, exampleThemeStorage, commandRegistry } from '@extension/storage';

const NATIVE_HOST_NAME = 'com.popemkt.bridge';

// --- Native Messaging Bridge ---

let nativePort: chrome.runtime.Port | null = null;

function connectNativeHost() {
  try {
    const port = chrome.runtime.connectNative(NATIVE_HOST_NAME);

    port.onMessage.addListener((msg: { type: string; commandId?: string }) => {
      if (msg.type === 'EXECUTE_COMMAND' && msg.commandId) {
        executeCommand(msg.commandId);
      } else if (msg.type === 'SYNC_ACK') {
        console.log('Commands synced to native host');
      }
    });

    port.onDisconnect.addListener(() => {
      const err = chrome.runtime.lastError;
      nativePort = null;
      if (err) {
        console.log('Native host:', err.message);
      }
      // Reconnect after a delay (service worker may have woken up)
      setTimeout(connectNativeHost, 5_000);
    });

    nativePort = port;

    // Sync immediately — if the host isn't there, postMessage is a no-op
    // and onDisconnect will fire and clean up
    port.postMessage({
      type: 'SYNC_COMMANDS',
      commands: commandRegistry,
      extensionId: chrome.runtime.id,
    });
  } catch {
    nativePort = null;
  }
}

// --- Command execution (shared between message handler and native bridge) ---

function executeCommand(commandId: string) {
  switch (commandId) {
    case 'open-options':
      chrome.runtime.openOptionsPage();
      break;
    case 'toggle-theme':
      exampleThemeStorage.toggle();
      break;
    default:
      console.warn('Unknown command:', commandId);
  }
}

// --- Extension lifecycle ---

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  await weightedUrlsStorage.migrateFromOldFormat();
  const urls = await weightedUrlsStorage.get();
  console.log(`Initialized with ${urls.length} URLs`);
});

// Try to connect native host on startup (silently fails if not installed)
connectNativeHost();

chrome.runtime.onStartup.addListener(() => {
  connectNativeHost();
});

// --- Chrome keyboard shortcuts ---

chrome.commands.onCommand.addListener(async command => {
  if (command === 'open-command-palette') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_COMMAND_PALETTE' });
    }
  }
});

// --- Message handler for content scripts and extension pages ---

// Ensure native host is connected when handling messages (service worker may have restarted)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!nativePort) connectNativeHost();
  if (message.type === 'OPEN_OPTIONS_PAGE') {
    executeCommand('open-options');
    sendResponse({ success: true });
  } else if (message.type === 'EXECUTE_COMMAND' && message.commandId) {
    executeCommand(message.commandId);
    sendResponse({ success: true });
  }
  return true;
});

console.log('Background service loaded');
