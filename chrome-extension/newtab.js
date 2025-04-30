// This script runs when a new tab is opened
document.addEventListener('DOMContentLoaded', function() {
  // Get the weighted URLs from storage
  chrome.storage.sync.get(['weightedUrls', 'urls'], function(result) {
    let weightedUrls = result.weightedUrls;
    
    // Handle migration from old format
    if (!weightedUrls && result.urls) {
      weightedUrls = result.urls.map(url => ({ url, weight: 1 }));
    } else if (!weightedUrls) {
      weightedUrls = [];
    }
    
    if (weightedUrls.length === 0) {
      // No URLs configured, show message
      document.getElementById('no-urls').style.display = 'block';
      return;
    }
    
    // Get a weighted random URL
    const randomUrl = getWeightedRandomUrl(weightedUrls);
    
    // Redirect to the random URL
    window.location.href = ensureUrlHasProtocol(randomUrl);
  });
});

// Get a weighted random URL
function getWeightedRandomUrl(weightedUrls) {
  // Calculate total weight
  const totalWeight = weightedUrls.reduce((sum, item) => sum + item.weight, 0);
  
  // Generate a random number between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  // Find the URL that corresponds to the random value
  for (const item of weightedUrls) {
    random -= item.weight;
    if (random <= 0) {
      return item.url;
    }
  }
  
  // Fallback (should never reach here)
  return weightedUrls[0].url;
}

// Ensure URL has a protocol (http:// or https://)
function ensureUrlHasProtocol(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}
