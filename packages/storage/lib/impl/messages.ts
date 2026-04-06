export type { ExtensionMessage, ExtensionResponseMap, BookmarkResult } from '@extension/protocol';
import type { ExtensionMessage, ExtensionResponseMap } from '@extension/protocol';

/** @deprecated Use ExtensionResponseMap instead */
export type MessageResponseMap = ExtensionResponseMap;

/** Type-safe sendMessage wrapper */
export function sendExtensionMessage<T extends ExtensionMessage>(message: T): Promise<ExtensionResponseMap[T['type']]> {
  return chrome.runtime.sendMessage(message);
}
