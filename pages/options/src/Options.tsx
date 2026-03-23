import { useEffect, useState } from 'react';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, themePresetStorage, applyThemePreset } from '@extension/storage';
import { AppLayout, AppSidebar, type SidebarApp } from '@extension/ui';
import { TabRedirector } from './components/TabRedirector';
import { TabOrganizer } from './components/TabOrganizer';
import { BulkActions } from './components/BulkActions';
import { Settings } from './components/Settings';

type ActiveView = 'tab-manager' | 'settings';
type SettingsTab = 'redirector' | 'organizer' | 'bulk';

const TabManagerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h12" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ThemeIcon = ({ isLight }: { isLight: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    {isLight ? (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ) : (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    )}
  </svg>
);

const apps: SidebarApp[] = [{ id: 'tab-manager', name: 'Tab Manager', icon: <TabManagerIcon /> }];

const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const presetName = useStorage(themePresetStorage);
  const isLight = theme === 'light';
  const [activeView, setActiveView] = useState<ActiveView>('tab-manager');
  const [activeTab, setActiveTab] = useState<SettingsTab>('redirector');

  // Apply theme preset CSS variables whenever preset or mode changes
  useEffect(() => {
    applyThemePreset(presetName, isLight ? 'light' : 'dark');
  }, [presetName, isLight]);

  const sidebar = (
    <AppSidebar
      apps={apps}
      activeAppId={activeView === 'settings' ? '' : activeView}
      onAppSelect={id => setActiveView(id as ActiveView)}
      header={
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
          E
        </div>
      }
      footer={
        <>
          <FooterButton label={isLight ? 'Dark mode' : 'Light mode'} onClick={exampleThemeStorage.toggle}>
            <ThemeIcon isLight={isLight} />
          </FooterButton>
          <FooterButton label="Settings" onClick={() => setActiveView('settings')}>
            <SettingsIcon />
          </FooterButton>
        </>
      }
    />
  );

  return (
    <div className={isLight ? '' : 'dark'}>
      <AppLayout sidebar={sidebar}>
        {activeView === 'settings' ? (
          <div className="flex-1 overflow-auto p-8">
            <Settings />
          </div>
        ) : (
          <div className="flex h-full">
            {/* Secondary sidebar - page navigation */}
            <div className="w-60 border-r border-border bg-muted/30 p-3 flex flex-col gap-1">
              <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tab Manager
              </h2>
              <NavButton active={activeTab === 'redirector'} onClick={() => setActiveTab('redirector')}>
                Redirector
              </NavButton>
              <NavButton active={activeTab === 'organizer'} onClick={() => setActiveTab('organizer')}>
                Organizer
              </NavButton>
              <NavButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')}>
                Bulk Actions
              </NavButton>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto p-8">
              {activeTab === 'redirector' ? (
                <TabRedirector />
              ) : activeTab === 'organizer' ? (
                <TabOrganizer />
              ) : (
                <BulkActions />
              )}
            </div>
          </div>
        )}
      </AppLayout>
    </div>
  );
};

function FooterButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground">
        {children}
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border-none px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}>
      {children}
    </button>
  );
}

export default withErrorBoundary(
  withSuspense(
    Options,
    <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>,
  ),
  <div className="flex h-screen items-center justify-center text-destructive">
    An error occurred while loading options.
  </div>,
);
