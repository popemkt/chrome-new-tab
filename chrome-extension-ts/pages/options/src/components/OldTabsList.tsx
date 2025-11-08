import { useCallback, useState } from 'react';

interface OldTab {
  tab: chrome.tabs.Tab;
  lastAccessed: number;
  ageInDays: number;
  ageDisplay: string;
}

interface OldTabsListProps {
  isLight: boolean;
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

export const OldTabsList = ({ isLight }: OldTabsListProps) => {
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
          // lastAccessed is in milliseconds since epoch
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
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Old & Unused Tabs</h2>
      <p className="mb-5 text-gray-600 dark:text-gray-400">
        Find tabs you haven't accessed recently, sorted from oldest to newest.
      </p>

      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <div className="flex items-center gap-3">
          <label htmlFor="tabCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show top:
          </label>
          <input
            id="tabCount"
            type="number"
            min="1"
            max="200"
            value={tabCount}
            onChange={e => setTabCount(Math.max(1, parseInt(e.target.value) || 30))}
            className={`w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">oldest tabs</span>
        </div>

        <button
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          onClick={scanForOldTabs}
          disabled={isScanning || isDeleting}>
          {isScanning ? 'Scanning...' : 'Scan for Old Tabs'}
        </button>

        {oldTabs.length > 0 && (
          <button
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            onClick={closeAllOld}
            disabled={isDeleting}>
            {isDeleting ? 'Closing...' : `Close All (${oldTabs.length} tabs)`}
          </button>
        )}
      </div>

      {oldTabs.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">
            Found {oldTabs.length} old tabs
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <ul className="space-y-2">
              {oldTabs.map(({ tab, lastAccessed, ageDisplay }) => (
                <li
                  key={tab.id}
                  className={`flex justify-between items-center p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg gap-3 transition-all duration-200 ${
                    deletingTabId === tab.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{tab.title || 'Untitled'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{tab.url}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          Last accessed: {ageDisplay}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">{formatDate(lastAccessed)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">No old tabs found! 🎉</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Click "Scan for Old Tabs" to check again or adjust the count.
            </p>
          </div>
        )
      )}
    </div>
  );
};
