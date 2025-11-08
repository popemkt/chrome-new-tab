import { useCallback, useState } from 'react';

interface SuspiciousTab {
  tab: chrome.tabs.Tab;
  url: string;
}

interface SuspiciousTabsListProps {
  isLight: boolean;
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

export const SuspiciousTabsList = ({ isLight }: SuspiciousTabsListProps) => {
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
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Suspicious Tabs</h2>
        <p className="text-gray-600 dark:text-gray-400">
        Find tabs that are likely unused - domain-only URLs without any specific page path.
      </p>

      </div>

      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <button
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          onClick={scanForSuspicious}
          disabled={isScanning || isDeleting}>
          {isScanning ? 'Scanning...' : 'Scan for Suspicious Tabs'}
        </button>
        {suspiciousTabs.length > 0 && (
          <button
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all hover:scale-105"
            onClick={closeAllSuspicious}
            disabled={isDeleting}>
            {isDeleting ? 'Closing...' : `Close All Suspicious (${suspiciousTabs.length} tabs)`}
          </button>
        )}
      </div>

      {suspiciousTabs.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Found {suspiciousTabs.length} suspicious tabs
          </h3>
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-md">
            <ul className="space-y-2">
              {suspiciousTabs.map(({ tab }) => (
                <li
                  key={tab.id}
                  className={`flex justify-between items-center p-4 bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-xl gap-3 shadow-sm hover:shadow-md transition-all duration-200 ${
                    deletingTabId === tab.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{tab.title || 'Untitled'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{tab.url}</span>
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
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">No suspicious tabs found! 🎉</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Click "Scan for Suspicious Tabs" to check again.</p>
          </div>
        )
      )}
    </div>
  );
};
