// ==========================================================================
// Config — network constants shared by bridge, extension, and Raycast
// ==========================================================================

export const BRIDGE_PORT = 19816;
export const BRIDGE_HOST = '127.0.0.1';
export const BRIDGE_HTTP_URL = `http://${BRIDGE_HOST}:${BRIDGE_PORT}`;
export const BRIDGE_WS_URL = `ws://${BRIDGE_HOST}:${BRIDGE_PORT}`;
export const CDP_PORT = 9222;

/** Data directory relative to home (used by bridge and Raycast for cached state) */
export const DATA_DIR_NAME = '.popemkt/browser-extension';
export const COMMANDS_FILENAME = 'commands.json';

// ==========================================================================
// Types — shared domain types
// ==========================================================================

/** A command that can be executed by the extension, command palette, or Raycast */
export interface CommandDef {
  id: string;
  label: string;
  description?: string;
  /** Which extension context can run this command */
  context: 'background' | 'content';
}

/** A bookmark search result returned by the extension */
export interface BookmarkResult {
  id: string;
  title: string;
  url: string;
  folder?: string;
}

// ==========================================================================
// Messages — Chrome extension internal (chrome.runtime.sendMessage)
// ==========================================================================

export type ExtensionMessage =
  | { type: 'EXECUTE_COMMAND'; commandId: string }
  | { type: 'OPEN_OPTIONS_PAGE' }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'SEARCH_BOOKMARKS'; query: string };

/** Maps each extension message type to its expected response */
export type ExtensionResponseMap = {
  EXECUTE_COMMAND: { success: boolean };
  OPEN_OPTIONS_PAGE: { success: boolean };
  TOGGLE_COMMAND_PALETTE: void;
  SEARCH_BOOKMARKS: { bookmarks: BookmarkResult[] };
};

// ==========================================================================
// Messages — Bridge WebSocket protocol (bridge <-> extension)
// ==========================================================================

/** Messages sent from the extension to the bridge */
export type BridgeUpMessage =
  | { type: 'SYNC_COMMANDS'; commands: CommandDef[]; extensionId: string }
  | { type: 'PING' }
  | { type: 'RESPONSE'; requestId: string; data: unknown }
  | { type: 'COMMAND_RESULT' };

/** Messages sent from the bridge to the extension */
export type BridgeDownMessage =
  | { type: 'SYNC_ACK'; count: number }
  | { type: 'PONG' }
  | { type: 'EXECUTE_COMMAND'; commandId: string; requestId?: string }
  | { type: 'SEARCH_BOOKMARKS'; query: string; requestId?: string }
  | { type: 'RELOAD_EXTENSION' };
