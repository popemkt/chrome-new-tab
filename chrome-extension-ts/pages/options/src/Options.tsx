import { useState } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { TabRedirector } from './components/TabRedirector';
import { TabOrganizer } from './components/TabOrganizer';

type SettingsTab = 'redirector' | 'organizer';

const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<SettingsTab>('redirector');

  return (
    <div className={`min-h-screen w-full p-5 ${isLight ? 'bg-white text-gray-900' : 'dark bg-gray-800 text-gray-100'}`}>
      <div className="flex gap-5 min-h-[80vh]">
        <aside className="w-56 bg-gray-100 dark:bg-gray-900 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">Settings</h2>
          <nav>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              <li>
                <button
                  type="button"
                  className={`w-full px-3.5 py-2.5 rounded-lg border-none text-left font-medium cursor-pointer transition-all ${
                    activeTab === 'redirector'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setActiveTab('redirector')}>
                  Tab Redirector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`w-full px-3.5 py-2.5 rounded-lg border-none text-left font-medium cursor-pointer transition-all ${
                    activeTab === 'organizer'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setActiveTab('organizer')}>
                  Tab Organizer
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-8 shadow-xl">
          {activeTab === 'redirector' ? <TabRedirector isLight={isLight} /> : <TabOrganizer isLight={isLight} />}
        </main>
      </div>
    </div>
  );
}

export default withErrorBoundary(
  withSuspense(Options, <div className="text-center p-5">Loading...</div>),
  <div className="text-center p-5 text-red-500">An error occurred while loading options.</div>
);

