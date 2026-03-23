import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import { t } from '@extension/i18n';

const Panel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'devtools-panel/logo_horizontal.svg' : 'devtools-panel/logo_horizontal_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  return (
    <div className={`App ${isLight ? '' : 'dark'}`} data-testid="app">
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground p-8 text-center text-[calc(10px+2vmin)]">
        <div className="flex flex-col items-center">
          <button onClick={goGithubSite} className="border-none bg-transparent cursor-pointer">
            <img src={chrome.runtime.getURL(logo)} className="h-[40vmin]" alt="logo" />
          </button>
          <p>
            Edit <code className="bg-muted rounded px-1.5 py-0.5 text-sm">pages/devtools-panel/src/Panel.tsx</code>
          </p>
          <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
        </div>
      </div>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Panel, <div className="p-4 text-muted-foreground">Loading...</div>),
  <div className="p-4 text-destructive">Error Occur</div>,
);
