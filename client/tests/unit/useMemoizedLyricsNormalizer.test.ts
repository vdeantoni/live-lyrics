import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useMemoizedLyricsNormalizer,
  clearNormalizationCache,
  getNormalizationCacheSize,
} from "@/hooks/useMemoizedLyricsNormalizer";
import * as lyricsNormalizerModule from "@/utils/lyricsNormalizer";

// Mock the actual normalization function to track calls
vi.mock("@/utils/lyricsNormalizer", async () => {
  const actual = await vi.importActual<
    typeof import("@/utils/lyricsNormalizer")
  >("@/utils/lyricsNormalizer");
  return {
    ...actual,
    normalizeLyricsToEnhanced: vi.fn((lyrics: string) => {
      return `NORMALIZED:${lyrics}`;
    }),
  };
});

describe("useMemoizedLyricsNormalizer", () => {
  beforeEach(() => {
    clearNormalizationCache();
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should normalize lyrics on first call", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const lyrics = "[00:10.00]Test lyrics";
      const normalized = normalize(lyrics);

      expect(normalized).toBe("NORMALIZED:[00:10.00]Test lyrics");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(1);
    });

    it("should return cached result on second call with same lyrics", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const lyrics = "[00:10.00]Test lyrics";

      // First call
      const normalized1 = normalize(lyrics);
      expect(normalized1).toBe("NORMALIZED:[00:10.00]Test lyrics");

      // Second call - should use cache
      const normalized2 = normalize(lyrics);
      expect(normalized2).toBe("NORMALIZED:[00:10.00]Test lyrics");

      // Should only call normalization once
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle empty lyrics", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      expect(normalize("")).toBe("");
      expect(normalize("   ")).toBe("");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).not.toHaveBeenCalled();
    });

    it("should include duration in cache key", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const lyrics = "[00:10.00]Test lyrics";

      // Same lyrics but different duration should trigger normalization
      normalize(lyrics, 180);
      normalize(lyrics, 200);

      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe("Cache Behavior", () => {
    it("should cache different lyrics separately", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const lyrics1 = "[00:10.00]First song";
      const lyrics2 = "[00:20.00]Second song";

      normalize(lyrics1);
      normalize(lyrics2);
      normalize(lyrics1); // Retrieve from cache
      normalize(lyrics2); // Retrieve from cache

      // Should normalize each unique lyrics once
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(2);
    });

    it("should track cache size correctly", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      expect(getNormalizationCacheSize()).toBe(0);

      normalize("[00:10.00]Song 1");
      expect(getNormalizationCacheSize()).toBe(1);

      normalize("[00:20.00]Song 2");
      expect(getNormalizationCacheSize()).toBe(2);

      // Same song doesn't increase size
      normalize("[00:10.00]Song 1");
      expect(getNormalizationCacheSize()).toBe(2);
    });

    it("should clear cache when clearNormalizationCache is called", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      normalize("[00:10.00]Song 1");
      normalize("[00:20.00]Song 2");
      expect(getNormalizationCacheSize()).toBe(2);

      clearNormalizationCache();
      expect(getNormalizationCacheSize()).toBe(0);

      // Should normalize again after clear
      normalize("[00:10.00]Song 1");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(3);
    });
  });

  describe("LRU Eviction", () => {
    it("should evict oldest entry when cache reaches max size", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      // Fill cache to max (50 entries)
      for (let i = 0; i < 50; i++) {
        normalize(`[00:${i.toString().padStart(2, "0")}.00]Song ${i}`);
      }

      expect(getNormalizationCacheSize()).toBe(50);
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(50);

      // Add one more - should evict oldest
      normalize("[00:99.00]Song 99");

      expect(getNormalizationCacheSize()).toBe(50); // Still max size
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(51);

      // First song should have been evicted - normalizing it again should call the function
      normalize("[00:00.00]Song 0");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(52);
    });

    it("should move accessed entry to end (LRU update)", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      // Fill cache with 3 entries
      normalize("[00:01.00]Song 1");
      normalize("[00:02.00]Song 2");
      normalize("[00:03.00]Song 3");

      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(3);

      // Access Song 1 again - should move it to end
      normalize("[00:01.00]Song 1");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(3); // No new call

      // Fill up to max size (47 more entries)
      for (let i = 4; i <= 50; i++) {
        normalize(`[00:${i.toString().padStart(2, "0")}.00]Song ${i}`);
      }

      // Add one more - should evict Song 2 (oldest), not Song 1 (accessed recently)
      normalize("[00:99.00]Song 99");

      // Song 1 should still be cached
      normalize("[00:01.00]Song 1");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(51); // No new call for Song 1

      // Song 2 should have been evicted
      normalize("[00:02.00]Song 2");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(52); // New call for Song 2
    });
  });

  describe("Cache Key Generation", () => {
    it("should use content hash, length, and duration for cache key", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      // Same first 100 chars but different lengths should be different entries
      const lyrics1 = "[00:10.00]Test lyrics";
      const lyrics2 = "[00:10.00]Test lyrics and more content here";

      normalize(lyrics1);
      normalize(lyrics2);

      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(2);
    });

    it("should treat lyrics with same start but different endings as different", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const base = "[00:10.00]".repeat(20); // Same first 100 chars
      const lyrics1 = base + "Ending A with more content here";
      const lyrics2 = base + "Ending B";

      normalize(lyrics1);
      normalize(lyrics2);

      // Should be treated as different because length differs
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe("Hook Stability", () => {
    it("should return stable normalizer function across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useMemoizedLyricsNormalizer(),
      );

      const normalize1 = result.current;
      rerender();
      const normalize2 = result.current;

      // Should be the same function reference
      expect(normalize1).toBe(normalize2);
    });

    it("should maintain cache across hook re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useMemoizedLyricsNormalizer(),
      );

      const normalize1 = result.current;
      normalize1("[00:10.00]Test lyrics");

      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(1);

      rerender();
      const normalize2 = result.current;

      // Should use cached result even with new hook instance
      normalize2("[00:10.00]Test lyrics");
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long lyrics content", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const longLyrics = "[00:10.00]Test ".repeat(10000);
      const normalized = normalize(longLyrics);

      expect(normalized).toBe(`NORMALIZED:${longLyrics}`);
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(1);

      // Should cache even long content
      normalize(longLyrics);
      expect(
        lyricsNormalizerModule.normalizeLyricsToEnhanced,
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle special characters in lyrics", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const specialLyrics = "[00:10.00]Test 你好 こんにちは 🎵 ♪";
      const normalized = normalize(specialLyrics);

      expect(normalized).toBe(`NORMALIZED:${specialLyrics}`);
    });

    it("should handle lyrics with only whitespace after first 100 chars", () => {
      const { result } = renderHook(() => useMemoizedLyricsNormalizer());
      const normalize = result.current;

      const lyrics = "[00:10.00]Start" + " ".repeat(200);
      const normalized = normalize(lyrics);

      expect(normalized).toBe(`NORMALIZED:${lyrics}`);
    });
  });
});
