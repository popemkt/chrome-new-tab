// STORAGE IMPLEMENTATION MODULE
// This file defines the TypeScript interfaces and implementation for the weighted URLs storage

// Import the base storage types and factory function
import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

/**
 * TYPESCRIPT INTERFACE: WeightedUrl
 * This defines the shape of each URL entry in our storage
 * 
 * TypeScript interfaces provide compile-time type checking to prevent errors
 * like trying to access properties that don't exist or using incorrect types
 */
export interface WeightedUrl {
  url: string;   // The URL to redirect to
  weight: number; // The probability weight for selection
}

/**
 * TYPESCRIPT TYPE EXTENSION: WeightedUrlsStorage
 * 
 * This creates a new type that:
 * 1. Extends the BaseStorage type with our WeightedUrl[] data type
 * 2. Adds additional methods specific to managing weighted URLs
 * 
 * IMPORTANT: This pattern shows how TypeScript allows extending existing types
 * with additional functionality while maintaining type safety
 */
export type WeightedUrlsStorage = BaseStorage<WeightedUrl[]> & {
  /**
   * Gets a random URL based on weights
   * @returns Promise with the selected URL or null if no URLs are available
   */
  getRandomUrl: () => Promise<string | null>;
  
  /**
   * Add a new URL with weight
   * @param url The URL to add
   * @param weight The weight of the URL (defaults to 1)
   */
  addUrl: (url: string, weight: number) => Promise<void>;
  
  /**
   * Remove a URL by its value
   * @param url The URL to remove
   */
  removeUrl: (url: string) => Promise<void>;
  
  /**
   * Update a URL's weight
   * @param url The URL to update
   * @param weight The new weight
   */
  updateUrlWeight: (url: string, weight: number) => Promise<void>;
  
  /**
   * Migrates from old format URLs if needed
   */
  migrateFromOldFormat: () => Promise<void>;
};

// STORAGE CREATION - CORE FUNCTIONALITY
// Create the base storage instance with our WeightedUrl[] type

// IMPORTANT: This factory function pattern is a key part of the architecture
// It creates a storage wrapper with strongly-typed data and operations
const storage = createStorage<WeightedUrl[]>(
  'weighted-urls-storage-key',  // Storage key used in Chrome's storage API
  [],                           // Default value (empty array) if storage is empty
  {
    // CONFIGURATION OPTIONS
    storageEnum: StorageEnum.Sync, // Use sync storage to share between devices
    liveUpdate: true,             // Enable live updates for real-time changes across components
  }
);

/**
 * UTILITY FUNCTION: Ensure URL has a protocol
 * This adds https:// to URLs if they don't already have a protocol
 */
function ensureUrlHasProtocol(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

/**
 * STORAGE IMPLEMENTATION
 * This creates the actual weightedUrlsStorage object by:
 * 1. Starting with the base storage object (using spread operator)
 * 2. Adding custom methods that implement our specific functionality
 * 
 * This pattern combines the base operations (get, set) with specialized methods
 */
export const weightedUrlsStorage: WeightedUrlsStorage = {
  // COMPOSITION: Include all methods from the base storage
  ...storage,
  
  // CUSTOM METHOD: Get random URL with weighted probability
  getRandomUrl: async () => {
    // Get current list of URLs
    const weightedUrls = await storage.get();
    
    // Handle empty list case
    if (!weightedUrls || weightedUrls.length === 0) {
      return null;
    }
    
    // ALGORITHM: Weighted random selection
    // Step 1: Calculate total weight
    const totalWeight = weightedUrls.reduce((sum, item) => sum + item.weight, 0);
    
    // Step 2: Generate a random number within total weight range
    let random = Math.random() * totalWeight;
    
    // Step 3: Find URL that corresponds to the random value
    // This works by subtracting each weight from random until we go <= 0
    for (const item of weightedUrls) {
      random -= item.weight;
      if (random <= 0) {
        return ensureUrlHasProtocol(item.url);
      }
    }
    
    // Fallback (should only reach here in extremely rare cases)
    return weightedUrls.length > 0 ? ensureUrlHasProtocol(weightedUrls[0].url) : null;
  },
  
  // CUSTOM METHOD: Add or update URL
  addUrl: async (url: string, weight: number = 1) => {
    // Data validation and normalization
    const trimmedUrl = url.trim();
    const validWeight = Math.max(1, weight); // Ensure weight is at least 1
    
    if (!trimmedUrl) return;
    
    // IMPORTANT: Pattern for updating state in storage
    // The set method takes a function that receives current state and returns new state
    await storage.set(currentUrls => {
      // Check if URL already exists
      const existingIndex = currentUrls.findIndex(item => item.url === trimmedUrl);
      
      if (existingIndex >= 0) {
        // IMMUTABLE UPDATE: Create a new array instead of modifying existing one
        // This is a common pattern in React and modern JS for predictable state management
        const updatedUrls = [...currentUrls];
        updatedUrls[existingIndex].weight = validWeight;
        return updatedUrls;
      }
      
      // IMMUTABLE UPDATE: Return new array with added item
      return [...currentUrls, { url: trimmedUrl, weight: validWeight }];
    });
  },
  
  // CUSTOM METHOD: Remove a URL
  removeUrl: async (url: string) => {
    // FUNCTIONAL APPROACH: Using filter for immutable removal
    await storage.set(currentUrls => {
      return currentUrls.filter(item => item.url !== url);
    });
  },
  
  // CUSTOM METHOD: Update a URL's weight
  updateUrlWeight: async (url: string, weight: number) => {
    const validWeight = Math.max(1, weight); // Ensure weight is at least 1
    
    // FUNCTIONAL APPROACH: Using map for immutable updates
    await storage.set(currentUrls => {
      return currentUrls.map(item => {
        if (item.url === url) {
          // OBJECT SPREAD: Create a new object with updated weight
          return { ...item, weight: validWeight };
        }
        return item;
      });
    });
  },
  
  // CUSTOM METHOD: Migrate from old format to new format
  // This allows backward compatibility with previous versions
  migrateFromOldFormat: async () => {
    // Check if Chrome API is available (necessary for testing/development)
    if (chrome && chrome.storage) {
      // Get data stored in old format
      const result = await chrome.storage.sync.get(['urls']);
      
      // If old format data exists, convert it
      if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
        // Map old URLs to new format with default weight
        const weightedUrls: WeightedUrl[] = result.urls.map((url: string) => ({ 
          url, 
          weight: 1 
        }));
        
        // Save in new format
        await storage.set(weightedUrls);
        
        // Clean up old data
        await chrome.storage.sync.remove(['urls']);
        
        console.log('Migrated from old URL format to weighted format');
      }
    }
  }
};
