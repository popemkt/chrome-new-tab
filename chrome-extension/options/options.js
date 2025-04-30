// Options page functionality
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const newUrlInput = document.getElementById('new-url');
  const urlWeightInput = document.getElementById('url-weight');
  const addUrlButton = document.getElementById('add-url');
  const urlsContainer = document.getElementById('urls-container');
  const saveButton = document.getElementById('save-urls');
  const statusDiv = document.getElementById('status');
  
  // Store weighted URLs in memory
  let weightedUrls = [];
  
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
    chrome.storage.sync.get(['weightedUrls'], function(result) {
      // Handle migration from old format if needed
      if (result.weightedUrls) {
        weightedUrls = result.weightedUrls;
      } else {
        // Check for old format
        chrome.storage.sync.get(['urls'], function(oldResult) {
          if (oldResult.urls && oldResult.urls.length > 0) {
            // Convert old format to new format
            weightedUrls = oldResult.urls.map(url => ({ url, weight: 1 }));
          } else {
            weightedUrls = [];
          }
          renderUrlList();
        });
        return;
      }
      renderUrlList();
    });
  }
  
  // Add a new weighted URL
  function addUrl() {
    const url = newUrlInput.value.trim();
    const weight = parseInt(urlWeightInput.value) || 1;
    
    if (url) {
      // Check if URL already exists
      const existingIndex = weightedUrls.findIndex(item => item.url === url);
      
      if (existingIndex >= 0) {
        // Update weight if URL already exists
        weightedUrls[existingIndex].weight = weight;
      } else {
        // Add new weighted URL
        weightedUrls.push({ url, weight });
      }
      
      newUrlInput.value = '';
      urlWeightInput.value = '1';
      renderUrlList();
    }
  }
  
  // Render the URL list
  function renderUrlList() {
    // Clear the list
    urlsContainer.innerHTML = '';
    
    if (weightedUrls.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.classList.add('empty-message');
      emptyMessage.textContent = 'No URLs added yet';
      urlsContainer.appendChild(emptyMessage);
    } else {
      // Add each weighted URL to the list
      weightedUrls.forEach(function(item, index) {
        const li = document.createElement('li');
        
        const urlSpan = document.createElement('span');
        urlSpan.textContent = item.url;
        urlSpan.classList.add('url-text');
        li.appendChild(urlSpan);
        
        const weightLabel = document.createElement('span');
        weightLabel.textContent = `Weight: ${item.weight}`;
        weightLabel.classList.add('weight-label');
        li.appendChild(weightLabel);
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-button');
        editButton.addEventListener('click', function() {
          // Fill the form with the current values
          newUrlInput.value = item.url;
          urlWeightInput.value = item.weight;
          
          // Remove the old entry
          weightedUrls.splice(index, 1);
          
          // Focus on the URL input for ease of editing
          newUrlInput.focus();
          
          renderUrlList();
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function() {
          weightedUrls.splice(index, 1);
          renderUrlList();
        });
        
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');
        buttonGroup.appendChild(editButton);
        buttonGroup.appendChild(deleteButton);
        
        li.appendChild(buttonGroup);
        urlsContainer.appendChild(li);
      });
    }
  }
  
  // Save URLs to storage
  function saveUrls() {
    chrome.storage.sync.set({weightedUrls: weightedUrls}, function() {
      // Show saved message
      statusDiv.textContent = 'URLs saved successfully!';
      setTimeout(function() {
        statusDiv.textContent = '';
      }, 3000);
    });
  }
});
