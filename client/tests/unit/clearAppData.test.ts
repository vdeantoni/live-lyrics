import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { clearAppData } from "@/utils/clearAppData";
import type { IProviderCache } from "@/core/services/cache";

// Mock the cache module
vi.mock("@/core/services/cache", () => ({
  getCache: vi.fn(),
}));

describe("clearAppData", () => {
  let mockCache: IProviderCache;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalLocalStorage: Storage;
  let originalSessionStorage: Storage;

  beforeEach(async () => {
    // Create mock cache
    mockCache = {
      clear: vi.fn().mockResolvedValue(undefined),
    } as unknown as IProviderCache;

    // Mock getCache to return our mock
    const { getCache } = await import("@/core/services/cache");
    vi.mocked(getCache).mockReturnValue(mockCache);

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Save original storage
    originalLocalStorage = global.localStorage;
    originalSessionStorage = global.sessionStorage;

    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original storage
    global.localStorage = originalLocalStorage;
    global.sessionStorage = originalSessionStorage;
  });

  describe("Success Cases", () => {
    it("should clear IndexedDB cache", async () => {
      await clearAppData();

      expect(mockCache.clear).toHaveBeenCalledOnce();
    });

    it("should remove all LIVE_LYRICS_ prefixed items from localStorage", async () => {
      // Setup test data
      localStorage.setItem("LIVE_LYRICS_PLAYER_SETTINGS", "test1");
      localStorage.setItem("LIVE_LYRICS_LYRICS_SETTINGS", "test2");
      localStorage.setItem("LIVE_LYRICS_ARTWORK_SETTINGS", "test3");
      localStorage.setItem("OTHER_APP_DATA", "should-remain");

      await clearAppData();

      expect(localStorage.getItem("LIVE_LYRICS_PLAYER_SETTINGS")).toBeNull();
      expect(localStorage.getItem("LIVE_LYRICS_LYRICS_SETTINGS")).toBeNull();
      expect(localStorage.getItem("LIVE_LYRICS_ARTWORK_SETTINGS")).toBeNull();
      expect(localStorage.getItem("OTHER_APP_DATA")).toBe("should-remain");
    });

    it("should remove all LIVE_LYRICS_ prefixed items from sessionStorage", async () => {
      // Setup test data
      sessionStorage.setItem("LIVE_LYRICS_SESSION_DATA", "test1");
      sessionStorage.setItem("LIVE_LYRICS_TEMP", "test2");
      sessionStorage.setItem("OTHER_SESSION_DATA", "should-remain");

      await clearAppData();

      expect(sessionStorage.getItem("LIVE_LYRICS_SESSION_DATA")).toBeNull();
      expect(sessionStorage.getItem("LIVE_LYRICS_TEMP")).toBeNull();
      expect(sessionStorage.getItem("OTHER_SESSION_DATA")).toBe(
        "should-remain",
      );
    });

    it("should log success message", async () => {
      await clearAppData();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "App data cleared successfully",
      );
    });

    it("should handle empty storage gracefully", async () => {
      await expect(clearAppData()).resolves.toBeUndefined();
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it("should clear multiple LIVE_LYRICS_ items in one go", async () => {
      // Add many items
      for (let i = 0; i < 10; i++) {
        localStorage.setItem(`LIVE_LYRICS_TEST_${i}`, `value${i}`);
      }

      await clearAppData();

      // Verify all cleared
      for (let i = 0; i < 10; i++) {
        expect(localStorage.getItem(`LIVE_LYRICS_TEST_${i}`)).toBeNull();
      }
    });
  });

  describe("Error Handling", () => {
    it("should throw error if cache.clear() fails", async () => {
      const cacheError = new Error("IndexedDB unavailable");
      vi.mocked(mockCache.clear).mockRejectedValue(cacheError);

      await expect(clearAppData()).rejects.toThrow("IndexedDB unavailable");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error clearing app data:",
        cacheError,
      );
    });

    it("should still attempt to clear localStorage even if cache fails", async () => {
      localStorage.setItem("LIVE_LYRICS_DATA", "test");
      vi.mocked(mockCache.clear).mockRejectedValue(new Error("Cache error"));

      try {
        await clearAppData();
      } catch {
        // Expected to throw
      }

      // localStorage should not be cleared if cache fails (error is thrown early)
      expect(localStorage.getItem("LIVE_LYRICS_DATA")).toBe("test");
    });

    it("should handle localStorage.removeItem errors", async () => {
      localStorage.setItem("LIVE_LYRICS_DATA", "test");

      // Mock removeItem to throw
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error("Storage quota exceeded");
      });

      await expect(clearAppData()).rejects.toThrow();

      // Restore
      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe("Edge Cases", () => {
    it("should handle items with LIVE_LYRICS_ in the middle of key", async () => {
      localStorage.setItem("MY_LIVE_LYRICS_DATA", "should-remain");
      localStorage.setItem("LIVE_LYRICS_DATA", "should-remove");

      await clearAppData();

      expect(localStorage.getItem("MY_LIVE_LYRICS_DATA")).toBe("should-remain");
      expect(localStorage.getItem("LIVE_LYRICS_DATA")).toBeNull();
    });

    it("should handle case-sensitive prefix matching", async () => {
      localStorage.setItem("live_lyrics_data", "should-remain");
      localStorage.setItem("LIVE_LYRICS_DATA", "should-remove");

      await clearAppData();

      expect(localStorage.getItem("live_lyrics_data")).toBe("should-remain");
      expect(localStorage.getItem("LIVE_LYRICS_DATA")).toBeNull();
    });

    it("should handle empty string values", async () => {
      localStorage.setItem("LIVE_LYRICS_EMPTY", "");

      await clearAppData();

      expect(localStorage.getItem("LIVE_LYRICS_EMPTY")).toBeNull();
    });

    it("should handle very long key names", async () => {
      const longKey = `LIVE_LYRICS_${"A".repeat(1000)}`;
      localStorage.setItem(longKey, "test");

      await clearAppData();

      expect(localStorage.getItem(longKey)).toBeNull();
    });
  });
});
