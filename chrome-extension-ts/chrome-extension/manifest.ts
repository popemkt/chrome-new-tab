import { readFileSync } from 'node:fs';

// IMPORTANT: Read the version from package.json to use in the manifest
// This approach allows you to maintain a single source of truth for versioning
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * MANIFEST.JSON GENERATOR
 * 
 * This file is the MAIN ENTRY POINT for the Chrome extension configuration.
 * It generates the manifest.json file which tells Chrome how to load and run the extension.
 * 
 * The manifest defines:
 * 1. Basic metadata (name, version, description)
 * 2. Permissions required by the extension
 * 3. Entry points for different components (background scripts, popups, etc.)
 * 4. Content scripts to be injected into web pages
 * 
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
  // REQUIRED: Specifies Manifest V3 (latest extension format)
  manifest_version: 3,
  
  // Locale settings for internationalization
  default_locale: 'en',
  
  // Extension name displayed in Chrome Web Store and Extensions page
  name: 'New Tab URL Redirector',
  
  // Firefox-specific configuration (can be removed for Chrome-only extensions)
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
  
  // Extension version pulled from package.json
  version: packageJson.version,
  
  // Extension description from i18n
  description: '__MSG_extensionDescription__',
  
  // Host permissions define which websites the extension can access
  host_permissions: ['<all_urls>'],
  
  // IMPORTANT: Permissions define what Chrome APIs the extension can use
  // 'storage' - Access to chrome.storage API for saving data
  // 'scripting' - Ability to inject scripts into web pages
  // 'tabs' - Access to the browser tabs system
  // 'tabGroups' - Access to tab groups API for organizing tabs
  // 'notifications' - Ability to show system notifications
  // 'sidePanel' - Access to Chrome's side panel feature
  permissions: ['storage', 'scripting', 'tabs', 'tabGroups', 'notifications', 'sidePanel'],
  
  // ENTRY POINT: Options page HTML file
  // This page is accessed via right-click on extension icon -> Options
  options_page: 'options/index.html',
  
  // ENTRY POINT: Background service worker
  // This script runs in the background and handles events even when no
  // extension pages are open
  background: {
    service_worker: 'background.js',
    type: 'module',  // Allows use of ES modules
  },
  
  // ENTRY POINT: Popup configuration
  // This UI appears when clicking the extension icon in the toolbar
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-34.png',
  },
  
  // ENTRY POINT: New Tab override
  // Replaces Chrome's default new tab page with our custom page
  chrome_url_overrides: {
    newtab: 'new-tab/index.html',
  },
  
  // Extension icons used in various contexts
  icons: {
    128: 'icon-128.png',
  },
  
  // ENTRY POINTS: Content scripts injected into web pages
  // These scripts run in the context of web pages the user visits
  content_scripts: [
    {
      // Pattern matching for which URLs to inject into
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      // JavaScript files to inject
      js: ['content/index.iife.js'],
    },
    // [GUIDE] Content UI script is disabled but can be re-enabled by uncommenting
    // {
    //   matches: ['http://*/*', 'https://*/*', '<all_urls>'],
    //   js: ['content-ui/index.iife.js'],
    // },
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      css: ['content.css'],  // CSS file to inject
    },
  ],
  
  // ENTRY POINT: DevTools page
  // Adds functionality to Chrome's developer tools
  devtools_page: 'devtools/index.html',
  
  // Resources that can be accessed by web pages via chrome-extension:// URLs
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
  
  // ENTRY POINT: Side panel configuration (Chrome 114+)
  side_panel: {
    default_path: 'side-panel/index.html',
  },
} satisfies chrome.runtime.ManifestV3;

export default manifest;
