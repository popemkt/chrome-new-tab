# New Tab URL Redirector

## Overview
This Chrome extension overrides the new tab page and redirects to a randomly selected URL from a user-configured list. It's perfect for users who want to visit specific websites regularly when opening new tabs.

## Features
- **New Tab Override**: Automatically redirects new tabs to one of your favorite websites
- **Random Selection**: Randomly chooses from your list of URLs for variety
- **Easy Configuration**: Simple options page to manage your list of websites

## Files
- **manifest.json**: Contains metadata about the extension, including its name, version, and permissions
- **background.js**: Handles background tasks and initializes the extension
- **newtab.html/js**: Handles new tab redirections
- **options/**: Contains files related to the configuration page
  - **options.html**: The HTML structure for the options page
  - **options.js**: JavaScript code for managing the URL list
  - **options.css**: Styles for the options page
- **icons/**: Contains icons of various sizes for the extension

## Installation
1. Download or clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click on "Load unpacked" and select the directory containing the extension files

## Usage
1. After installation, click the extension icon to open the options page
2. Add your favorite URLs to the list
3. Save your changes
4. Open a new tab to see the extension in action - it will automatically redirect to a random URL from your list

## Configuration
- Click the extension icon to open the options page
- Add URLs one by one (no need to include http:// or https://)
- Delete unwanted URLs by clicking the "Delete" button next to each one
- Click "Save" to store your changes

## Note
If no URLs are configured, the new tab page will display a message prompting you to add URLs.