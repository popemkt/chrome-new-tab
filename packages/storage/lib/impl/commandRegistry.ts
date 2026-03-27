/** Shared command definitions used by the extension, command palette, and Raycast */
export interface CommandDef {
  id: string;
  label: string;
  description?: string;
  /** Which context can run this command */
  context: 'background' | 'content';
}

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
