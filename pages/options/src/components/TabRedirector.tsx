import { useCallback, useState } from 'react';
import { useStorage } from '@extension/shared';
import type { WeightedUrl } from '@extension/storage';
import { weightedUrlsStorage } from '@extension/storage';

export const TabRedirector = () => {
  const urlList = useStorage(weightedUrlsStorage);

  const [newUrl, setNewUrl] = useState('');
  const [urlWeight, setUrlWeight] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const addUrl = useCallback(async () => {
    if (!newUrl.trim()) return;

    await weightedUrlsStorage.addUrl(newUrl, urlWeight);

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
    setTimeout(() => setStatusMessage(''), 3000);
  }, []);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      addUrl();
    },
    [addUrl],
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-foreground">New Tab URL Redirector</h1>
        <p className="text-sm text-muted-foreground">
          Configure URLs to open when a new tab is created. One of these URLs will be randomly selected each time.
        </p>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" onSubmit={handleFormSubmit}>
        <input
          type="text"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="Enter a URL (e.g., google.com)"
          className="flex-1 min-w-[200px] px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        <input
          type="number"
          value={urlWeight}
          onChange={e => setUrlWeight(parseInt(e.target.value, 10) || 1)}
          placeholder="Weight"
          min="1"
          className="w-28 px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors border-none cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
          {isEditing ? 'Update URL' : 'Add URL'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mb-6 italic">
        To edit an existing entry: Click "Edit" and the entry will be loaded into the form above.
      </p>

      <div className="border border-border rounded-lg p-5 mb-6 bg-card shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-card-foreground">Your URLs</h2>
        <ul className="space-y-3 list-none p-0 m-0">
          {urlList && urlList.length > 0 ? (
            urlList.map((item: WeightedUrl, index: number) => (
              <li
                key={`${item.url}-${index}`}
                className="flex items-center justify-between p-3 bg-background border border-border rounded-md shadow-sm hover:shadow transition-shadow">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="font-medium text-foreground truncate">{item.url}</span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Weight: {item.weight}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded text-sm font-medium shadow-sm transition-colors border-none cursor-pointer"
                    onClick={() => editUrl(item.url, item.weight)}>
                    Edit
                  </button>
                  <button
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm font-medium shadow-sm transition-colors border-none cursor-pointer"
                    onClick={() => deleteUrl(item.url)}>
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center py-8 text-muted-foreground italic">No URLs added yet</li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium shadow-sm transition-colors border-none cursor-pointer"
          onClick={saveUrls}>
          Save Changes
        </button>
        {statusMessage && (
          <div className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium">{statusMessage}</div>
        )}
      </div>
    </div>
  );
};
