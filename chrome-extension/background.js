// Background script for New Tab URL Redirector extension

// Initialize default settings if not already set
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['weightedUrls', 'urls'], function(result) {
    if (!result.weightedUrls) {
      // Check if we need to convert from old format
      if (result.urls) {
        // Convert old URLs to weighted URLs
        const weightedUrls = result.urls.map(url => ({ url, weight: 1 }));
        chrome.storage.sync.set({weightedUrls: weightedUrls}, function() {
          console.log('Converted old URLs to weighted format');
        });
      } else {
        // Set default empty array if no URLs are configured
        chrome.storage.sync.set({weightedUrls: []}, function() {
          console.log('Initialized empty weighted URL list');
        });
      }
    }
  });
});

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(function() {
  chrome.runtime.openOptionsPage();
});