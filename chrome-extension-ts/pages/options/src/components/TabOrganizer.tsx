import { useState } from 'react';
import { DuplicateTabsList } from './DuplicateTabsList';
import { SuspiciousTabsList } from './SuspiciousTabsList';
import { OldTabsList } from './OldTabsList';

type OrganizerView = 'duplicates' | 'suspicious' | 'old';

interface TabOrganizerProps {
  isLight: boolean;
}

export const TabOrganizer = ({ isLight }: TabOrganizerProps) => {
  const [activeView, setActiveView] = useState<OrganizerView>('duplicates');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Tab Organizer</h1>
        <p className="text-base text-gray-600 dark:text-gray-400">Find and manage problematic tabs across all your windows.</p>
      </div>

      <div className="flex gap-1 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
            activeView === 'duplicates'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('duplicates')}>
          Duplicate Tabs
        </button>
        <button
          className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
            activeView === 'suspicious'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('suspicious')}>
          Suspicious Tabs
        </button>
        <button
          className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
            activeView === 'old'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('old')}>
          Old & Unused
        </button>
      </div>

      <div className="mt-6">
        {activeView === 'duplicates' ? (
          <DuplicateTabsList isLight={isLight} />
        ) : activeView === 'suspicious' ? (
          <SuspiciousTabsList isLight={isLight} />
        ) : (
          <OldTabsList isLight={isLight} />
        )}
      </div>
    </div>
  );
};
