import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

export type ShortcutConfig = {
  key: string;
  ctrlOrMeta: boolean;
  shift: boolean;
  alt: boolean;
};

const DEFAULT_SHORTCUT: ShortcutConfig = { key: 'p', ctrlOrMeta: true, shift: true, alt: false };

type ShortcutStorage = BaseStorage<ShortcutConfig> & {
  setShortcut: (config: ShortcutConfig) => Promise<void>;
  reset: () => Promise<void>;
};

const storage = createStorage<ShortcutConfig>('command-palette-shortcut', DEFAULT_SHORTCUT, {
  storageEnum: StorageEnum.Sync,
  liveUpdate: true,
});

export const commandPaletteShortcutStorage: ShortcutStorage = {
  ...storage,
  setShortcut: async (config: ShortcutConfig) => {
    await storage.set(config);
  },
  reset: async () => {
    await storage.set(DEFAULT_SHORTCUT);
  },
};

export { DEFAULT_SHORTCUT };
