import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStorage } from '@extension/shared';
import {
  exampleThemeStorage,
  themePresetStorage,
  themePresets,
  commandRegistry,
  commandPaletteShortcutStorage,
  sendExtensionMessage,
  type ThemeColors,
  type ShortcutConfig,
  type BookmarkResult,
} from '@extension/storage';

interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
}

type PaletteMode = 'commands' | 'bookmarks';

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function faviconUrl(pageUrl: string): string {
  try {
    const { hostname } = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

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

// SVG icons
const SearchIcon = () => (
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
);

const BookmarkIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

const BackIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const FolderIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

export default function App() {
  const theme = useStorage(exampleThemeStorage);
  const presetName = useStorage(themePresetStorage);
  const shortcut = useStorage(commandPaletteShortcutStorage) as ShortcutConfig;
  const isDark = theme === 'dark';
  const preset = themePresets.find(p => p.name === presetName) || themePresets[0];
  const t = getTokens(preset[isDark ? 'dark' : 'light'], isDark);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<PaletteMode>('commands');
  const [bookmarks, setBookmarks] = useState<BookmarkResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Build commands — search-bookmarks switches mode instead of sending a message
  const commands: Command[] = useMemo(
    () =>
      commandRegistry.map(def => ({
        id: def.id,
        label: def.label,
        description: def.description,
        action:
          def.id === 'search-bookmarks'
            ? () => {
                setMode('bookmarks');
                setQuery('');
                setSelectedIndex(0);
              }
            : () => {
                sendExtensionMessage({ type: 'EXECUTE_COMMAND', commandId: def.id });
              },
      })),
    [],
  );

  const filteredCommands = useMemo(
    () =>
      query
        ? commands.filter(
            cmd =>
              cmd.label.toLowerCase().includes(query.toLowerCase()) ||
              cmd.description?.toLowerCase().includes(query.toLowerCase()),
          )
        : commands,
    [query, commands],
  );

  // Search bookmarks when in bookmark mode
  useEffect(() => {
    if (mode !== 'bookmarks' || !debouncedQuery.trim()) {
      setBookmarks([]);
      return;
    }
    setIsSearching(true);
    sendExtensionMessage({ type: 'SEARCH_BOOKMARKS', query: debouncedQuery.trim() }).then(response => {
      setBookmarks(response?.bookmarks ?? []);
      setIsSearching(false);
      setSelectedIndex(0);
    });
  }, [debouncedQuery, mode]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setMode('commands');
    setBookmarks([]);
  }, []);

  const goBack = useCallback(() => {
    setMode('commands');
    setQuery('');
    setSelectedIndex(0);
    setBookmarks([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const executeCommand = useCallback(
    (cmd: Command) => {
      close();
      cmd.action();
    },
    [close],
  );

  const openBookmark = useCallback(
    (bookmark: BookmarkResult) => {
      close();
      window.open(bookmark.url, '_blank');
    },
    [close],
  );

  // Listen for keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shortcut) return;
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifier = shortcut.ctrlOrMeta ? (isMac ? e.metaKey : e.ctrlKey) : true;
      const shift = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const alt = shortcut.alt ? e.altKey : !e.altKey;

      if (modifier && shift && alt && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
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
  }, [shortcut]);

  // Focus input when opened or mode changes
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, mode]);

  // Items for current mode
  const currentItems = mode === 'commands' ? filteredCommands : bookmarks;

  // Handle keyboard navigation inside palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, currentItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (mode === 'commands' && filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          } else if (mode === 'bookmarks' && bookmarks[selectedIndex]) {
            openBookmark(bookmarks[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (mode === 'bookmarks') {
            goBack();
          } else {
            close();
          }
          break;
        case 'Backspace':
          if (mode === 'bookmarks' && query === '') {
            e.preventDefault();
            goBack();
          }
          break;
      }
    },
    [
      currentItems,
      filteredCommands,
      bookmarks,
      selectedIndex,
      mode,
      query,
      executeCommand,
      openBookmark,
      close,
      goBack,
    ],
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
        role="button"
        tabIndex={-1}
        onClick={close}
        onKeyDown={e => e.key === 'Escape' && close()}
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
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
            {mode === 'bookmarks' && (
              <button
                onClick={goBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: t.textMuted,
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                <BackIcon />
              </button>
            )}
            {mode === 'bookmarks' && (
              <span
                style={{
                  backgroundColor: t.kbd,
                  border: `1px solid ${t.kbdBorder}`,
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  color: t.textMuted,
                  flexShrink: 0,
                }}>
                Bookmarks
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'bookmarks' ? 'Search bookmarks...' : 'Type a command...'}
              style={{
                flex: 1,
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

          {/* List */}
          <div ref={listRef} style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
            {mode === 'commands' && (
              <>
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
                        {cmd.id === 'search-bookmarks' ? <BookmarkIcon /> : <SearchIcon />}
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
              </>
            )}

            {mode === 'bookmarks' && (
              <>
                {!debouncedQuery.trim() ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: t.textMuted, fontSize: '14px' }}>
                    Type to search bookmarks...
                  </div>
                ) : isSearching ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: t.textMuted, fontSize: '14px' }}>
                    Searching...
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: t.textMuted, fontSize: '14px' }}>
                    No bookmarks found
                  </div>
                ) : (
                  bookmarks.map((bm, index) => (
                    <button
                      key={bm.id}
                      onClick={() => openBookmark(bm)}
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
                      <img
                        src={faviconUrl(bm.url)}
                        alt=""
                        width="32"
                        height="32"
                        style={{
                          borderRadius: '6px',
                          backgroundColor: t.bgHover,
                          flexShrink: 0,
                          objectFit: 'contain',
                          padding: '6px',
                        }}
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                        }}
                      />
                      <div
                        style={{
                          display: 'none',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: index === selectedIndex ? t.accent : t.bgHover,
                          color: index === selectedIndex ? t.bg : t.textMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                        <BookmarkIcon />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                          {bm.title || 'Untitled'}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: t.textDim,
                            marginTop: '2px',
                          }}>
                          {bm.folder && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              <FolderIcon />
                              {bm.folder}
                              <span style={{ margin: '0 2px' }}>&middot;</span>
                            </span>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {bm.url}
                          </span>
                        </div>
                      </div>
                      <kbd style={kbdStyle}>Enter</kbd>
                    </button>
                  ))
                )}
              </>
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
              <kbd style={kbdStyle}>Enter</kbd> {mode === 'bookmarks' ? 'Open' : 'Run'}
            </span>
            <span>
              <kbd style={kbdStyle}>Esc</kbd> {mode === 'bookmarks' ? 'Back' : 'Close'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
