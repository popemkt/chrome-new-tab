import { useCallback, useState } from 'react';

interface DuplicateGroup {
  url: string;
  tabs: chrome.tabs.Tab[];
}

interface DuplicateTabsListProps {
  isLight: boolean;
}

export const DuplicateTabsList = ({ isLight }: DuplicateTabsListProps) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanForDuplicates = useCallback(async () => {
    setIsScanning(true);
    try {
      const tabs = await chrome.tabs.query({});
      const urlMap = new Map<string, chrome.tabs.Tab[]>();

      // Group tabs by URL
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          const existing = urlMap.get(tab.url) || [];
          existing.push(tab);
          urlMap.set(tab.url, existing);
        }
      });

      // Filter only URLs with duplicates (more than 1 tab)
      const duplicates: DuplicateGroup[] = [];
      urlMap.forEach((tabs, url) => {
        if (tabs.length > 1) {
          duplicates.push({ url, tabs });
        }
      });

      // Sort by number of duplicates (descending)
      duplicates.sort((a, b) => b.tabs.length - a.tabs.length);
      setDuplicateGroups(duplicates);
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const closeTab = useCallback(
    async (tabId: number) => {
      try {
        await chrome.tabs.remove(tabId);
        await scanForDuplicates();
      } catch (error) {
        console.error('Error closing tab:', error);
      }
    },
    [scanForDuplicates],
  );

  const closeDuplicates = useCallback(
    async (url: string) => {
      const group = duplicateGroups.find(g => g.url === url);
      if (!group || group.tabs.length <= 1) return;

      try {
        const tabIdsToClose = group.tabs.slice(1).map(tab => tab.id).filter((id): id is number => id !== undefined);
        if (tabIdsToClose.length > 0) {
          await chrome.tabs.remove(tabIdsToClose);
          await scanForDuplicates();
        }
      } catch (error) {
        console.error('Error closing duplicate tabs:', error);
      }
    },
    [duplicateGroups, scanForDuplicates],
  );

  const closeAllDuplicates = useCallback(async () => {
    if (duplicateGroups.length === 0) return;

    try {
      const allTabIdsToClose: number[] = [];

      duplicateGroups.forEach(group => {
        const tabIdsToClose = group.tabs
          .slice(1)
          .map(tab => tab.id)
          .filter((id): id is number => id !== undefined);
        allTabIdsToClose.push(...tabIdsToClose);
      });

      if (allTabIdsToClose.length > 0) {
        await chrome.tabs.remove(allTabIdsToClose);
        await scanForDuplicates();
      }
    } catch (error) {
      console.error('Error closing all duplicate tabs:', error);
    }
  }, [duplicateGroups, scanForDuplicates]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Duplicate Tabs</h2>
      <p className="mb-5 text-gray-600 dark:text-gray-400">Find and close tabs with identical URLs.</p>

      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <button
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          onClick={scanForDuplicates}
          disabled={isScanning}>
          {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
        </button>
        {duplicateGroups.length > 0 && (
          <button
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            onClick={closeAllDuplicates}>
            Close All Duplicates ({duplicateGroups.reduce((sum, g) => sum + g.tabs.length - 1, 0)} tabs)
          </button>
        )}
      </div>

      {duplicateGroups.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">
            Found {duplicateGroups.length} URLs with duplicates
          </h3>
          {duplicateGroups.map((group, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-red-600 dark:text-red-400 text-sm block mb-1">
                    {group.tabs.length} tabs
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate block" title={group.url}>
                    {group.url}
                  </span>
                </div>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  onClick={() => closeDuplicates(group.url)}
                  title="Close all duplicates except the first one">
                  Close {group.tabs.length - 1} Duplicate{group.tabs.length - 1 > 1 ? 's' : ''}
                </button>
              </div>
              <ul className="space-y-2">
                {group.tabs.map((tab, tabIndex) => (
                  <li
                    key={tab.id}
                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{tab.title || 'Untitled'}</span>
                      {tabIndex === 0 && (
                        <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                          Keep
                        </span>
                      )}
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
          ))}
        </div>
      ) : (
        !isScanning && (
          <div className="text-center py-10">
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">No duplicate tabs found! 🎉</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Click "Scan for Duplicates" to check again.</p>
          </div>
        )
      )}
    </div>
  );
};
