import '@src/Options.css';
import { useCallback, useState, useEffect } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, weightedUrlsStorage, WeightedUrl } from '@extension/storage';

type SettingsTab = 'redirector' | 'organizer';

interface DuplicateGroup {
  url: string;
  tabs: chrome.tabs.Tab[];
}

const Options = () => {
  // State management
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const urlList = useStorage(weightedUrlsStorage);
  const [activeTab, setActiveTab] = useState<SettingsTab>('redirector');

  const [newUrl, setNewUrl] = useState('');
  const [urlWeight, setUrlWeight] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Functions for URL management
  const addUrl = useCallback(async () => {
    if (!newUrl.trim()) return;
    
    await weightedUrlsStorage.addUrl(newUrl, urlWeight);
    
    // Clear form
    setNewUrl('');
    setUrlWeight(1);
    setIsEditing(false);
  }, [newUrl, urlWeight]);

  const editUrl = useCallback((url: string, weight: number) => {
    setNewUrl(url);
    setUrlWeight(weight);
    setIsEditing(true);
  }, []);

  const deleteUrl = useCallback(async (url: string) => {
    await weightedUrlsStorage.removeUrl(url);
  }, []);

  const saveUrls = useCallback(async () => {
    setStatusMessage('URLs saved successfully!');
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  }, []);

  // URL form submission handler
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    addUrl();
  }, [addUrl]);

  // Find duplicate tabs
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

  // Close specific tab
  const closeTab = useCallback(async (tabId: number) => {
    try {
      await chrome.tabs.remove(tabId);
      // Rescan after closing
      await scanForDuplicates();
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  }, [scanForDuplicates]);

  // Close all duplicates except the first one for a URL
  const closeDuplicates = useCallback(async (url: string) => {
    const group = duplicateGroups.find(g => g.url === url);
    if (!group || group.tabs.length <= 1) return;

    try {
      // Keep the first tab, close the rest
      const tabIdsToClose = group.tabs.slice(1).map(tab => tab.id).filter((id): id is number => id !== undefined);
      if (tabIdsToClose.length > 0) {
        await chrome.tabs.remove(tabIdsToClose);
        await scanForDuplicates();
      }
    } catch (error) {
      console.error('Error closing duplicate tabs:', error);
    }
  }, [duplicateGroups, scanForDuplicates]);

  // Close all duplicates across all URLs
  const closeAllDuplicates = useCallback(async () => {
    if (duplicateGroups.length === 0) return;

    try {
      const allTabIdsToClose: number[] = [];
      
      // Collect all duplicate tab IDs (keeping first tab of each group)
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
    <div className={`App ${isLight ? '' : 'dark bg-gray-800 text-gray-100'}`}>
      <div className="options-layout">
        <aside className="sidebar">
          <h2 className="sidebar-title">Settings</h2>
          <nav>
            <ul className="tab-list">
              <li>
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'redirector' ? 'active' : ''}`}
                  onClick={() => setActiveTab('redirector')}>
                  Tab Redirector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`tab-button ${activeTab === 'organizer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('organizer')}>
                  Tab Organizer
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="content-area">
          {activeTab === 'redirector' ? (
            <div className="container">
              <h1>New Tab URL Redirector</h1>
              <p>
                Configure URLs to open when a new tab is created. One of these URLs will be randomly selected each time.
              </p>

              <form className="url-form" onSubmit={handleFormSubmit}>
                <input
                  type="text"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="Enter a URL (e.g., google.com)"
                  className={`${isLight ? '' : 'bg-gray-700 text-white border-gray-600'}`}
                />
                <input
                  type="number"
                  value={urlWeight}
                  onChange={e => setUrlWeight(parseInt(e.target.value, 10) || 1)}
                  placeholder="Weight"
                  min="1"
                  className={`${isLight ? '' : 'bg-gray-700 text-white border-gray-600'}`}
                />
                <button type="submit" className={`add-button ${isEditing ? 'bg-blue-500' : 'bg-green-500'}`}>
                  {isEditing ? 'Update URL' : 'Add URL'}
                </button>
              </form>

              <p className="form-tip">
                <small>To edit an existing entry: Click "Edit" and the entry will be loaded into the form above.</small>
              </p>

              <div className="url-list">
                <h2>Your URLs:</h2>
                <ul>
                  {urlList && urlList.length > 0 ? (
                    urlList.map((item: WeightedUrl, index: number) => (
                      <li key={`${item.url}-${index}`}>
                        <span className="url-text">{item.url}</span>
                        <span className="weight-label">Weight: {item.weight}</span>

                        <div className="button-group">
                          <button className="edit-button" onClick={() => editUrl(item.url, item.weight)}>
                            Edit
                          </button>
                          <button className="delete-button" onClick={() => deleteUrl(item.url)}>
                            Delete
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="empty-message">No URLs added yet</li>
                  )}
                </ul>
              </div>

              <div className="actions">
                <button className="save-button" onClick={saveUrls}>
                  Save
                </button>
                <div id="status">{statusMessage}</div>

                <button onClick={exampleThemeStorage.toggle}>{isLight ? 'Dark Mode' : 'Light Mode'}</button>
              </div>
            </div>
          ) : (
            <div className="container">
              <h1>Tab Organizer</h1>
              <p>Find and manage duplicate tabs across all your windows.</p>

              <div className="organizer-actions">
                <button className="scan-button" onClick={scanForDuplicates} disabled={isScanning}>
                  {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
                </button>
                {duplicateGroups.length > 0 && (
                  <button className="close-all-button" onClick={closeAllDuplicates}>
                    Close All Duplicates ({duplicateGroups.reduce((sum, g) => sum + g.tabs.length - 1, 0)} tabs)
                  </button>
                )}
              </div>

              {duplicateGroups.length > 0 ? (
                <div className="duplicates-list">
                  <h2>Found {duplicateGroups.length} URLs with duplicates</h2>
                  {duplicateGroups.map((group, index) => (
                    <div key={index} className="duplicate-group">
                      <div className="duplicate-header">
                        <div className="duplicate-url-info">
                          <span className="duplicate-count">{group.tabs.length} tabs</span>
                          <span className="duplicate-url" title={group.url}>
                            {group.url}
                          </span>
                        </div>
                        <button
                          className="close-duplicates-button"
                          onClick={() => closeDuplicates(group.url)}
                          title="Close all duplicates except the first one">
                          Close {group.tabs.length - 1} Duplicate{group.tabs.length - 1 > 1 ? 's' : ''}
                        </button>
                      </div>
                      <ul className="duplicate-tabs">
                        {group.tabs.map((tab, tabIndex) => (
                          <li key={tab.id} className="duplicate-tab-item">
                            <div className="tab-info">
                              {tab.favIconUrl && (
                                <img src={tab.favIconUrl} alt="" className="tab-favicon" />
                              )}
                              <span className="tab-title">{tab.title || 'Untitled'}</span>
                              {tabIndex === 0 && <span className="tab-badge">Keep</span>}
                            </div>
                            <button
                              className="close-tab-button"
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
                  <div className="no-duplicates">
                    <p>No duplicate tabs found! 🎉</p>
                    <p className="placeholder-hint">Click "Scan for Duplicates" to check again.</p>
                  </div>
                )
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default withErrorBoundary(
  withSuspense(Options, <div className="text-center p-5">Loading...</div>),
  <div className="text-center p-5 text-red-500">An error occurred while loading options.</div>
);

