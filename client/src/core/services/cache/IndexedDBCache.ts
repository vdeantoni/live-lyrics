import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Song } from "@/types";
import type { IProviderCache, CacheEntry } from "./CacheInterface";

/**
 * IndexedDB cache row structure
 */
interface CacheRow {
  id: string; // composite key: `${name}:${artist}:${album}:${providerId}:${type}:${variant}`
  songName: string;
  songArtist: string;
  songAlbum: string;
  providerId: string;
  providerType: "lyrics" | "artwork";
  dataVariant: string; // 'synced', 'plain', 'url_0', 'url_1', 'default', etc.
  data: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  accessedAt: number;
}

/**
 * IndexedDB database schema
 */
interface CacheDB extends DBSchema {
  providerCache: {
    key: string;
    value: CacheRow;
    indexes: {
      "by-song-provider": [string, string, string, string, string]; // [name, artist, album, type, providerId]
      "by-access": number;
    };
  };
}

/**
 * IndexedDB cache implementation
 * Supports multi-variant storage (multiple lyrics versions, multiple artwork URLs per song)
 */
export class IndexedDBCache implements IProviderCache {
  private db: IDBPDatabase<CacheDB> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    // Return existing initialization promise if in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return;
    }

    // Start initialization
    this.initPromise = (async () => {
      try {
        this.db = await openDB<CacheDB>("live-lyrics-cache", 1, {
          upgrade(db) {
            const store = db.createObjectStore("providerCache", {
              keyPath: "id",
            });

            // Index for querying all variants of a song+provider combination
            store.createIndex("by-song-provider", [
              "songName",
              "songArtist",
              "songAlbum",
              "providerType",
              "providerId",
            ]);

            // Index for cleanup based on access time (LRU)
            store.createIndex("by-access", "accessedAt");
          },
        });
      } catch (error) {
        console.error("Failed to initialize IndexedDB cache:", error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Generate a unique cache key for a song+provider+type+variant combination
   */
  private getCacheKey(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    variant: string = "default",
  ): string {
    return `${song.name}:${song.artist}:${song.album}:${providerId}:${type}:${variant}`;
  }

  /**
   * Get a single variant from cache
   */
  async get(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    variant: string = "default",
  ): Promise<string | null> {
    await this.init();

    if (!this.db) return null;

    try {
      const key = this.getCacheKey(song, providerId, type, variant);
      const entry = await this.db.get("providerCache", key);

      if (!entry) return null;

      // Update access time for LRU tracking
      await this.db.put("providerCache", {
        ...entry,
        accessedAt: Date.now(),
      });

      return entry.data;
    } catch (error) {
      console.error("Failed to get from cache:", error);
      return null;
    }
  }

  /**
   * Get all variants for a song+provider combination
   */
  async getAll(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
  ): Promise<CacheEntry[]> {
    await this.init();

    if (!this.db) return [];

    try {
      const index = this.db
        .transaction("providerCache")
        .store.index("by-song-provider");

      const entries = await index.getAll([
        song.name,
        song.artist,
        song.album,
        type,
        providerId,
      ]);

      return entries.map((entry) => ({
        data: entry.data,
        variant: entry.dataVariant,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
        accessedAt: entry.accessedAt,
      }));
    } catch (error) {
      console.error("Failed to get all from cache:", error);
      return [];
    }
  }

  /**
   * Store a single variant in cache
   */
  async set(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    data: string,
    variant: string = "default",
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      const entry: CacheRow = {
        id: this.getCacheKey(song, providerId, type, variant),
        songName: song.name,
        songArtist: song.artist,
        songAlbum: song.album,
        providerId,
        providerType: type,
        dataVariant: variant,
        data,
        metadata,
        createdAt: Date.now(),
        accessedAt: Date.now(),
      };

      await this.db.put("providerCache", entry);
    } catch (error) {
      console.error("Failed to set cache:", error);
    }
  }

  /**
   * Store multiple variants at once (batch operation)
   */
  async setMany(
    song: Song,
    providerId: string,
    type: "lyrics" | "artwork",
    entries: Array<{
      data: string;
      variant?: string;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      const tx = this.db.transaction("providerCache", "readwrite");

      await Promise.all(
        entries.map((entry) => {
          const row: CacheRow = {
            id: this.getCacheKey(
              song,
              providerId,
              type,
              entry.variant || "default",
            ),
            songName: song.name,
            songArtist: song.artist,
            songAlbum: song.album,
            providerId,
            providerType: type,
            dataVariant: entry.variant || "default",
            data: entry.data,
            metadata: entry.metadata || {},
            createdAt: Date.now(),
            accessedAt: Date.now(),
          };
          return tx.store.put(row);
        }),
      );

      await tx.done;
    } catch (error) {
      console.error("Failed to set many cache entries:", error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      await this.db.clear("providerCache");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }

  /**
   * Remove old cache entries based on last access time
   * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
   * @returns Number of entries deleted
   */
  async cleanup(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    await this.init();

    if (!this.db) return 0;

    try {
      const cutoff = Date.now() - maxAgeMs;
      const tx = this.db.transaction("providerCache", "readwrite");
      const index = tx.store.index("by-access");

      let deleted = 0;

      // Iterate through entries and delete old ones
      for await (const cursor of index.iterate()) {
        if (cursor.value.accessedAt < cutoff) {
          await cursor.delete();
          deleted++;
        }
      }

      await tx.done;
      return deleted;
    } catch (error) {
      console.error("Failed to cleanup cache:", error);
      return 0;
    }
  }
}
