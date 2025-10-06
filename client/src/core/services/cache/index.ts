import { IndexedDBCache } from "./IndexedDBCache";
import type { IProviderCache } from "./CacheInterface";

/**
 * Factory function to create a cache instance
 * Automatically detects environment and returns appropriate implementation
 */
export const createCache = (): IProviderCache => {
  // Check if IndexedDB is available (web environment)
  if (typeof window !== "undefined" && "indexedDB" in window) {
    return new IndexedDBCache();
  }

  // Future: Add SQLite cache for Electron/Tauri desktop apps
  throw new Error("No cache implementation available for this environment");
};

// Singleton cache instance
let cacheInstance: IProviderCache | null = null;

/**
 * Get the singleton cache instance
 */
export const getCache = (): IProviderCache => {
  if (!cacheInstance) {
    cacheInstance = createCache();
  }
  return cacheInstance;
};

// Re-export types
export type { IProviderCache, CacheEntry } from "./CacheInterface";
