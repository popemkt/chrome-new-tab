import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { t } from '@extension/i18n';
import { ToggleButton } from '@extension/ui';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  return (
    <div className={`App ${isLight ? '' : 'dark'}`} data-testid="app">
      <div className="absolute inset-0 flex flex-col items-center justify-end bg-background text-foreground p-4 text-center text-xs">
        <button onClick={goGithubSite} className="border-none bg-transparent cursor-pointer">
          <img src={chrome.runtime.getURL(logo)} className="h-[50vmin] mb-4" alt="logo" />
        </button>
        <p>
          Edit <code className="bg-muted rounded px-1.5 py-0.5 text-xs">pages/popup/src/Popup.tsx</code>
        </p>
        <button
          className="mt-4 py-1 px-4 rounded-md font-bold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none cursor-pointer"
          onClick={injectContentScript}>
          Click to inject Content Script
        </button>
        <ToggleButton>{t('toggleTheme')}</ToggleButton>
      </div>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Popup, <div className="p-4 text-muted-foreground">Loading...</div>),
  <div className="p-4 text-destructive">Error Occur</div>,
);
