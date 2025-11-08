import { useCallback, useState } from 'react';
import { useStorage } from '@extension/shared';
import { exampleThemeStorage, weightedUrlsStorage, WeightedUrl } from '@extension/storage';

interface TabRedirectorProps {
  isLight: boolean;
}

export const TabRedirector = ({ isLight }: TabRedirectorProps) => {
  const urlList = useStorage(weightedUrlsStorage);

  const [newUrl, setNewUrl] = useState('');
  const [urlWeight, setUrlWeight] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  }, []);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      addUrl();
    },
    [addUrl],
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">New Tab URL Redirector</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Configure URLs to open when a new tab is created. One of these URLs will be randomly selected each time.
      </p>

      <form className="flex flex-wrap gap-3 mb-6" onSubmit={handleFormSubmit}>
        <input
          type="text"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="Enter a URL (e.g., google.com)"
          className={`flex-1 min-w-[200px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
          }`}
        />
        <input
          type="number"
          value={urlWeight}
          onChange={e => setUrlWeight(parseInt(e.target.value, 10) || 1)}
          placeholder="Weight"
          min="1"
          className={`w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
          }`}
        />
        <button
          type="submit"
          className={`px-5 py-2 rounded-lg text-white font-medium transition-colors ${
            isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
          }`}>
          {isEditing ? 'Update URL' : 'Add URL'}
        </button>
      </form>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        To edit an existing entry: Click "Edit" and the entry will be loaded into the form above.
      </p>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Your URLs:</h2>
        <ul className="space-y-2">
          {urlList && urlList.length > 0 ? (
            urlList.map((item: WeightedUrl, index: number) => (
              <li
                key={`${item.url}-${index}`}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.url}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Weight: {item.weight}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    onClick={() => editUrl(item.url, item.weight)}>
                    Edit
                  </button>
                  <button
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                    onClick={() => deleteUrl(item.url)}>
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center py-6 text-gray-400 dark:text-gray-500">No URLs added yet</li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-5 flex-wrap">
        <button
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          onClick={saveUrls}>
          Save
        </button>
        {statusMessage && <div className="text-green-600 dark:text-green-400 font-medium">{statusMessage}</div>}
        <button
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
          onClick={exampleThemeStorage.toggle}>
          {isLight ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>
    </div>
  );
};
