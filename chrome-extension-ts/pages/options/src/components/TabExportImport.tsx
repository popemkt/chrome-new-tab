import { useCallback, useState } from 'react';

interface TabExportImportProps {
  isLight: boolean;
}

interface ExportedTab {
  url: string;
  title: string;
  favIconUrl?: string;
  pinned: boolean;
  groupId: number;
  index: number;
  windowId: number;
  active: boolean;
  audible?: boolean;
  mutedInfo?: chrome.tabs.MutedInfo;
  lastAccessed?: number;
}

interface ExportedGroup {
  id: number;
  title?: string;
  color: chrome.tabGroups.ColorEnum;
  collapsed: boolean;
}

interface ExportedWindow {
  id: number;
  focused: boolean;
  incognito: boolean;
  type: string;
  state?: string;
}

interface ExportData {
  version: string;
  exportDate: string;
  totalTabs: number;
  tabs: ExportedTab[];
  groups: ExportedGroup[];
  windows: ExportedWindow[];
}

export const TabExportImport = ({ isLight }: TabExportImportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [batchSize, setBatchSize] = useState(10);
  const [batchDelay, setBatchDelay] = useState(100);

  const exportTabs = useCallback(async () => {
    setIsExporting(true);
    setStatusMessage('');

    try {
      // Get all tabs
      const tabs = await chrome.tabs.query({});

      // Get all tab groups (check if API is available)
      let groups: chrome.tabGroups.TabGroup[] = [];
      if (chrome.tabGroups && typeof chrome.tabGroups.query === 'function') {
        try {
          groups = await chrome.tabGroups.query({});
        } catch (error) {
          console.warn('Tab groups API not available:', error);
        }
      }

      // Get all windows
      const windows = await chrome.windows.getAll();

      // Map tabs with full metadata
      const exportedTabs: ExportedTab[] = tabs.map(tab => ({
        url: tab.url || '',
        title: tab.title || '',
        favIconUrl: tab.favIconUrl,
        pinned: tab.pinned || false,
        groupId: tab.groupId || -1,
        index: tab.index,
        windowId: tab.windowId,
        active: tab.active || false,
        audible: tab.audible,
        mutedInfo: tab.mutedInfo,
        lastAccessed: tab.lastAccessed,
      }));

      // Map groups
      const exportedGroups: ExportedGroup[] = groups.map(group => ({
        id: group.id,
        title: group.title,
        color: group.color,
        collapsed: group.collapsed,
      }));

      // Map windows
      const exportedWindows: ExportedWindow[] = windows.map(win => ({
        id: win.id || -1,
        focused: win.focused,
        incognito: win.incognito,
        type: win.type || 'normal',
        state: win.state,
      }));

      const exportData: ExportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalTabs: exportedTabs.length,
        tabs: exportedTabs,
        groups: exportedGroups,
        windows: exportedWindows,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tabs-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`✅ Exported ${exportedTabs.length} tabs successfully!`);
    } catch (error) {
      console.error('Error exporting tabs:', error);
      setStatusMessage('❌ Error exporting tabs. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importTabs = useCallback(async (file: File) => {
    setIsImporting(true);
    setStatusMessage('');
    setImportProgress(null);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.tabs || !Array.isArray(data.tabs)) {
        throw new Error('Invalid export file format');
      }

      setImportProgress({ current: 0, total: data.tabs.length });

      // Group tabs by window for organized import
      const tabsByWindow = new Map<number, ExportedTab[]>();
      data.tabs.forEach(tab => {
        if (!tabsByWindow.has(tab.windowId)) {
          tabsByWindow.set(tab.windowId, []);
        }
        tabsByWindow.get(tab.windowId)!.push(tab);
      });

      // Create a mapping of old group IDs to new group IDs
      const groupIdMap = new Map<number, number>();

      let importedCount = 0;

      // Process each window
      for (const [oldWindowId, windowTabs] of tabsByWindow) {
        // Sort tabs by index to maintain order
        windowTabs.sort((a, b) => a.index - b.index);

        // Create new window (or use current window for first batch)
        const isFirstWindow = oldWindowId === Array.from(tabsByWindow.keys())[0];
        let targetWindowId: number;

        if (isFirstWindow) {
          // Use current window for first batch
          const currentWindow = await chrome.windows.getCurrent();
          targetWindowId = currentWindow.id!;
        } else {
          // Create new window for other batches
          const newWindow = await chrome.windows.create({ focused: false });
          targetWindowId = newWindow.id!;
        }

        // Recreate groups in this window (if tab groups API is available)
        if (chrome.tabGroups && typeof chrome.tabGroups.update === 'function') {
          const windowGroups = data.groups.filter(g =>
            windowTabs.some(t => t.groupId === g.id),
          );

          for (const group of windowGroups) {
            if (!groupIdMap.has(group.id)) {
              try {
                // Create a temporary tab to create the group
                const tempTab = await chrome.tabs.create({
                  windowId: targetWindowId,
                  url: 'about:blank',
                  active: false,
                });

                const newGroupId = await chrome.tabs.group({
                  tabIds: tempTab.id!,
                });

                await chrome.tabGroups.update(newGroupId, {
                  title: group.title,
                  color: group.color,
                  collapsed: group.collapsed,
                });

                groupIdMap.set(group.id, newGroupId);

                // Remove the temporary tab
                await chrome.tabs.remove(tempTab.id!);
              } catch (error) {
                console.warn(`Error creating group ${group.title}:`, error);
              }
            }
          }
        }

        // Import tabs in batches
        for (let i = 0; i < windowTabs.length; i += batchSize) {
          const batch = windowTabs.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async tab => {
              try {
                // Create tab
                const newTab = await chrome.tabs.create({
                  windowId: targetWindowId,
                  url: tab.url,
                  active: false,
                  pinned: tab.pinned,
                });

                // Add to group if it had one (and groups API is available)
                if (tab.groupId !== -1 && groupIdMap.has(tab.groupId) && chrome.tabGroups) {
                  try {
                    await chrome.tabs.group({
                      tabIds: newTab.id!,
                      groupId: groupIdMap.get(tab.groupId),
                    });
                  } catch (error) {
                    console.warn(`Error adding tab to group:`, error);
                  }
                }

                // Mute if it was muted
                if (tab.mutedInfo?.muted) {
                  await chrome.tabs.update(newTab.id!, { muted: true });
                }

                // IMMEDIATELY discard/suspend the tab to save memory
                // This prevents the tab from loading and consuming resources
                try {
                  await chrome.tabs.discard(newTab.id!);
                } catch (error) {
                  console.warn(`Error discarding tab ${tab.url}:`, error);
                }

                importedCount++;
                setImportProgress({ current: importedCount, total: data.tabs.length });
              } catch (error) {
                console.error(`Error importing tab ${tab.url}:`, error);
              }
            }),
          );

          // Small delay between batches to prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      setStatusMessage(`✅ Imported ${importedCount} tabs successfully! Tabs are in suspended state to save memory.`);
    } catch (error) {
      console.error('Error importing tabs:', error);
      setStatusMessage('❌ Error importing tabs. Check console for details.');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        importTabs(file);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    },
    [importTabs],
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Export & Import Tabs</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Backup and restore your tabs with full metadata (groups, pin state, mute state, etc.)
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Export Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">📤 Export</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Save all your tabs to a JSON file with complete metadata including groups, pin state, and window
            organization.
          </p>
          <button
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            onClick={exportTabs}
            disabled={isExporting}>
            {isExporting ? '⏳ Exporting...' : '📥 Export All Tabs'}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border border-green-200/50 dark:border-green-700/50 rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">📥 Import</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Restore tabs from a backup file. Tabs will be created in <strong>suspended state</strong> to prevent memory
            overload.
          </p>
          
          {/* Import Settings */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                disabled={isImporting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                }`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tabs per batch</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delay (ms)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                step="50"
                value={batchDelay}
                onChange={e => setBatchDelay(Number(e.target.value))}
                disabled={isImporting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                }`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Between batches</p>
            </div>
          </div>

          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="hidden"
              id="import-file-input"
            />
            <span className="block w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:scale-105 text-center cursor-pointer">
              {isImporting ? '⏳ Importing...' : '📤 Import Tabs from File'}
            </span>
          </label>
        </div>
      </div>

      {/* Progress Bar */}
      {importProgress && (
        <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Import Progress</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {importProgress.current} / {importProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl font-medium ${
            statusMessage.startsWith('✅')
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}>
          {statusMessage}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-inner">
        <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">ℹ️ Important Information</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>
              <strong>Export includes:</strong> URLs, titles, favicons, pin state, group assignments, mute state, window
              organization, and last accessed time
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>
              <strong>Suspended tabs:</strong> Imported tabs are created in a suspended/discarded state. They won't load
              until you click on them, saving memory
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>
              <strong>Batch import:</strong> Tabs are imported in configurable batches (default 10) with delays between batches to prevent browser crashes
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>
              <strong>Groups preserved:</strong> Tab groups are recreated with their original titles, colors, and
              collapsed state
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>
              <strong>Windows:</strong> Original window organization is maintained - tabs from different windows will be
              imported into separate windows
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
