import 'webextension-polyfill';
import { weightedUrlsStorage } from '@extension/storage';

// Initialize default settings when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log('New Tab URL Redirector extension installed');
  
  // Migrate from old format if necessary
  await weightedUrlsStorage.migrateFromOldFormat();
  
  // Check if we have any URLs configured
  const urls = await weightedUrlsStorage.get();
  console.log(`Initialized with ${urls.length} URLs`);
});

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

console.log('New Tab URL Redirector background service loaded');
