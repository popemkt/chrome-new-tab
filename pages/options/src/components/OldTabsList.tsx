import { useCallback, useState } from 'react';

interface OldTab {
  tab: chrome.tabs.Tab;
  lastAccessed: number;
  ageInDays: number;
  ageDisplay: string;
}

const formatTimeAgo = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const OldTabsList = () => {
  const [oldTabs, setOldTabs] = useState<OldTab[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTabId, setDeletingTabId] = useState<number | null>(null);
  const [tabCount, setTabCount] = useState(30);

  const scanForOldTabs = useCallback(async () => {
    setIsScanning(true);
    try {
      const tabs = await chrome.tabs.query({});
      const now = Date.now();
      const oldTabsData: OldTab[] = [];

      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          const lastAccessed = tab.lastAccessed || 0;
          const ageMs = now - lastAccessed;
          const ageInDays = ageMs / (1000 * 60 * 60 * 24);

          oldTabsData.push({
            tab,
            lastAccessed,
            ageInDays,
            ageDisplay: formatTimeAgo(ageMs),
          });
        }
      });

      // Sort by oldest first (smallest lastAccessed timestamp)
      oldTabsData.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // Take only the requested number of oldest tabs
      setOldTabs(oldTabsData.slice(0, tabCount));
    } catch (error) {
      console.error('Error scanning for old tabs:', error);
    } finally {
      setIsScanning(false);
    }
  }, [tabCount]);

  const closeTab = useCallback(
    async (tabId: number) => {
      setDeletingTabId(tabId);
      try {
        // Small delay for animation
        await new Promise(resolve => setTimeout(resolve, 200));
        await chrome.tabs.remove(tabId);
        await scanForOldTabs();
      } catch (error) {
        console.error('Error closing tab:', error);
      } finally {
        setDeletingTabId(null);
      }
    },
    [scanForOldTabs],
  );

  const closeAllOld = useCallback(async () => {
    if (oldTabs.length === 0) return;

    setIsDeleting(true);
    try {
      const tabIdsToClose = oldTabs.map(t => t.tab.id).filter((id): id is number => id !== undefined);

      if (tabIdsToClose.length > 0) {
        await chrome.tabs.remove(tabIdsToClose);
        await scanForOldTabs();
      }
    } catch (error) {
      console.error('Error closing all old tabs:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [oldTabs, scanForOldTabs]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-foreground">Old & Unused Tabs</h2>
        <p className="text-muted-foreground">Find tabs you haven't accessed recently, sorted from oldest to newest.</p>
      </div>

      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <div className="flex items-center gap-3">
          <label htmlFor="tabCount" className="text-sm font-medium text-foreground">
            Show top:
          </label>
          <input
            id="tabCount"
            type="number"
            min="1"
            max="200"
            value={tabCount}
            onChange={e => setTabCount(Math.max(1, parseInt(e.target.value) || 30))}
            className="w-24 px-4 py-3 bg-background border border-input text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <span className="text-sm text-muted-foreground">oldest tabs</span>
        </div>

        <button
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-semibold shadow-sm transition-all border-none cursor-pointer"
          onClick={scanForOldTabs}
          disabled={isScanning || isDeleting}>
          {isScanning ? 'Scanning...' : 'Scan for Old Tabs'}
        </button>

        {oldTabs.length > 0 && (
          <button
            className="px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-semibold shadow-sm transition-all border-none cursor-pointer"
            onClick={closeAllOld}
            disabled={isDeleting}>
            {isDeleting ? 'Closing...' : `Close All (${oldTabs.length} tabs)`}
          </button>
        )}
      </div>

      {oldTabs.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-6 text-foreground">Found {oldTabs.length} old tabs</h3>
          <div className="bg-card border border-border rounded-lg p-5 shadow-md">
            <ul className="space-y-2">
              {oldTabs.map(({ tab, lastAccessed, ageDisplay }) => (
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
                      <div className="flex gap-3 text-xs">
                        <span className="text-primary font-medium">Last accessed: {ageDisplay}</span>
                        <span className="text-muted-foreground">{formatDate(lastAccessed)}</span>
                      </div>
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
            <p className="text-xl text-foreground mb-2">No old tabs found! 🎉</p>
            <p className="text-sm text-muted-foreground italic">
              Click "Scan for Old Tabs" to check again or adjust the count.
            </p>
          </div>
        )
      )}
    </div>
  );
};
