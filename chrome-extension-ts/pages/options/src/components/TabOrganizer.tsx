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
      <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">Tab Organizer</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">Find and manage problematic tabs across all your windows.</p>

      <div className="flex gap-2 mb-6 border-b-2 border-gray-200 dark:border-gray-700">
        <button
          className={`px-5 py-2.5 font-medium transition-all border-b-3 -mb-0.5 ${
            activeView === 'duplicates'
              ? 'text-blue-600 dark:text-blue-400 border-b-blue-600 dark:border-b-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveView('duplicates')}>
          Duplicate Tabs
        </button>
        <button
          className={`px-5 py-2.5 font-medium transition-all border-b-3 -mb-0.5 ${
            activeView === 'suspicious'
              ? 'text-blue-600 dark:text-blue-400 border-b-blue-600 dark:border-b-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveView('suspicious')}>
          Suspicious Tabs
        </button>
        <button
          className={`px-5 py-2.5 font-medium transition-all border-b-3 -mb-0.5 ${
            activeView === 'old'
              ? 'text-blue-600 dark:text-blue-400 border-b-blue-600 dark:border-b-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveView('old')}>
          Old & Unused
        </button>
      </div>

      <div className="mt-5">
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
