import 'webextension-polyfill';
import {
  weightedUrlsStorage,
  exampleThemeStorage,
  commandRegistry,
  type ExtensionMessage,
  type BookmarkResult,
} from '@extension/storage';

const BRIDGE_WS_URL = 'ws://127.0.0.1:19816';
const RECONNECT_DELAY = 5_000;

// --- WebSocket Bridge ---

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function updateBadge(connected: boolean) {
  chrome.action.setBadgeText({ text: connected ? '' : '!' });
  chrome.action.setBadgeBackgroundColor({ color: connected ? '#4CAF50' : '#F44336' });
}

function connectBridge() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    ws = new WebSocket(BRIDGE_WS_URL);

    ws.onopen = () => {
      console.log('Bridge connected');
      updateBadge(true);
      // Sync commands immediately
      ws!.send(
        JSON.stringify({
          type: 'SYNC_COMMANDS',
          commands: commandRegistry,
          extensionId: chrome.runtime.id,
        }),
      );
      // Keep service worker alive with periodic pings (every 20s)
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 20_000);
    };

    ws.onmessage = event => {
      let msg: { type: string; commandId?: string; query?: string; requestId?: string };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'RELOAD_EXTENSION':
          console.log('Reloading extension...');
          chrome.runtime.reload();
          break;
        case 'EXECUTE_COMMAND':
          if (msg.commandId) executeCommand(msg.commandId);
          break;
        case 'SEARCH_BOOKMARKS':
          if (msg.query) {
            searchBookmarks(msg.query).then(bookmarks => {
              ws?.send(JSON.stringify({ type: 'RESPONSE', requestId: msg.requestId, data: { bookmarks } }));
            });
          }
          break;
        case 'SYNC_ACK':
          console.log('Commands synced to bridge');
          break;
      }
    };

    ws.onclose = () => {
      console.log('Bridge disconnected');
      ws = null;
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      updateBadge(false);
      reconnectTimer = setTimeout(connectBridge, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  } catch {
    ws = null;
    updateBadge(false);
    reconnectTimer = setTimeout(connectBridge, RECONNECT_DELAY);
  }
}

// --- Bookmark search ---

async function searchBookmarks(query: string): Promise<BookmarkResult[]> {
  const results = await chrome.bookmarks.search(query);
  const filtered = results.filter(b => b.url).slice(0, 20);

  // Resolve parent folder names in parallel
  const parentIds = [...new Set(filtered.map(b => b.parentId).filter(Boolean))] as string[];
  const parents = await Promise.all(
    parentIds.map(id =>
      chrome.bookmarks
        .get(id)
        .then(r => r[0])
        .catch(() => null),
    ),
  );
  const folderMap = new Map(parents.filter(Boolean).map(p => [p!.id, p!.title]));

  return filtered.map(b => ({
    id: b.id,
    title: b.title,
    url: b.url!,
    folder: (b.parentId && folderMap.get(b.parentId)) || undefined,
  }));
}

// --- Command execution ---

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

// Connect on startup
connectBridge();

chrome.runtime.onStartup.addListener(() => {
  connectBridge();
});

// --- Chrome keyboard shortcuts ---

chrome.commands.onCommand.addListener(async command => {
  if (command === 'open-command-palette') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_COMMAND_PALETTE' } satisfies ExtensionMessage);
    }
  }
});

// --- Message handler for content scripts and extension pages ---

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  // Ensure bridge is connected when handling messages (service worker may have restarted)
  connectBridge();

  switch (message.type) {
    case 'OPEN_OPTIONS_PAGE':
      executeCommand('open-options');
      sendResponse({ success: true });
      break;
    case 'EXECUTE_COMMAND':
      executeCommand(message.commandId);
      sendResponse({ success: true });
      break;
    case 'SEARCH_BOOKMARKS':
      searchBookmarks(message.query).then(bookmarks => {
        sendResponse({ bookmarks });
      });
      break;
  }
  return true;
});

console.log('Background service loaded');
