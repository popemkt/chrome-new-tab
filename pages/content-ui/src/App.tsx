import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStorage } from '@extension/shared';
import {
  exampleThemeStorage,
  themePresetStorage,
  themePresets,
  commandRegistry,
  type ThemeColors,
} from '@extension/storage';

interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
}

// Build runtime commands from the shared registry
const commands: Command[] = commandRegistry.map(def => ({
  id: def.id,
  label: def.label,
  description: def.description,
  action: () => {
    chrome.runtime.sendMessage({ type: 'EXECUTE_COMMAND', commandId: def.id });
  },
}));

function getTokens(colors: ThemeColors, isDark: boolean) {
  return {
    backdrop: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
    bg: colors.popover,
    bgHover: colors.muted,
    border: colors.border,
    text: colors['popover-foreground'],
    textMuted: colors['muted-foreground'],
    textDim: colors['muted-foreground'],
    accent: colors.primary,
    kbd: colors.secondary,
    kbdBorder: colors.border,
    shadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  };
}

export default function App() {
  const theme = useStorage(exampleThemeStorage);
  const presetName = useStorage(themePresetStorage);
  const isDark = theme === 'dark';
  const preset = themePresets.find(p => p.name === presetName) || themePresets[0];
  const t = getTokens(preset[isDark ? 'dark' : 'light'], isDark);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = useMemo(
    () =>
      query
        ? commands.filter(
            cmd =>
              cmd.label.toLowerCase().includes(query.toLowerCase()) ||
              cmd.description?.toLowerCase().includes(query.toLowerCase()),
          )
        : commands,
    [query],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const executeCommand = useCallback(
    (cmd: Command) => {
      close();
      cmd.action();
    },
    [close],
  );

  // Listen for keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
      }
    };

    // Also listen for Chrome command relay from content script
    const handleChromeCommand = () => setIsOpen(prev => !prev);

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('popemkt-toggle-command-palette', handleChromeCommand);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popemkt-toggle-command-palette', handleChromeCommand);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Handle keyboard navigation inside palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [filteredCommands, selectedIndex, executeCommand, close],
  );

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const kbdStyle: React.CSSProperties = {
    backgroundColor: t.kbd,
    padding: '1px 5px',
    borderRadius: '4px',
    border: `1px solid ${t.kbdBorder}`,
    fontSize: '10px',
    marginRight: '4px',
    color: t.textMuted,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: t.backdrop,
          backdropFilter: 'blur(2px)',
          zIndex: 2147483646,
        }}
      />

      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '560px',
          zIndex: 2147483647,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
        <div
          style={{
            backgroundColor: t.bg,
            borderRadius: '12px',
            border: `1px solid ${t.border}`,
            boxShadow: t.shadow,
            overflow: 'hidden',
          }}>
          {/* Search input */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}` }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: t.text,
                fontSize: '15px',
                lineHeight: '24px',
                padding: 0,
              }}
            />
          </div>

          {/* Command list */}
          <div ref={listRef} style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
            {filteredCommands.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: t.textMuted, fontSize: '14px' }}>
                No commands found
              </div>
            ) : (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    backgroundColor: index === selectedIndex ? t.bgHover : 'transparent',
                    color: index === selectedIndex ? t.text : t.textMuted,
                    transition: 'background-color 0.1s',
                  }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: index === selectedIndex ? t.accent : t.bgHover,
                      color: index === selectedIndex ? t.bg : t.textMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background-color 0.1s, color 0.1s',
                    }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{cmd.label}</div>
                    {cmd.description && (
                      <div style={{ fontSize: '12px', color: t.textDim, marginTop: '2px' }}>{cmd.description}</div>
                    )}
                  </div>
                  <kbd style={kbdStyle}>Enter</kbd>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 16px',
              borderTop: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '11px',
              color: t.textDim,
            }}>
            <span>
              <kbd style={kbdStyle}>↑↓</kbd> Navigate
            </span>
            <span>
              <kbd style={kbdStyle}>Enter</kbd> Run
            </span>
            <span>
              <kbd style={kbdStyle}>Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
