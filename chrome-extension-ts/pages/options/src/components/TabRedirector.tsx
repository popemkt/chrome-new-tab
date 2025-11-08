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
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">New Tab URL Redirector</h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
        Configure URLs to open when a new tab is created. One of these URLs will be randomly selected each time.
      </p>

      </div>

      <form className="flex flex-wrap gap-3 mb-8" onSubmit={handleFormSubmit}>
        <input
          type="text"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="Enter a URL (e.g., google.com)"
          className={`flex-1 min-w-[200px] px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
          }`}
        />
        <input
          type="number"
          value={urlWeight}
          onChange={e => setUrlWeight(parseInt(e.target.value, 10) || 1)}
          placeholder="Weight"
          min="1"
          className={`w-28 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            isLight ? 'bg-white border-gray-300' : 'bg-gray-700 text-white border-gray-600'
          }`}
        />
        <button
          type="submit"
          className={`px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all hover:scale-105 ${
            isEditing
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-500/30'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-green-500/30'
          }`}>
          {isEditing ? 'Update URL' : 'Add URL'}
        </button>
      </form>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 italic">
        To edit an existing entry: Click "Edit" and the entry will be loaded into the form above.
      </p>

      <div className="border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 mb-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-inner">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Your URLs</h2>
        <ul className="space-y-3">
          {urlList && urlList.length > 0 ? (
            urlList.map((item: WeightedUrl, index: number) => (
              <li
                key={`${item.url}-${index}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.url}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Weight: {item.weight}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
                    onClick={() => editUrl(item.url, item.weight)}>
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-500/20 transition-all hover:scale-105"
                    onClick={() => deleteUrl(item.url)}>
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center py-8 text-gray-400 dark:text-gray-500 italic">No URLs added yet</li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:scale-105"
          onClick={saveUrls}>
          Save Changes
        </button>
        {statusMessage && <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium">{statusMessage}</div>}
        <button
          className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:from-gray-300 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-900 dark:text-gray-100 rounded-xl font-medium shadow-md transition-all hover:scale-105"
          onClick={exampleThemeStorage.toggle}>
          {isLight ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </div>
  );
};
