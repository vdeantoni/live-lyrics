import { useCallback } from "react";
import { normalizeLyricsToEnhanced } from "@/utils/lyricsNormalizer";

/**
 * LRU cache for normalized lyrics
 * Key format: "contentHash:duration:length"
 * Stores last 50 normalized results to avoid expensive re-computation
 */
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

/**
 * Generate a cache key from lyrics content and duration
 * Uses first 100 chars + length + duration for balance between uniqueness and performance
 */
function generateCacheKey(lyrics: string, duration?: number): string {
  // Use first 100 chars (enough to distinguish different songs) + length + duration
  const contentHash = lyrics.slice(0, 100);
  const length = lyrics.length;
  return `${contentHash}:${duration ?? ""}:${length}`;
}

/**
 * Hook that provides memoized lyrics normalization
 * Implements LRU cache to avoid expensive re-computation of the same lyrics
 *
 * @returns Memoized normalizer function
 */
export function useMemoizedLyricsNormalizer() {
  return useCallback((lyrics: string, duration?: number): string => {
    if (!lyrics || lyrics.trim() === "") {
      return "";
    }

    const cacheKey = generateCacheKey(lyrics, duration);

    // Cache hit - return cached result
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      // Move to end (LRU)
      cache.delete(cacheKey);
      cache.set(cacheKey, cached);
      return cached;
    }

    // Cache miss - compute and store
    const normalized = normalizeLyricsToEnhanced(lyrics, duration);

    // LRU eviction - remove oldest entry if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    cache.set(cacheKey, normalized);
    return normalized;
  }, []);
}

/**
 * Clear the normalization cache
 * Useful for testing or manual cache invalidation
 */
export function clearNormalizationCache(): void {
  cache.clear();
}

/**
 * Get current cache size
 * Useful for testing and debugging
 */
export function getNormalizationCacheSize(): number {
  return cache.size;
}
