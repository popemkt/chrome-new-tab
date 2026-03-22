import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  return (
    <div className={`App ${isLight ? '' : 'dark'}`} data-testid="app">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-foreground p-4 text-center text-[calc(10px+2vmin)]">
        <button onClick={goGithubSite} className="border-none bg-transparent cursor-pointer">
          <img src={chrome.runtime.getURL(logo)} className="h-[50vmin] mb-4" alt="logo" />
        </button>
        <p>
          Edit <code className="bg-muted rounded px-1.5 py-0.5 text-sm">pages/side-panel/src/SidePanel.tsx</code>
        </p>
        <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
      </div>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(SidePanel, <div className="p-4 text-muted-foreground">Loading...</div>),
  <div className="p-4 text-destructive">Error Occur</div>,
);
