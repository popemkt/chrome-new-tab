// Background script for New Tab URL Redirector extension

// Initialize default settings if not already set
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['urls'], function(result) {
    if (!result.urls) {
      // Set default empty array if no URLs are configured
      chrome.storage.sync.set({urls: []}, function() {
        console.log('Initialized empty URL list');
      });
    }
  });
});

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(function() {
  chrome.runtime.openOptionsPage();
});