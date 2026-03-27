/** Typed messages passed between content scripts, background, and native host */

export type ExtensionMessage =
  | { type: 'EXECUTE_COMMAND'; commandId: string }
  | { type: 'OPEN_OPTIONS_PAGE' }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'SEARCH_BOOKMARKS'; query: string };

export type BookmarkResult = {
  id: string;
  title: string;
  url: string;
  folder?: string;
};

/** Response map: message type -> response type */
export type MessageResponseMap = {
  EXECUTE_COMMAND: { success: boolean };
  OPEN_OPTIONS_PAGE: { success: boolean };
  TOGGLE_COMMAND_PALETTE: void;
  SEARCH_BOOKMARKS: { bookmarks: BookmarkResult[] };
};

/** Type-safe sendMessage wrapper */
export function sendExtensionMessage<T extends ExtensionMessage>(message: T): Promise<MessageResponseMap[T['type']]> {
  return chrome.runtime.sendMessage(message);
}
