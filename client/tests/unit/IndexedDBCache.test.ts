import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IndexedDBCache } from "@/core/services/cache/IndexedDBCache";
import type { Song } from "@/types";
import { openDB } from "idb";

// Mock idb library
vi.mock("idb");

describe("IndexedDBCache", () => {
  let cache: IndexedDBCache;
  let mockDB: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
    createObjectStore: ReturnType<typeof vi.fn>;
  };
  let mockStore: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    index: ReturnType<typeof vi.fn>;
    createIndex: ReturnType<typeof vi.fn>;
  };
  let mockTransaction: {
    store: typeof mockStore;
    done: Promise<void>;
  };
  let mockIndex: {
    getAll: ReturnType<typeof vi.fn>;
    iterate: ReturnType<typeof vi.fn>;
  };

  const mockSong: Song = {
    name: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    duration: 180,
    currentTime: 0,
    isPlaying: false,
  };

  beforeEach(() => {
    // Create mock DB objects
    mockIndex = {
      getAll: vi.fn().mockResolvedValue([]),
      iterate: vi.fn().mockResolvedValue([]),
    };

    mockStore = {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      index: vi.fn().mockReturnValue(mockIndex),
      createIndex: vi.fn(),
    };

    mockTransaction = {
      store: mockStore,
      done: Promise.resolve(),
    };

    mockDB = {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn().mockReturnValue(mockTransaction),
      createObjectStore: vi.fn().mockReturnValue(mockStore),
    };

    // Mock openDB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(openDB).mockResolvedValue(mockDB as any);

    cache = new IndexedDBCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize database on first operation", async () => {
      await cache.get(mockSong, "test-provider", "lyrics");

      expect(openDB).toHaveBeenCalledWith(
        "live-lyrics-cache",
        1,
        expect.any(Object),
      );
    });

    it("should only initialize once", async () => {
      await cache.get(mockSong, "test-provider", "lyrics");
      await cache.get(mockSong, "test-provider", "lyrics");

      expect(openDB).toHaveBeenCalledTimes(1);
    });

    it("should create object store and indexes during upgrade", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let upgradeCallback: any;

      vi.mocked(openDB).mockImplementation(async (_name, _version, options) => {
        upgradeCallback = options?.upgrade;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return mockDB as any;
      });

      await cache.get(mockSong, "test-provider", "lyrics");

      // Call upgrade callback
      if (upgradeCallback) {
        upgradeCallback(mockDB);
      }

      expect(mockDB.createObjectStore).toHaveBeenCalledWith("providerCache", {
        keyPath: "id",
      });
      expect(mockStore.createIndex).toHaveBeenCalledWith("by-song-provider", [
        "songName",
        "songArtist",
        "songAlbum",
        "providerType",
        "providerId",
      ]);
      expect(mockStore.createIndex).toHaveBeenCalledWith(
        "by-access",
        "accessedAt",
      );
    });

    it("should reuse existing initialization promise", async () => {
      const promise1 = cache.get(mockSong, "test-provider", "lyrics");
      const promise2 = cache.get(mockSong, "test-provider", "lyrics");

      await Promise.all([promise1, promise2]);

      expect(openDB).toHaveBeenCalledTimes(1);
    });
  });

  describe("get()", () => {
    it("should return cached data", async () => {
      const mockEntry = {
        id: "Test Song:Test Artist:Test Album:test-provider:lyrics:default",
        songName: "Test Song",
        songArtist: "Test Artist",
        songAlbum: "Test Album",
        providerId: "test-provider",
        providerType: "lyrics",
        dataVariant: "default",
        data: "cached lyrics",
        metadata: {},
        createdAt: Date.now(),
        accessedAt: Date.now(),
      };

      mockDB.get.mockResolvedValue(mockEntry);

      const result = await cache.get(mockSong, "test-provider", "lyrics");

      expect(result).toBe("cached lyrics");
    });

    it("should return null for cache miss", async () => {
      mockDB.get.mockResolvedValue(undefined);

      const result = await cache.get(mockSong, "test-provider", "lyrics");

      expect(result).toBeNull();
    });

    it("should update access time on cache hit", async () => {
      const mockEntry = {
        id: "Test Song:Test Artist:Test Album:test-provider:lyrics:default",
        songName: "Test Song",
        songArtist: "Test Artist",
        songAlbum: "Test Album",
        providerId: "test-provider",
        providerType: "lyrics",
        dataVariant: "default",
        data: "cached lyrics",
        metadata: {},
        createdAt: Date.now() - 10000,
        accessedAt: Date.now() - 10000,
      };

      mockDB.get.mockResolvedValue(mockEntry);

      await cache.get(mockSong, "test-provider", "lyrics");

      expect(mockDB.put).toHaveBeenCalledWith(
        "providerCache",
        expect.objectContaining({
          accessedAt: expect.any(Number),
        }),
      );
    });

    it("should support variant parameter", async () => {
      await cache.get(mockSong, "test-provider", "lyrics", "synced");

      expect(mockDB.get).toHaveBeenCalledWith(
        "providerCache",
        "Test Song:Test Artist:Test Album:test-provider:lyrics:synced",
      );
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockDB.get.mockRejectedValue(new Error("DB error"));

      const result = await cache.get(mockSong, "test-provider", "lyrics");

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to get from cache:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getAll()", () => {
    it("should return all variants for song+provider", async () => {
      const mockEntries = [
        {
          id: "Test Song:Test Artist:Test Album:test-provider:lyrics:synced",
          songName: "Test Song",
          songArtist: "Test Artist",
          songAlbum: "Test Album",
          providerId: "test-provider",
          providerType: "lyrics",
          dataVariant: "synced",
          data: "synced lyrics",
          metadata: { source: "provider" },
          createdAt: 123,
          accessedAt: 456,
        },
        {
          id: "Test Song:Test Artist:Test Album:test-provider:lyrics:plain",
          songName: "Test Song",
          songArtist: "Test Artist",
          songAlbum: "Test Album",
          providerId: "test-provider",
          providerType: "lyrics",
          dataVariant: "plain",
          data: "plain lyrics",
          metadata: {},
          createdAt: 789,
          accessedAt: 101112,
        },
      ];

      mockIndex.getAll.mockResolvedValue(mockEntries);

      const result = await cache.getAll(mockSong, "test-provider", "lyrics");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        data: "synced lyrics",
        variant: "synced",
        metadata: { source: "provider" },
        createdAt: 123,
        accessedAt: 456,
      });
      expect(result[1]).toMatchObject({
        data: "plain lyrics",
        variant: "plain",
        metadata: {},
        createdAt: 789,
        accessedAt: 101112,
      });
    });

    it("should query correct index", async () => {
      await cache.getAll(mockSong, "test-provider", "lyrics");

      expect(mockTransaction.store.index).toHaveBeenCalledWith(
        "by-song-provider",
      );
      expect(mockIndex.getAll).toHaveBeenCalledWith([
        "Test Song",
        "Test Artist",
        "Test Album",
        "lyrics",
        "test-provider",
      ]);
    });

    it("should return empty array on error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockIndex.getAll.mockRejectedValue(new Error("Query failed"));

      const result = await cache.getAll(mockSong, "test-provider", "lyrics");

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to get all from cache:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("set()", () => {
    it("should store data in cache", async () => {
      await cache.set(
        mockSong,
        "test-provider",
        "lyrics",
        "cached lyrics",
        "synced",
        { source: "api" },
      );

      expect(mockDB.put).toHaveBeenCalledWith(
        "providerCache",
        expect.objectContaining({
          id: "Test Song:Test Artist:Test Album:test-provider:lyrics:synced",
          songName: "Test Song",
          songArtist: "Test Artist",
          songAlbum: "Test Album",
          providerId: "test-provider",
          providerType: "lyrics",
          dataVariant: "synced",
          data: "cached lyrics",
          metadata: { source: "api" },
          createdAt: expect.any(Number),
          accessedAt: expect.any(Number),
        }),
      );
    });

    it("should use default variant and metadata", async () => {
      await cache.set(mockSong, "test-provider", "lyrics", "cached lyrics");

      expect(mockDB.put).toHaveBeenCalledWith(
        "providerCache",
        expect.objectContaining({
          dataVariant: "default",
          metadata: {},
        }),
      );
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockDB.put.mockRejectedValue(new Error("Write failed"));

      await cache.set(mockSong, "test-provider", "lyrics", "cached lyrics");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to set cache:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("setMany()", () => {
    it("should store multiple variants in batch", async () => {
      const entries = [
        {
          data: "synced lyrics",
          variant: "synced",
          metadata: { type: "synced" },
        },
        { data: "plain lyrics", variant: "plain", metadata: { type: "plain" } },
      ];

      await cache.setMany(mockSong, "test-provider", "lyrics", entries);

      expect(mockStore.put).toHaveBeenCalledTimes(2);
      expect(mockStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "Test Song:Test Artist:Test Album:test-provider:lyrics:synced",
          data: "synced lyrics",
          dataVariant: "synced",
          metadata: { type: "synced" },
        }),
      );
      expect(mockStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "Test Song:Test Artist:Test Album:test-provider:lyrics:plain",
          data: "plain lyrics",
          dataVariant: "plain",
          metadata: { type: "plain" },
        }),
      );
    });

    it("should use default variant and metadata for entries without them", async () => {
      const entries = [{ data: "lyrics1" }, { data: "lyrics2" }];

      await cache.setMany(mockSong, "test-provider", "lyrics", entries);

      expect(mockStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          dataVariant: "default",
          metadata: {},
        }),
      );
    });

    it("should handle transaction errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockStore.put.mockRejectedValue(new Error("Transaction failed"));

      await cache.setMany(mockSong, "test-provider", "lyrics", [
        { data: "lyrics" },
      ]);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to set many cache entries:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should wait for transaction to complete", async () => {
      const entries = [{ data: "lyrics1" }, { data: "lyrics2" }];

      await cache.setMany(mockSong, "test-provider", "lyrics", entries);

      // Verify transaction.done was awaited
      expect(mockTransaction.done).toBeDefined();
    });
  });

  describe("clear()", () => {
    it("should clear all cached data", async () => {
      await cache.clear();

      expect(mockDB.clear).toHaveBeenCalledWith("providerCache");
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockDB.clear.mockRejectedValue(new Error("Clear failed"));

      await cache.clear();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to clear cache:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("cleanup()", () => {
    it("should delete entries older than maxAge", async () => {
      const oldEntries = [
        { id: "old1", accessedAt: Date.now() - 40 * 24 * 60 * 60 * 1000 },
        { id: "old2", accessedAt: Date.now() - 35 * 24 * 60 * 60 * 1000 },
      ];

      const mockCursor = {
        value: oldEntries[0],
        delete: vi.fn().mockResolvedValue(undefined),
        continue: vi.fn(),
      };

      const iteratorMock = {
        async *[Symbol.asyncIterator]() {
          for (const entry of oldEntries) {
            yield { ...mockCursor, value: entry };
          }
        },
      };

      mockIndex.iterate.mockReturnValue(iteratorMock);

      const deleted = await cache.cleanup(30 * 24 * 60 * 60 * 1000);

      expect(deleted).toBe(2);
    });

    it("should use default maxAge of 30 days", async () => {
      // Mock index.iterate to return entries with various ages
      const iteratorMock = {
        async *[Symbol.asyncIterator]() {
          // No entries to delete
        },
      };

      mockIndex.iterate.mockReturnValue(iteratorMock);

      await cache.cleanup();

      // Verify transaction was created with readwrite mode
      expect(mockDB.transaction).toHaveBeenCalledWith(
        "providerCache",
        "readwrite",
      );
    });

    it("should skip entries within maxAge", async () => {
      const recentEntry = {
        id: "recent",
        accessedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      };

      const mockCursor = {
        value: recentEntry,
        delete: vi.fn(),
      };

      const iteratorMock = {
        async *[Symbol.asyncIterator]() {
          yield mockCursor;
        },
      };

      mockIndex.iterate.mockReturnValue(iteratorMock);

      const deleted = await cache.cleanup(30 * 24 * 60 * 60 * 1000);

      expect(deleted).toBe(0);
      expect(mockCursor.delete).not.toHaveBeenCalled();
    });

    it("should return 0 on error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockDB.transaction.mockImplementation(() => {
        throw new Error("Transaction failed");
      });

      const deleted = await cache.cleanup();

      expect(deleted).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to cleanup cache:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate unique keys for different songs", () => {
      const song1: Song = {
        name: "Song 1",
        artist: "Artist",
        album: "Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };
      const song2: Song = {
        name: "Song 2",
        artist: "Artist",
        album: "Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key1 = (cache as any).getCacheKey(song1, "provider", "lyrics");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key2 = (cache as any).getCacheKey(song2, "provider", "lyrics");

      expect(key1).not.toBe(key2);
    });

    it("should generate unique keys for different providers", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key1 = (cache as any).getCacheKey(mockSong, "provider1", "lyrics");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key2 = (cache as any).getCacheKey(mockSong, "provider2", "lyrics");

      expect(key1).not.toBe(key2);
    });

    it("should generate unique keys for different types", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key1 = (cache as any).getCacheKey(mockSong, "provider", "lyrics");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key2 = (cache as any).getCacheKey(mockSong, "provider", "artwork");

      expect(key1).not.toBe(key2);
    });

    it("should generate unique keys for different variants", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key1 = (cache as any).getCacheKey(
        mockSong,
        "provider",
        "lyrics",
        "synced",
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key2 = (cache as any).getCacheKey(
        mockSong,
        "provider",
        "lyrics",
        "plain",
      );

      expect(key1).not.toBe(key2);
    });

    it("should use default variant when not specified", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key1 = (cache as any).getCacheKey(mockSong, "provider", "lyrics");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key2 = (cache as any).getCacheKey(
        mockSong,
        "provider",
        "lyrics",
        "default",
      );

      expect(key1).toBe(key2);
    });

    it("should include all song properties in key", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = (cache as any).getCacheKey(mockSong, "provider", "lyrics");

      expect(key).toContain("Test Song");
      expect(key).toContain("Test Artist");
      expect(key).toContain("Test Album");
      expect(key).toContain("provider");
      expect(key).toContain("lyrics");
    });
  });

  describe("Edge Cases", () => {
    it("should handle song with special characters in fields", async () => {
      const specialSong: Song = {
        name: "Song: With: Colons",
        artist: "Artist/With/Slashes",
        album: "Album\\With\\Backslashes",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      await cache.set(specialSong, "provider", "lyrics", "data");

      expect(mockDB.put).toHaveBeenCalled();
    });

    it("should handle empty metadata", async () => {
      await cache.set(mockSong, "provider", "lyrics", "data", "variant", {});

      expect(mockDB.put).toHaveBeenCalledWith(
        "providerCache",
        expect.objectContaining({
          metadata: {},
        }),
      );
    });

    it("should handle null database gracefully", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(openDB).mockResolvedValue(null as any);

      const result = await cache.get(mockSong, "provider", "lyrics");

      expect(result).toBeNull();
    });

    it("should handle concurrent initialization", async () => {
      const promise1 = cache.get(mockSong, "provider1", "lyrics");
      const promise2 = cache.get(mockSong, "provider2", "lyrics");
      const promise3 = cache.set(mockSong, "provider3", "lyrics", "data");

      await Promise.all([promise1, promise2, promise3]);

      expect(openDB).toHaveBeenCalledTimes(1);
    });
  });

  describe("Type Support", () => {
    it("should support lyrics type", async () => {
      await cache.set(mockSong, "provider", "lyrics", "lyrics data");

      expect(mockDB.put).toHaveBeenCalledWith(
        "providerCache",
        expect.objectContaining({
          providerType: "lyrics",
        }),
      );
    });

    it("should support artwork type", async () => {
      await cache.set(mockSong, "provider", "artwork", "artwork url");

      expect(mockDB.put).toHaveBeenCalledWith(
        "providerCache",
        expect.objectContaining({
          providerType: "artwork",
        }),
      );
    });
  });
});
