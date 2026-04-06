export type { CommandDef } from '@extension/protocol';
import type { CommandDef } from '@extension/protocol';

export const commandRegistry: CommandDef[] = [
  {
    id: 'open-options',
    label: 'Open Extension Settings',
    description: 'Open the extension options page',
    context: 'background',
  },
  {
    id: 'toggle-theme',
    label: 'Toggle Theme',
    description: 'Switch between light and dark mode',
    context: 'background',
  },
  {
    id: 'search-bookmarks',
    label: 'Search Bookmarks',
    description: 'Search and open browser bookmarks',
    context: 'content',
  },
];
