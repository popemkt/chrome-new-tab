// Options page functionality
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const newUrlInput = document.getElementById('new-url');
  const addUrlButton = document.getElementById('add-url');
  const urlsContainer = document.getElementById('urls-container');
  const saveButton = document.getElementById('save-urls');
  const statusDiv = document.getElementById('status');
  
  // Store URLs in memory
  let urls = [];
  
  // Load saved URLs
  loadUrls();
  
  // Add URL button click handler
  addUrlButton.addEventListener('click', function() {
    addUrl();
  });
  
  // Enter key to add URL
  newUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addUrl();
    }
  });
  
  // Save button click handler
  saveButton.addEventListener('click', function() {
    saveUrls();
  });
  
  // Load URLs from storage
  function loadUrls() {
    chrome.storage.sync.get(['urls'], function(result) {
      urls = result.urls || [];
      renderUrlList();
    });
  }
  
  // Add a new URL
  function addUrl() {
    const url = newUrlInput.value.trim();
    if (url && !urls.includes(url)) {
      urls.push(url);
      newUrlInput.value = '';
      renderUrlList();
    }
  }
  
  // Render the URL list
  function renderUrlList() {
    // Clear the list
    urlsContainer.innerHTML = '';
    
    if (urls.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.classList.add('empty-message');
      emptyMessage.textContent = 'No URLs added yet';
      urlsContainer.appendChild(emptyMessage);
    } else {
      // Add each URL to the list
      urls.forEach(function(url, index) {
        const li = document.createElement('li');
        
        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;
        li.appendChild(urlSpan);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function() {
          urls.splice(index, 1);
          renderUrlList();
        });
        
        li.appendChild(deleteButton);
        urlsContainer.appendChild(li);
      });
    }
  }
  
  // Save URLs to storage
  function saveUrls() {
    chrome.storage.sync.set({urls: urls}, function() {
      // Show saved message
      statusDiv.textContent = 'URLs saved successfully!';
      setTimeout(function() {
        statusDiv.textContent = '';
      }, 3000);
    });
  }
});
