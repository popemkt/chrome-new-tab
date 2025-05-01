import '@src/Options.css';
import { useState, useEffect, useCallback } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, weightedUrlsStorage, WeightedUrl } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';

const Options = () => {
  // State management
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const urlList = useStorage(weightedUrlsStorage);
  
  const [newUrl, setNewUrl] = useState('');
  const [urlWeight, setUrlWeight] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

  return (
    <div className={`App ${isLight ? '' : 'dark bg-gray-800 text-gray-100'}`}>
      <div className="container">
        <h1>New Tab URL Redirector</h1>
        <p>Configure URLs to open when a new tab is created. One of these URLs will be randomly selected each time.</p>
        
        <form className="url-form" onSubmit={handleFormSubmit}>
          <input 
            type="text" 
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter a URL (e.g., google.com)"
            className={`${isLight ? '' : 'bg-gray-700 text-white border-gray-600'}`}
          />
          <input 
            type="number" 
            value={urlWeight}
            onChange={(e) => setUrlWeight(parseInt(e.target.value) || 1)}
            placeholder="Weight" 
            min="1"
            className={`${isLight ? '' : 'bg-gray-700 text-white border-gray-600'}`}
          />
          <button 
            type="submit" 
            className={`add-button ${isEditing ? 'bg-blue-500' : 'bg-green-500'}`}
          >
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
                    <button 
                      className="edit-button"
                      onClick={() => editUrl(item.url, item.weight)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => deleteUrl(item.url)}
                    >
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
          <button className="save-button" onClick={saveUrls}>Save</button>
          <div id="status">{statusMessage}</div>
          
          <button onClick={exampleThemeStorage.toggle}>
            {isLight ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Options, <div className="text-center p-5">Loading...</div>),
  <div className="text-center p-5 text-red-500">An error occurred while loading options.</div>
);

