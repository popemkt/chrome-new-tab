// This script runs when a new tab is opened
document.addEventListener('DOMContentLoaded', function() {
  // Get the URLs from storage
  chrome.storage.sync.get(['urls'], function(result) {
    const urls = result.urls || [];
    
    if (urls.length === 0) {
      // No URLs configured, show message
      document.getElementById('no-urls').style.display = 'block';
      return;
    }
    
    // Select a random URL from the list
    const randomIndex = Math.floor(Math.random() * urls.length);
    const randomUrl = urls[randomIndex];
    
    // Redirect to the random URL
    window.location.href = ensureUrlHasProtocol(randomUrl);
  });
});

// Ensure URL has a protocol (http:// or https://)
function ensureUrlHasProtocol(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}
