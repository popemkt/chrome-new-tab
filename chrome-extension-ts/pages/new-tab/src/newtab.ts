import { weightedUrlsStorage } from '@extension/storage';

/**
 * This script runs when a new tab is opened
 * It gets a random URL based on weights and redirects to it
 */
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Get a weighted random URL
    const randomUrl = await weightedUrlsStorage.getRandomUrl();
    
    if (randomUrl) {
      // Redirect to the random URL
      window.location.href = randomUrl;
    } else {
      // No URLs configured, show message
      document.getElementById('no-urls')!.style.display = 'block';
      
      // Hide the loader
      const loader = document.querySelector('.loader');
      if (loader) {
        loader.remove();
      }
      
      // Update the message
      const message = document.querySelector('p:not(#no-urls)');
      if (message) {
        message.textContent = 'No redirection performed.';
      }
    }
  } catch (error) {
    console.error('Error in new tab redirection:', error);
    
    // Show error message instead of loader
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.remove();
    }
    
    // Update the message
    const message = document.querySelector('p:not(#no-urls)');
    if (message) {
      message.textContent = 'Error redirecting to URL. Please check the extension options.';
    }
  }
});
