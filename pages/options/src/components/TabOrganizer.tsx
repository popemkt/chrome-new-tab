import { useState } from 'react';
import { DuplicateTabsList } from './DuplicateTabsList';
import { SuspiciousTabsList } from './SuspiciousTabsList';
import { OldTabsList } from './OldTabsList';
import { TabExportImport } from './TabExportImport';

type OrganizerView = 'duplicates' | 'suspicious' | 'old' | 'export';

export const TabOrganizer = () => {
  const [activeView, setActiveView] = useState<OrganizerView>('duplicates');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Tab Organizer</h1>
        <p className="text-sm text-muted-foreground">Find and manage problematic tabs across all your windows.</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg overflow-x-auto">
        {(['duplicates', 'suspicious', 'old', 'export'] as const).map(view => (
          <button
            key={view}
            className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors whitespace-nowrap border-none cursor-pointer ${
              activeView === view
                ? 'bg-card text-primary shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveView(view)}>
            {view === 'duplicates'
              ? 'Duplicate Tabs'
              : view === 'suspicious'
                ? 'Suspicious Tabs'
                : view === 'old'
                  ? 'Old & Unused'
                  : 'Export/Import'}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeView === 'duplicates' ? (
          <DuplicateTabsList />
        ) : activeView === 'suspicious' ? (
          <SuspiciousTabsList />
        ) : activeView === 'old' ? (
          <OldTabsList />
        ) : (
          <TabExportImport />
        )}
      </div>
    </div>
  );
};
