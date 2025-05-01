import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

/**
 * Interface defining a weighted URL entry
 */
export interface WeightedUrl {
  url: string;
  weight: number;
}

/**
 * Storage interface for weighted URLs with added functionality
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

// Create base storage with empty array as fallback
const storage = createStorage<WeightedUrl[]>('weighted-urls-storage-key', [], {
  storageEnum: StorageEnum.Sync, // Use sync storage to share between devices
  liveUpdate: true, // Enable live updates for real-time changes across extension components
});

/**
 * Ensure URL has a protocol (http:// or https://)
 */
function ensureUrlHasProtocol(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

/**
 * Implementation of the weighted URLs storage with additional methods
 */
export const weightedUrlsStorage: WeightedUrlsStorage = {
  ...storage,
  
  getRandomUrl: async () => {
    const weightedUrls = await storage.get();
    
    if (!weightedUrls || weightedUrls.length === 0) {
      return null;
    }
    
    // Calculate total weight
    const totalWeight = weightedUrls.reduce((sum, item) => sum + item.weight, 0);
    
    // Generate a random number between 0 and totalWeight
    let random = Math.random() * totalWeight;
    
    // Find the URL that corresponds to the random value
    for (const item of weightedUrls) {
      random -= item.weight;
      if (random <= 0) {
        return ensureUrlHasProtocol(item.url);
      }
    }
    
    // Fallback (should never reach here unless empty array)
    return weightedUrls.length > 0 ? ensureUrlHasProtocol(weightedUrls[0].url) : null;
  },
  
  addUrl: async (url: string, weight: number = 1) => {
    // Trim URL and ensure valid weight
    const trimmedUrl = url.trim();
    const validWeight = Math.max(1, weight); // Ensure weight is at least 1
    
    if (!trimmedUrl) return;
    
    await storage.set(currentUrls => {
      // Check if URL already exists
      const existingIndex = currentUrls.findIndex(item => item.url === trimmedUrl);
      
      if (existingIndex >= 0) {
        // Update weight if URL already exists
        const updatedUrls = [...currentUrls];
        updatedUrls[existingIndex].weight = validWeight;
        return updatedUrls;
      }
      
      // Add new URL with weight
      return [...currentUrls, { url: trimmedUrl, weight: validWeight }];
    });
  },
  
  removeUrl: async (url: string) => {
    await storage.set(currentUrls => {
      return currentUrls.filter(item => item.url !== url);
    });
  },
  
  updateUrlWeight: async (url: string, weight: number) => {
    const validWeight = Math.max(1, weight); // Ensure weight is at least 1
    
    await storage.set(currentUrls => {
      return currentUrls.map(item => {
        if (item.url === url) {
          return { ...item, weight: validWeight };
        }
        return item;
      });
    });
  },
  
  migrateFromOldFormat: async () => {
    // Check if we need to migrate from old format
    if (chrome && chrome.storage) {
      const result = await chrome.storage.sync.get(['urls']);
      
      if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
        // Convert old URLs to weighted URLs
        const weightedUrls: WeightedUrl[] = result.urls.map((url: string) => ({ 
          url, 
          weight: 1 
        }));
        
        // Save the converted URLs
        await storage.set(weightedUrls);
        
        // Clean up old data
        await chrome.storage.sync.remove(['urls']);
        
        console.log('Migrated from old URL format to weighted format');
      }
    }
  }
};
