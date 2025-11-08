import { useCallback, useState } from 'react';

interface BulkActionsProps {
  isLight: boolean;
}

type TabInfo = chrome.tabs.Tab & {
  selected?: boolean;
};

type FilterField = 'url' | 'title' | 'all';

export const BulkActions = ({ isLight }: BulkActionsProps) => {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [filteredTabs, setFilteredTabs] = useState<TabInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<FilterField>('all');
  const [useRegex, setUseRegex] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Regex rename state
  const [renamePattern, setRenamePattern] = useState('');
  const [renameReplacement, setRenameReplacement] = useState('');

  // Archive state
  const [archiveFolder, setArchiveFolder] = useState('Archived Tabs');

  const loadTabs = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      const allTabs = await chrome.tabs.query({});
      const tabsWithSelection = allTabs.map(tab => ({ ...tab, selected: false }));
      setTabs(tabsWithSelection);
      setFilteredTabs(tabsWithSelection);
      setStatusMessage(`✅ Loaded ${allTabs.length} tabs`);
    } catch (error) {
      console.error('Error loading tabs:', error);
      setStatusMessage('❌ Error loading tabs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilter = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredTabs(tabs);
      return;
    }

    try {
      let filtered: TabInfo[];

      if (useRegex) {
        const regex = new RegExp(searchQuery, 'i');
        filtered = tabs.filter(tab => {
          if (filterField === 'url') return regex.test(tab.url || '');
          if (filterField === 'title') return regex.test(tab.title || '');
          return regex.test(tab.url || '') || regex.test(tab.title || '');
        });
      } else {
        const query = searchQuery.toLowerCase();
        filtered = tabs.filter(tab => {
          if (filterField === 'url') return (tab.url || '').toLowerCase().includes(query);
          if (filterField === 'title') return (tab.title || '').toLowerCase().includes(query);
          return (tab.url || '').toLowerCase().includes(query) || (tab.title || '').toLowerCase().includes(query);
        });
      }

      setFilteredTabs(filtered);
      setStatusMessage(`✅ Found ${filtered.length} matching tabs`);
    } catch (error) {
      console.error('Error applying filter:', error);
      setStatusMessage('❌ Invalid regex pattern');
    }
  }, [tabs, searchQuery, filterField, useRegex]);

  const toggleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setFilteredTabs(prev => prev.map(tab => ({ ...tab, selected: newSelectAll })));
    setTabs(prev =>
      prev.map(tab => {
        const isInFiltered = filteredTabs.some(ft => ft.id === tab.id);
        return isInFiltered ? { ...tab, selected: newSelectAll } : tab;
      }),
    );
  }, [selectAll, filteredTabs]);

  const toggleTabSelection = useCallback((tabId: number) => {
    setFilteredTabs(prev => prev.map(tab => (tab.id === tabId ? { ...tab, selected: !tab.selected } : tab)));
    setTabs(prev => prev.map(tab => (tab.id === tabId ? { ...tab, selected: !tab.selected } : tab)));
  }, []);

  const getSelectedTabs = useCallback(() => {
    return filteredTabs.filter(tab => tab.selected);
  }, [filteredTabs]);

  const suspendSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('⚠️ No tabs selected');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    try {
      let suspended = 0;
      for (const tab of selected) {
        if (tab.id && !tab.discarded) {
          try {
            await chrome.tabs.discard(tab.id);
            suspended++;
          } catch (error) {
            console.warn(`Error suspending tab ${tab.id}:`, error);
          }
        }
      }
      setStatusMessage(`✅ Suspended ${suspended} tabs`);
      await loadTabs();
    } catch (error) {
      console.error('Error suspending tabs:', error);
      setStatusMessage('❌ Error suspending tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, loadTabs]);

  const closeSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('⚠️ No tabs selected');
      return;
    }

    if (!confirm(`Close ${selected.length} selected tabs?`)) {
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    try {
      const tabIds = selected.map(tab => tab.id).filter((id): id is number => id !== undefined);
      await chrome.tabs.remove(tabIds);
      setStatusMessage(`✅ Closed ${tabIds.length} tabs`);
      await loadTabs();
    } catch (error) {
      console.error('Error closing tabs:', error);
      setStatusMessage('❌ Error closing tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, loadTabs]);

  const renameSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('⚠️ No tabs selected');
      return;
    }

    if (!renamePattern.trim()) {
      setStatusMessage('⚠️ Enter a rename pattern');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    try {
      const regex = new RegExp(renamePattern, 'g');
      let renamed = 0;

      for (const tab of selected) {
        if (tab.id && tab.url) {
          try {
            const newUrl = tab.url.replace(regex, renameReplacement);
            if (newUrl !== tab.url) {
              await chrome.tabs.update(tab.id, { url: newUrl });
              renamed++;
            }
          } catch (error) {
            console.warn(`Error renaming tab ${tab.id}:`, error);
          }
        }
      }

      setStatusMessage(`✅ Renamed ${renamed} tabs`);
      await loadTabs();
    } catch (error) {
      console.error('Error renaming tabs:', error);
      setStatusMessage('❌ Invalid regex pattern or error renaming tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, renamePattern, renameReplacement, loadTabs]);

  const archiveSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('⚠️ No tabs selected');
      return;
    }

    if (!archiveFolder.trim()) {
      setStatusMessage('⚠️ Enter a bookmark folder name');
      return;
    }

    if (!confirm(`Archive ${selected.length} tabs to bookmarks and close them?`)) {
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    try {
      // Find or create the archive folder
      const bookmarkTree = await chrome.bookmarks.getTree();
      const bookmarkBar = bookmarkTree[0].children?.find(node => node.id === '1'); // Bookmarks bar

      let archiveFolderId: string | undefined;

      // Search for existing folder
      if (bookmarkBar?.children) {
        const existingFolder = bookmarkBar.children.find(node => node.title === archiveFolder);
        if (existingFolder) {
          archiveFolderId = existingFolder.id;
        }
      }

      // Create folder if it doesn't exist
      if (!archiveFolderId) {
        const newFolder = await chrome.bookmarks.create({
          parentId: '1', // Bookmarks bar
          title: archiveFolder,
        });
        archiveFolderId = newFolder.id;
      }

      // Add bookmarks
      let archived = 0;
      const tabIds: number[] = [];

      for (const tab of selected) {
        if (tab.url && tab.title && tab.id) {
          try {
            await chrome.bookmarks.create({
              parentId: archiveFolderId,
              title: tab.title,
              url: tab.url,
            });
            tabIds.push(tab.id);
            archived++;
          } catch (error) {
            console.warn(`Error archiving tab ${tab.id}:`, error);
          }
        }
      }

      // Close tabs after archiving
      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
      }

      setStatusMessage(`✅ Archived ${archived} tabs to "${archiveFolder}" and closed them`);
      await loadTabs();
    } catch (error) {
      console.error('Error archiving tabs:', error);
      setStatusMessage('❌ Error archiving tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, archiveFolder, loadTabs]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">Bulk Actions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Search, filter, and perform bulk operations on your tabs with regex support.
        </p>
      </div>

      {/* Load Tabs Button */}
      <div className="mb-5">
        <button
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm transition-colors"
          onClick={loadTabs}
          disabled={isLoading}>
          {isLoading ? '⏳ Loading...' : '🔄 Load All Tabs'}
        </button>
      </div>

      {/* Search and Filter */}
      {tabs.length > 0 && (
        <>
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-5 mb-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">🔍 Search & Filter</h3>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Query
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter search term or regex pattern..."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search In
                </label>
                <select
                  value={filterField}
                  onChange={e => setFilterField(e.target.value as FilterField)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                  }`}>
                  <option value="all">URL & Title</option>
                  <option value="url">URL Only</option>
                  <option value="title">Title Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 items-center mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={e => setUseRegex(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Regex</span>
              </label>
            </div>

            <button
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg font-medium shadow-sm transition-colors"
              onClick={applyFilter}>
              🔎 Apply Filter
            </button>
          </div>

          {/* Results Table */}
          {filteredTabs.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-5 mb-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  📋 Results ({filteredTabs.length} tabs)
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select All</span>
                </label>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        URL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTabs.map(tab => (
                      <tr
                        key={tab.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          tab.selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={tab.selected || false}
                            onChange={() => toggleTabSelection(tab.id!)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                            <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
                              {tab.title || 'Untitled'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-md block">
                            {tab.url}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {tab.pinned && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                📌 Pinned
                              </span>
                            )}
                            {tab.discarded && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                💤 Suspended
                              </span>
                            )}
                            {tab.audible && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                                🔊 Audio
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {filteredTabs.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium shadow-sm transition-colors"
                    onClick={suspendSelected}
                    disabled={isLoading}>
                    💤 Suspend Selected
                  </button>
                  <button
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium shadow-sm transition-colors"
                    onClick={closeSelected}
                    disabled={isLoading}>
                    ❌ Close Selected
                  </button>
                </div>
              </div>

              {/* Archive Action */}
              <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border border-green-200/50 dark:border-green-700/50 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">📚 Archive</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={archiveFolder}
                    onChange={e => setArchiveFolder(e.target.value)}
                    placeholder="Bookmark folder name..."
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                    }`}
                  />
                  <button
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium shadow-sm transition-colors"
                    onClick={archiveSelected}
                    disabled={isLoading}>
                    📦 Archive & Close
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Saves tabs to bookmarks then closes them
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rename Action */}
          {filteredTabs.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-5 mb-5 shadow-sm">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">✏️ Bulk Rename (Regex)</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pattern (Regex)
                  </label>
                  <input
                    type="text"
                    value={renamePattern}
                    onChange={e => setRenamePattern(e.target.value)}
                    placeholder="e.g., http://"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Replacement
                  </label>
                  <input
                    type="text"
                    value={renameReplacement}
                    onChange={e => setRenameReplacement(e.target.value)}
                    placeholder="e.g., https://"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                    }`}
                  />
                </div>
              </div>
              <button
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium shadow-sm transition-colors"
                onClick={renameSelected}
                disabled={isLoading}>
                🔄 Rename URLs
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Uses regex to find and replace patterns in tab URLs
              </p>
            </div>
          )}
        </>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl font-medium ${
            statusMessage.startsWith('✅')
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : statusMessage.startsWith('⚠️')
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};
