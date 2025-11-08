import { useState } from 'react';
import { DuplicateTabsList } from './DuplicateTabsList';
import { SuspiciousTabsList } from './SuspiciousTabsList';
import { OldTabsList } from './OldTabsList';
import { TabExportImport } from './TabExportImport';

type OrganizerView = 'duplicates' | 'suspicious' | 'old' | 'export';

interface TabOrganizerProps {
  isLight: boolean;
}

export const TabOrganizer = ({ isLight }: TabOrganizerProps) => {
  const [activeView, setActiveView] = useState<OrganizerView>('duplicates');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Tab Organizer</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Find and manage problematic tabs across all your windows.</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
        <button
          className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors whitespace-nowrap ${
            activeView === 'duplicates'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('duplicates')}>
          Duplicate Tabs
        </button>
        <button
          className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors whitespace-nowrap ${
            activeView === 'suspicious'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('suspicious')}>
          Suspicious Tabs
        </button>
        <button
          className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors whitespace-nowrap ${
            activeView === 'old'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('old')}>
          Old & Unused
        </button>
        <button
          className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors whitespace-nowrap ${
            activeView === 'export'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('export')}>
          Export/Import
        </button>
      </div>

      <div className="mt-6">
        {activeView === 'duplicates' ? (
          <DuplicateTabsList isLight={isLight} />
        ) : activeView === 'suspicious' ? (
          <SuspiciousTabsList isLight={isLight} />
        ) : activeView === 'old' ? (
          <OldTabsList isLight={isLight} />
        ) : (
          <TabExportImport isLight={isLight} />
        )}
      </div>
    </div>
  );
};
