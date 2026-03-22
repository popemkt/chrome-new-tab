import { useCallback, useState } from 'react';

type TabInfo = chrome.tabs.Tab & {
  selected?: boolean;
};

type FilterField = 'url' | 'title' | 'all';

export const BulkActions = () => {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [filteredTabs, setFilteredTabs] = useState<TabInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState<FilterField>('all');
  const [useRegex, setUseRegex] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const [renamePattern, setRenamePattern] = useState('');
  const [renameReplacement, setRenameReplacement] = useState('');
  const [archiveFolder, setArchiveFolder] = useState('Archived Tabs');

  const loadTabs = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      const allTabs = await chrome.tabs.query({});
      const tabsWithSelection = allTabs.map(tab => ({ ...tab, selected: false }));
      setTabs(tabsWithSelection);
      setFilteredTabs(tabsWithSelection);
      setStatusMessage(`Loaded ${allTabs.length} tabs`);
    } catch (error) {
      console.error('Error loading tabs:', error);
      setStatusMessage('Error loading tabs');
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
      setStatusMessage(`Found ${filtered.length} matching tabs`);
    } catch (error) {
      console.error('Error applying filter:', error);
      setStatusMessage('Invalid regex pattern');
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
      setStatusMessage('No tabs selected');
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
      setStatusMessage(`Suspended ${suspended} tabs`);
      await loadTabs();
    } catch (error) {
      console.error('Error suspending tabs:', error);
      setStatusMessage('Error suspending tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, loadTabs]);

  const closeSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('No tabs selected');
      return;
    }
    if (!confirm(`Close ${selected.length} selected tabs?`)) return;
    setIsLoading(true);
    setStatusMessage('');
    try {
      const tabIds = selected.map(tab => tab.id).filter((id): id is number => id !== undefined);
      await chrome.tabs.remove(tabIds);
      setStatusMessage(`Closed ${tabIds.length} tabs`);
      await loadTabs();
    } catch (error) {
      console.error('Error closing tabs:', error);
      setStatusMessage('Error closing tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, loadTabs]);

  const renameSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('No tabs selected');
      return;
    }
    if (!renamePattern.trim()) {
      setStatusMessage('Enter a rename pattern');
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
      setStatusMessage(`Renamed ${renamed} tabs`);
      await loadTabs();
    } catch (error) {
      console.error('Error renaming tabs:', error);
      setStatusMessage('Invalid regex pattern or error renaming tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, renamePattern, renameReplacement, loadTabs]);

  const archiveSelected = useCallback(async () => {
    const selected = getSelectedTabs();
    if (selected.length === 0) {
      setStatusMessage('No tabs selected');
      return;
    }
    if (!archiveFolder.trim()) {
      setStatusMessage('Enter a bookmark folder name');
      return;
    }
    if (!confirm(`Archive ${selected.length} tabs to bookmarks and close them?`)) return;
    setIsLoading(true);
    setStatusMessage('');
    try {
      const bookmarkTree = await chrome.bookmarks.getTree();
      const bookmarkBar = bookmarkTree[0].children?.find(node => node.id === '1');
      let archiveFolderId: string | undefined;
      if (bookmarkBar?.children) {
        const existingFolder = bookmarkBar.children.find(node => node.title === archiveFolder);
        if (existingFolder) archiveFolderId = existingFolder.id;
      }
      if (!archiveFolderId) {
        const newFolder = await chrome.bookmarks.create({ parentId: '1', title: archiveFolder });
        archiveFolderId = newFolder.id;
      }
      let archived = 0;
      const tabIds: number[] = [];
      for (const tab of selected) {
        if (tab.url && tab.title && tab.id) {
          try {
            await chrome.bookmarks.create({ parentId: archiveFolderId, title: tab.title, url: tab.url });
            tabIds.push(tab.id);
            archived++;
          } catch (error) {
            console.warn(`Error archiving tab ${tab.id}:`, error);
          }
        }
      }
      if (tabIds.length > 0) await chrome.tabs.remove(tabIds);
      setStatusMessage(`Archived ${archived} tabs to "${archiveFolder}" and closed them`);
      await loadTabs();
    } catch (error) {
      console.error('Error archiving tabs:', error);
      setStatusMessage('Error archiving tabs');
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedTabs, archiveFolder, loadTabs]);

  const inputClass =
    'w-full px-4 py-2.5 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all';
  const btnPrimary =
    'px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium shadow-sm transition-colors border-none cursor-pointer';
  const btnDestructive =
    'w-full px-4 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium shadow-sm transition-colors border-none cursor-pointer';
  const btnSecondary =
    'w-full px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium shadow-sm transition-colors border-none cursor-pointer';

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1 text-foreground">Bulk Actions</h1>
        <p className="text-sm text-muted-foreground">
          Search, filter, and perform bulk operations on your tabs with regex support.
        </p>
      </div>

      <div className="mb-5">
        <button className={btnPrimary} onClick={loadTabs} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load All Tabs'}
        </button>
      </div>

      {tabs.length > 0 && (
        <>
          <div className="bg-card border border-border rounded-lg p-5 mb-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">Search & Filter</h3>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label htmlFor="bulk-search" className="block text-sm font-medium text-foreground mb-2">
                  Search Query
                </label>
                <input
                  id="bulk-search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter search term or regex pattern..."
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="bulk-filter-field" className="block text-sm font-medium text-foreground mb-2">
                  Search In
                </label>
                <select
                  id="bulk-filter-field"
                  value={filterField}
                  onChange={e => setFilterField(e.target.value as FilterField)}
                  className={inputClass}>
                  <option value="all">URL & Title</option>
                  <option value="url">URL Only</option>
                  <option value="title">Title Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 items-center mb-4">
              <label htmlFor="bulk-use-regex" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="bulk-use-regex"
                  type="checkbox"
                  checked={useRegex}
                  onChange={e => setUseRegex(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Use Regex</span>
              </label>
            </div>

            <button className={btnPrimary} onClick={applyFilter}>
              Apply Filter
            </button>
          </div>

          {filteredTabs.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5 mb-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-card-foreground">Results ({filteredTabs.length} tabs)</h3>
                <label htmlFor="bulk-select-all" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="bulk-select-all"
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Select All</span>
                </label>
              </div>

              <div className="max-h-96 overflow-y-auto border border-border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {['Select', 'Title', 'URL', 'Status'].map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTabs.map(tab => (
                      <tr
                        key={tab.id}
                        className={`hover:bg-muted/50 transition-colors ${tab.selected ? 'bg-accent/20' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={tab.selected || false}
                            onChange={() => toggleTabSelection(tab.id!)}
                            className="w-4 h-4 rounded accent-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />}
                            <span className="text-sm text-foreground truncate max-w-xs">{tab.title || 'Untitled'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground truncate max-w-md block">{tab.url}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {tab.pinned && (
                              <span className="px-2 py-1 bg-accent/30 text-accent-foreground text-xs rounded">
                                Pinned
                              </span>
                            )}
                            {tab.discarded && (
                              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                                Suspended
                              </span>
                            )}
                            {tab.audible && (
                              <span className="px-2 py-1 bg-accent/30 text-accent-foreground text-xs rounded">
                                Audio
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

          {filteredTabs.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                <h3 className="text-base font-semibold mb-3 text-card-foreground">Quick Actions</h3>
                <div className="space-y-3">
                  <button className={btnSecondary} onClick={suspendSelected} disabled={isLoading}>
                    Suspend Selected
                  </button>
                  <button className={btnDestructive} onClick={closeSelected} disabled={isLoading}>
                    Close Selected
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                <h3 className="text-base font-semibold mb-3 text-card-foreground">Archive</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={archiveFolder}
                    onChange={e => setArchiveFolder(e.target.value)}
                    placeholder="Bookmark folder name..."
                    className={inputClass}
                  />
                  <button className={btnPrimary + ' w-full'} onClick={archiveSelected} disabled={isLoading}>
                    Archive & Close
                  </button>
                  <p className="text-xs text-muted-foreground">Saves tabs to bookmarks then closes them</p>
                </div>
              </div>
            </div>
          )}

          {filteredTabs.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5 mb-5 shadow-sm">
              <h3 className="text-base font-semibold mb-3 text-card-foreground">Bulk Rename (Regex)</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="bulk-rename-pattern" className="block text-sm font-medium text-foreground mb-2">
                    Pattern (Regex)
                  </label>
                  <input
                    id="bulk-rename-pattern"
                    type="text"
                    value={renamePattern}
                    onChange={e => setRenamePattern(e.target.value)}
                    placeholder="e.g., http://"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="bulk-rename-replacement" className="block text-sm font-medium text-foreground mb-2">
                    Replacement
                  </label>
                  <input
                    id="bulk-rename-replacement"
                    type="text"
                    value={renameReplacement}
                    onChange={e => setRenameReplacement(e.target.value)}
                    placeholder="e.g., https://"
                    className={inputClass}
                  />
                </div>
              </div>
              <button className={btnPrimary} onClick={renameSelected} disabled={isLoading}>
                Rename URLs
              </button>
              <p className="text-xs text-muted-foreground mt-2">Uses regex to find and replace patterns in tab URLs</p>
            </div>
          )}
        </>
      )}

      {statusMessage && (
        <div className="p-4 rounded-lg font-medium bg-muted text-muted-foreground border border-border">
          {statusMessage}
        </div>
      )}
    </div>
  );
};
