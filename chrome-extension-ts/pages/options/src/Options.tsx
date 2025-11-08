import { useState } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { TabRedirector } from './components/TabRedirector';
import { TabOrganizer } from './components/TabOrganizer';
import { BulkActions } from './components/BulkActions';

type SettingsTab = 'redirector' | 'organizer' | 'bulk';

const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<SettingsTab>('redirector');

  return (
    <div className={`min-h-screen w-full p-6 ${isLight ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900' : 'dark bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100'}`}>
      <div className="flex gap-6 min-h-[85vh] max-w-[1600px] mx-auto">
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-5">
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Settings</h2>
          </div>
          <nav>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              <li>
                <button
                  type="button"
                  className={`w-full px-4 py-3 rounded-xl border-none text-left font-medium cursor-pointer transition-all duration-200 ${
                    activeTab === 'redirector'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.01]'
                  }`}
                  onClick={() => setActiveTab('redirector')}>
                  Tab Redirector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`w-full px-4 py-3 rounded-xl border-none text-left font-medium cursor-pointer transition-all duration-200 ${
                    activeTab === 'organizer'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.01]'
                  }`}
                  onClick={() => setActiveTab('organizer')}>
                  Tab Organizer
                </button>
              </li>
              <li>
                <button
                  className={`w-full px-4 py-3 rounded-xl border-none text-left font-medium cursor-pointer transition-all duration-200 ${
                    activeTab === 'bulk'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.01]'
                  }`}
                  onClick={() => setActiveTab('bulk')}>
                  Bulk Actions
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-10 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          {activeTab === 'redirector' ? (
            <TabRedirector isLight={isLight} />
          ) : activeTab === 'organizer' ? (
            <TabOrganizer isLight={isLight} />
          ) : (
            <BulkActions isLight={isLight} />
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

