// BACKGROUND SCRIPT - MAIN EXTENSION ENTRY POINT
// This file runs as a service worker in the background and is loaded when Chrome starts
// or when the extension is installed/updated. It can listen for browser events even when
// no extension pages are open.

// Import the polyfill for cross-browser compatibility 
import 'webextension-polyfill';

// IMPORTANT: Import the storage implementation from the shared packages
// This shows how the monorepo structure allows sharing code between components
import { weightedUrlsStorage } from '@extension/storage';

// EVENT HANDLER: Extension installation or update
// This event fires when the extension is first installed or updated to a new version
chrome.runtime.onInstalled.addListener(async () => {
  console.log('New Tab URL Redirector extension installed');
  
  // MIGRATION: Handle data from previous versions
  // This is important for preserving user data during updates
  await weightedUrlsStorage.migrateFromOldFormat();
  
  // INITIALIZATION: Check existing data
  // Retrieve stored URLs to see what's already configured
  const urls = await weightedUrlsStorage.get();
  console.log(`Initialized with ${urls.length} URLs`);
});

// EVENT HANDLER: Extension icon click
// Opens the options page when the user clicks the extension icon
// This overrides the default popup behavior defined in the manifest
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// STARTUP CONFIRMATION
// This line executes when the background script first loads
console.log('New Tab URL Redirector background service loaded');

// NOTE: The background script stays active and can:
// 1. Listen for browser events (tab creation, navigation, etc.)
// 2. Manage extension state that should persist between user sessions
// 3. Communicate with content scripts and extension pages
// 4. Perform tasks that need to run regardless of extension UI state
