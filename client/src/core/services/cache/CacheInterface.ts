import type { Song } from "@/types";

/**
 * Cache entry with metadata
 */
export interface CacheEntry {
  data: string;
  variant?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  accessedAt: number;
}

/**
 * Provider cache interface
 * Supports multi-variant storage (multiple lyrics versions, multiple artwork URLs per song)
 */
export interface IProviderCache {
  /**
   * Get a single variant from cache
   * @param song - Song metadata
   * @param providerId - Provider identifier
   * @param type - Data type (lyrics or artwork)
   * @param variant - Optional variant discriminator (e.g., 'synced', 'plain', 'url_0')
   * @returns Cached data or null if not found
   */
  get(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    variant?: string,
  ): Promise<string | null>;

  /**
   * Get all variants for a song + provider combination
   * @param song - Song metadata
   * @param providerId - Provider identifier
   * @param type - Data type (lyrics or artwork)
   * @returns Array of all cached variants
   */
  getAll(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
  ): Promise<CacheEntry[]>;

  /**
   * Store a single variant in cache
   * @param song - Song metadata
   * @param providerId - Provider identifier
   * @param type - Data type (lyrics or artwork)
   * @param data - Data to cache
   * @param variant - Optional variant discriminator
   * @param metadata - Optional metadata (e.g., { isSynced: true, language: 'en' })
   */
  set(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    data: string,
    variant?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Store multiple variants at once (batch operation)
   * @param song - Song metadata
   * @param providerId - Provider identifier
   * @param type - Data type (lyrics or artwork)
   * @param entries - Array of entries to store
   */
  setMany(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    entries: Array<{
      data: string;
      variant?: string;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<void>;

  /**
   * Clear all cached data
   */
  clear(): Promise<void>;

  /**
   * Remove old cache entries based on last access time
   * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
   * @returns Number of entries deleted
   */
  cleanup(maxAgeMs?: number): Promise<number>;
}
