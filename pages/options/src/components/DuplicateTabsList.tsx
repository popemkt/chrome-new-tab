import { useCallback, useState } from 'react';

interface DuplicateGroup {
  url: string;
  tabs: chrome.tabs.Tab[];
}

export function DuplicateTabsList(): React.ReactElement {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTabId, setDeletingTabId] = useState<number | null>(null);

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
      setDeletingTabId(tabId);
      try {
        // Small delay for animation
        await new Promise(resolve => setTimeout(resolve, 200));
        await chrome.tabs.remove(tabId);
        await scanForDuplicates();
      } catch (error) {
        console.error('Error closing tab:', error);
      } finally {
        setDeletingTabId(null);
      }
    },
    [scanForDuplicates],
  );

  const closeDuplicates = useCallback(
    async (url: string) => {
      const group = duplicateGroups.find(g => g.url === url);
      if (!group || group.tabs.length <= 1) return;

      setIsDeleting(true);
      try {
        const tabIdsToClose = group.tabs
          .slice(1)
          .map(tab => tab.id)
          .filter((id): id is number => id !== undefined);
        if (tabIdsToClose.length > 0) {
          await chrome.tabs.remove(tabIdsToClose);
          await scanForDuplicates();
        }
      } catch (error) {
        console.error('Error closing duplicate tabs:', error);
      } finally {
        setIsDeleting(false);
      }
    },
    [duplicateGroups, scanForDuplicates],
  );

  const closeAllDuplicates = useCallback(async () => {
    if (duplicateGroups.length === 0) return;

    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  }, [duplicateGroups, scanForDuplicates]);

  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.tabs.length - 1, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-foreground">Duplicate Tabs</h2>
        <p className="text-muted-foreground">Find and close tabs with identical URLs.</p>
      </div>

      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <button
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-sm transition-colors border-none cursor-pointer"
          onClick={scanForDuplicates}
          disabled={isScanning || isDeleting}>
          {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
        </button>
        {duplicateGroups.length > 0 && (
          <button
            className="px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-sm transition-colors border-none cursor-pointer"
            onClick={closeAllDuplicates}
            disabled={isDeleting}>
            {isDeleting ? 'Closing...' : `Close All Duplicates (${totalDuplicates} tabs)`}
          </button>
        )}
      </div>

      {duplicateGroups.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-6 text-foreground">
            Found {duplicateGroups.length} URLs with duplicates
          </h3>
          {duplicateGroups.map((group, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-5 mb-5 shadow-sm">
              <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-destructive text-sm block mb-1">{group.tabs.length} tabs</span>
                  <span className="text-sm text-foreground truncate block" title={group.url}>
                    {group.url}
                  </span>
                </div>
                <button
                  className="px-5 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-semibold shadow-sm transition-colors whitespace-nowrap border-none cursor-pointer"
                  onClick={() => closeDuplicates(group.url)}
                  disabled={isDeleting}
                  title="Close all duplicates except the first one">
                  {isDeleting
                    ? 'Closing...'
                    : `Close ${group.tabs.length - 1} Duplicate${group.tabs.length - 1 > 1 ? 's' : ''}`}
                </button>
              </div>
              <ul className="space-y-2">
                {group.tabs.map((tab, tabIndex) => (
                  <li
                    key={tab.id}
                    className={`flex justify-between items-center p-4 bg-background border border-border rounded-md gap-3 shadow-sm hover:shadow-md transition-all duration-200 ${
                      deletingTabId === tab.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-sm text-foreground truncate">{tab.title || 'Untitled'}</span>
                      {tabIndex === 0 && (
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                          Keep
                        </span>
                      )}
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
          ))}
        </div>
      ) : (
        !isScanning && (
          <div className="text-center py-10">
            <p className="text-xl text-foreground mb-2">No duplicate tabs found!</p>
            <p className="text-sm text-muted-foreground italic">Click "Scan for Duplicates" to check again.</p>
          </div>
        )
      )}
    </div>
  );
}
