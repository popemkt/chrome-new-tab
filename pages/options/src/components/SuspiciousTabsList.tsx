import { useCallback, useState } from 'react';

interface SuspiciousTab {
  tab: chrome.tabs.Tab;
  url: string;
}

/**
 * Check if a URL is suspicious (no path after domain)
 * Examples: youtube.com, youtube.com/, google.com
 */
const isSuspiciousUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Check if pathname is empty or just "/"
    const hasNoPath = urlObj.pathname === '/' || urlObj.pathname === '';
    // Check if there's no search params or hash
    const hasNoParams = urlObj.search === '' && urlObj.hash === '';
    return hasNoPath && hasNoParams;
  } catch {
    return false;
  }
};

export const SuspiciousTabsList = () => {
  const [suspiciousTabs, setSuspiciousTabs] = useState<SuspiciousTab[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTabId, setDeletingTabId] = useState<number | null>(null);

  const scanForSuspicious = useCallback(async () => {
    setIsScanning(true);
    try {
      const tabs = await chrome.tabs.query({});
      const suspicious: SuspiciousTab[] = [];

      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          if (isSuspiciousUrl(tab.url)) {
            suspicious.push({ tab, url: tab.url });
          }
        }
      });

      setSuspiciousTabs(suspicious);
    } catch (error) {
      console.error('Error scanning for suspicious tabs:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const closeTab = useCallback(
    async (tabId: number) => {
      setDeletingTabId(tabId);
      try {
        // Small delay for animation
        await new Promise(resolve => setTimeout(resolve, 200));
        await chrome.tabs.remove(tabId);
        await scanForSuspicious();
      } catch (error) {
        console.error('Error closing tab:', error);
      } finally {
        setDeletingTabId(null);
      }
    },
    [scanForSuspicious],
  );

  const closeAllSuspicious = useCallback(async () => {
    if (suspiciousTabs.length === 0) return;

    setIsDeleting(true);
    try {
      const tabIdsToClose = suspiciousTabs.map(s => s.tab.id).filter((id): id is number => id !== undefined);

      if (tabIdsToClose.length > 0) {
        await chrome.tabs.remove(tabIdsToClose);
        await scanForSuspicious();
      }
    } catch (error) {
      console.error('Error closing all suspicious tabs:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [suspiciousTabs, scanForSuspicious]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Suspicious Tabs</h2>
        <p className="text-sm text-muted-foreground">
          Find tabs that are likely unused - domain-only URLs without any specific page path.
        </p>
      </div>

      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <button
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-sm transition-colors border-none cursor-pointer"
          onClick={scanForSuspicious}
          disabled={isScanning || isDeleting}>
          {isScanning ? 'Scanning...' : 'Scan for Suspicious Tabs'}
        </button>
        {suspiciousTabs.length > 0 && (
          <button
            className="px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-sm transition-colors border-none cursor-pointer"
            onClick={closeAllSuspicious}
            disabled={isDeleting}>
            {isDeleting ? 'Closing...' : `Close All Suspicious (${suspiciousTabs.length} tabs)`}
          </button>
        )}
      </div>

      {suspiciousTabs.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-6 text-foreground">Found {suspiciousTabs.length} suspicious tabs</h3>
          <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
            <ul className="space-y-2">
              {suspiciousTabs.map(({ tab }) => (
                <li
                  key={tab.id}
                  className={`flex justify-between items-center p-4 bg-background border border-border rounded-md gap-3 shadow-sm hover:shadow-md transition-all duration-200 ${
                    deletingTabId === tab.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-sm text-foreground truncate">{tab.title || 'Untitled'}</span>
                      <span className="text-xs text-muted-foreground truncate">{tab.url}</span>
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                    onClick={() => tab.id && closeTab(tab.id)}
                    disabled={deletingTabId === tab.id || isDeleting}
                    title="Close this tab">
                    {deletingTabId === tab.id ? '⏳' : '✕'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        !isScanning && (
          <div className="text-center py-10">
            <p className="text-xl text-foreground mb-2">No suspicious tabs found!</p>
            <p className="text-sm text-muted-foreground italic">Click "Scan for Suspicious Tabs" to check again.</p>
          </div>
        )
      )}
    </div>
  );
};
