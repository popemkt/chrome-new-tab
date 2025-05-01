// [GUIDE] NEW TAB PAGE ENTRY POINT
// [GUIDE] This TypeScript file is referenced by index.html and runs whenever a new tab is opened
// [GUIDE] It's responsible for redirecting to a randomly selected URL from the user's configured list

// [GUIDE] TYPESCRIPT COMPILATION:
// [GUIDE] 1. When built, this TypeScript file is transpiled to JavaScript by esbuild via Vite
// [GUIDE] 2. Type checking happens separately during the "type-check" task
// [GUIDE] 3. The output is placed in the dist/new-tab directory
// [GUIDE] 4. The manifest.json references the compiled JS, not this TS source

// [GUIDE] IMPORTANT: Import storage implementation from the shared package
// [GUIDE] This demonstrates the modular architecture where functionality is separated into packages
import { weightedUrlsStorage } from '@extension/storage';

/**
 * [GUIDE] MAIN EXECUTION FLOW:
 * 1. Script waits for DOM to load
 * 2. Retrieves a weighted random URL from storage
 * 3. Either redirects to the URL or shows a message if none are configured
 * 4. Handles any errors that might occur during this process
 */

// [GUIDE] EVENT HANDLER: DOM Content Loaded
// [GUIDE] This ensures the script runs after the HTML document is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // [GUIDE] CORE FUNCTIONALITY: Get weighted random URL
    // [GUIDE] This calls our storage implementation to get a URL based on weights
    const randomUrl = await weightedUrlsStorage.getRandomUrl();
    
    if (randomUrl) {
      // [GUIDE] REDIRECT: If we have a URL, navigate to it
      // [GUIDE] This is the primary purpose of this script - redirecting to a random URL
      window.location.href = randomUrl;
    } else {
      // [GUIDE] UI UPDATE: Handle case when no URLs are configured
      // [GUIDE] Show a message to the user with a link to the options page
      document.getElementById('no-urls')!.style.display = 'block';
      
      // [GUIDE] Remove the loading animation
      const loader = document.querySelector('.loader');
      if (loader) {
        loader.remove();
      }
      
      // [GUIDE] Update the status message
      const message = document.querySelector('p:not(#no-urls)');
      if (message) {
        message.textContent = 'No redirection performed.';
      }
    }
  } catch (error) {
    // [GUIDE] ERROR HANDLING: Handle any unexpected issues
    // [GUIDE] This could happen if storage access fails or there's another runtime error
    console.error('Error in new tab redirection:', error);
    
    // [GUIDE] Remove the loading animation
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.remove();
    }
    
    // [GUIDE] Show error message to user
    const message = document.querySelector('p:not(#no-urls)');
    if (message) {
      message.textContent = 'Error redirecting to URL. Please check the extension options.';
    }
  }
});

// [GUIDE] NOTE: This implementation uses vanilla TypeScript without React
// [GUIDE] This makes it more lightweight and faster to load, which is important for a new tab page
// [GUIDE] that needs to quickly redirect the user
