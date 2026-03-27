import { ActionPanel, Action, List, showToast, Toast, Icon, Image } from '@raycast/api';
import { useState, useEffect, useRef } from 'react';

const BRIDGE_URL = 'http://127.0.0.1:19816';

function faviconUrl(pageUrl: string): string {
  try {
    const { hostname } = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

interface BookmarkResult {
  id: string;
  title: string;
  url: string;
  folder?: string;
}

export default function SearchBookmarks() {
  const [query, setQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setBookmarks([]);
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      fetch(`${BRIDGE_URL}/search-bookmarks?q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<{ bookmarks: BookmarkResult[] }>;
        })
        .then(data => {
          if (!controller.signal.aborted) {
            setBookmarks(data.bookmarks ?? []);
            setIsLoading(false);
          }
        })
        .catch(err => {
          if (controller.signal.aborted) return;
          setIsLoading(false);
          if ((err as Error).name !== 'AbortError') {
            showToast({
              style: Toast.Style.Failure,
              title: 'Search failed',
              message: 'Make sure Chrome is open with the extension installed.',
            });
          }
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <List searchBarPlaceholder="Search bookmarks..." onSearchTextChange={setQuery} isLoading={isLoading} throttle>
      {bookmarks.map(bm => (
        <List.Item
          key={bm.id}
          icon={{
            source: faviconUrl(bm.url) || Icon.Bookmark,
            fallback: Icon.Bookmark,
            mask: Image.Mask.RoundedRectangle,
          }}
          title={bm.title || 'Untitled'}
          subtitle={bm.url}
          accessories={bm.folder ? [{ tag: bm.folder, icon: Icon.Folder }] : []}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={bm.url} />
              <Action.CopyToClipboard title="Copy URL" content={bm.url} />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && query.trim() && bookmarks.length === 0 && (
        <List.EmptyView
          title="No bookmarks found"
          description={`No results for "${query}"`}
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}
