import { useCallback, useEffect, useState } from 'react';
import { useStorage } from '@extension/shared';
import {
  exampleThemeStorage,
  themePresetStorage,
  themePresets,
  commandPaletteShortcutStorage,
  DEFAULT_SHORTCUT,
  type ThemePresetName,
  type ShortcutConfig,
} from '@extension/storage';

function formatShortcut(config: ShortcutConfig): string {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const parts: string[] = [];
  if (config.ctrlOrMeta) parts.push(isMac ? 'Cmd' : 'Ctrl');
  if (config.alt) parts.push('Alt');
  if (config.shift) parts.push('Shift');
  parts.push(config.key.length === 1 ? config.key.toUpperCase() : config.key);
  return parts.join(' + ');
}

export const Settings = () => {
  const theme = useStorage(exampleThemeStorage);
  const activePreset = useStorage(themePresetStorage);
  const shortcut = useStorage(commandPaletteShortcutStorage) as ShortcutConfig;
  const isLight = theme === 'light';

  const [recording, setRecording] = useState(false);

  const handlePresetChange = async (name: ThemePresetName) => {
    await themePresetStorage.setPreset(name);
  };

  const handleRecord = useCallback((e: KeyboardEvent) => {
    // Ignore lone modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    e.preventDefault();
    e.stopPropagation();

    const config: ShortcutConfig = {
      key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      ctrlOrMeta: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
    };

    commandPaletteShortcutStorage.setShortcut(config);
    setRecording(false);
  }, []);

  useEffect(() => {
    if (!recording) return;
    document.addEventListener('keydown', handleRecord, true);
    return () => document.removeEventListener('keydown', handleRecord, true);
  }, [recording, handleRecord]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">General extension settings. Each app has its own settings tab.</p>
      </div>

      {/* Appearance Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Appearance</h2>

        {/* Light/Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg mb-4">
          <div>
            <div className="font-medium text-card-foreground">Color Mode</div>
            <div className="text-sm text-muted-foreground">Switch between light and dark mode</div>
          </div>
          <button
            onClick={exampleThemeStorage.toggle}
            className="px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer font-medium text-sm">
            {isLight ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        {/* Theme Presets */}
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="mb-4">
            <div className="font-medium text-card-foreground">Theme</div>
            <div className="text-sm text-muted-foreground">Choose a color theme for the extension</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {themePresets.map(preset => {
              const isActive = activePreset === preset.name;
              const colors = isLight ? preset.light : preset.dark;

              return (
                <button
                  key={preset.name}
                  onClick={() => handlePresetChange(preset.name)}
                  className={`group relative flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer text-left ${
                    isActive ? 'border-primary shadow-sm' : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: colors.card }}>
                  {/* Color preview swatches */}
                  <div className="flex gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.accent }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.secondary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: colors.muted }}
                    />
                  </div>

                  {/* Theme name */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: colors['card-foreground'] }}>
                      {preset.label}
                    </span>
                    {isActive && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: colors.primary, color: colors['primary-foreground'] }}>
                        Active
                      </span>
                    )}
                  </div>

                  {/* Mini preview bar */}
                  <div className="w-full flex gap-1 h-1.5 rounded-full overflow-hidden">
                    <div className="flex-1 rounded-full" style={{ backgroundColor: colors.primary }} />
                    <div className="flex-1 rounded-full" style={{ backgroundColor: colors.accent }} />
                    <div className="flex-1 rounded-full" style={{ backgroundColor: colors.destructive }} />
                    <div className="flex-1 rounded-full" style={{ backgroundColor: colors.muted }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Keyboard Shortcut Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Keyboard Shortcut</h2>

        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div>
            <div className="font-medium text-card-foreground">Command Palette</div>
            <div className="text-sm text-muted-foreground">
              {recording ? 'Press your desired shortcut...' : 'Shortcut to open the command palette'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <kbd
              className={`px-3 py-1.5 rounded-md border font-mono text-sm ${
                recording
                  ? 'border-primary bg-primary/10 text-primary animate-pulse'
                  : 'border-border bg-secondary text-secondary-foreground'
              }`}>
              {recording ? 'Recording...' : shortcut ? formatShortcut(shortcut) : '...'}
            </kbd>
            <button
              onClick={() => setRecording(r => !r)}
              className="px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer font-medium text-sm">
              {recording ? 'Cancel' : 'Change'}
            </button>
            {shortcut && JSON.stringify(shortcut) !== JSON.stringify(DEFAULT_SHORTCUT) && (
              <button
                onClick={() => commandPaletteShortcutStorage.reset()}
                className="px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer font-medium text-sm">
                Reset
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
