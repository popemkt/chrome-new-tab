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
      try {
        await chrome.tabs.remove(tabId);
        await scanForSuspicious();
      } catch (error) {
        console.error('Error closing tab:', error);
      }
    },
    [scanForSuspicious],
  );

  const closeAllSuspicious = useCallback(async () => {
    if (suspiciousTabs.length === 0) return;

    try {
      const tabIdsToClose = suspiciousTabs.map(s => s.tab.id).filter((id): id is number => id !== undefined);

      if (tabIdsToClose.length > 0) {
        await chrome.tabs.remove(tabIdsToClose);
        await scanForSuspicious();
      }
    } catch (error) {
      console.error('Error closing all suspicious tabs:', error);
    }
  }, [suspiciousTabs, scanForSuspicious]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Suspicious Tabs</h2>
      <p className="mb-5 text-gray-600 dark:text-gray-400">
        Find tabs that are likely unused - domain-only URLs without any specific page path.
      </p>

      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <button
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          onClick={scanForSuspicious}
          disabled={isScanning}>
          {isScanning ? 'Scanning...' : 'Scan for Suspicious Tabs'}
        </button>
        {suspiciousTabs.length > 0 && (
          <button
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            onClick={closeAllSuspicious}>
            Close All Suspicious ({suspiciousTabs.length} tabs)
          </button>
        )}
      </div>

      {suspiciousTabs.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">
            Found {suspiciousTabs.length} suspicious tabs
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <ul className="space-y-2">
              {suspiciousTabs.map(({ tab }) => (
                <li
                  key={tab.id}
                  className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{tab.title || 'Untitled'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{tab.url}</span>
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors flex-shrink-0"
                    onClick={() => tab.id && closeTab(tab.id)}
                    title="Close this tab">
                    ✕
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
