import type { Song } from "@/types";
import { loadLyricsProvider } from "@/config/providers";
import { getCache } from "@/core/services/cache";
import type { IProviderCache } from "@/core/services/cache";
import { emit } from "@/core/events/bus";
import { logService } from "@/core/services/LogService";

/**
 * Lyrics service that handles fetching lyrics from providers with caching
 * Supports multi-variant storage (synced lyrics, plain lyrics, etc.)
 */
export class LyricsService {
  private cache: IProviderCache;
  private abortController: AbortController | null = null;

  constructor(cache?: IProviderCache) {
    this.cache = cache || getCache();
  }

  /**
   * Fetch lyrics for a song from enabled providers
   * Tries each provider sequentially until one returns valid lyrics
   *
   * @param song - Song metadata
   * @param providerIds - Array of provider IDs to try (in priority order)
   */
  async fetchLyrics(song: Song, providerIds: string[]): Promise<void> {
    // Cancel previous fetch
    if (this.abortController) {
      this.abortController.abort();
    }

    // Check if song info is available
    if (!song.name || !song.artist) {
      emit({ type: "lyrics.loaded", payload: { content: "", providerId: "" } });
      return;
    }

    // Check if no providers are enabled
    if (providerIds.length === 0) {
      emit({ type: "lyrics.loaded", payload: { content: "", providerId: "" } });
      return;
    }

    this.abortController = new AbortController();
    emit({ type: "lyrics.fetch", payload: { song } });

    try {
      // Try each provider sequentially
      for (const providerId of providerIds) {
        if (this.abortController.signal.aborted) break;

        try {
          // Check cache first
          const cached = await this.cache.get(song, providerId, "lyrics");
          if (cached) {
            logService.debug(
              "Cache hit - returning cached lyrics",
              "LyricsService",
              { providerId },
            );
            emit({
              type: "lyrics.loaded",
              payload: { content: cached, providerId },
            });
            return;
          }

          logService.debug(
            "Cache miss - fetching from provider",
            "LyricsService",
            { providerId },
          );

          // Cache miss - fetch from provider
          const provider = await loadLyricsProvider(providerId);

          // Check if provider is available
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            logService.warn(
              "Provider not available, trying next",
              "LyricsService",
              { providerId },
            );
            continue;
          }

          // Check if provider supports this song (optional)
          if (provider.supportsLyrics) {
            const supportsData = await provider.supportsLyrics(song);
            if (!supportsData) {
              logService.debug(
                "Provider doesn't support this song, trying next",
                "LyricsService",
                { providerId },
              );
              continue;
            }
          }

          // Fetch lyrics
          const result = await provider.getLyrics(
            song,
            this.abortController.signal,
          );

          if (result && result.trim().length > 0) {
            logService.debug("Successfully fetched lyrics", "LyricsService", {
              providerId,
            });

            // Cache the result
            await this.cache.set(song, providerId, "lyrics", result);

            emit({
              type: "lyrics.loaded",
              payload: { content: result, providerId },
            });
            return;
          }

          logService.debug(
            "Provider returned empty lyrics, trying next",
            "LyricsService",
            { providerId },
          );
        } catch (error) {
          if (this.abortController.signal.aborted) break;
          logService.error(
            "Failed to get lyrics from provider",
            "LyricsService",
            { providerId, error },
          );
          // Continue to next provider
        }
      }

      // All providers failed
      logService.warn(
        "All enabled providers failed or returned empty results",
        "LyricsService",
      );
      emit({ type: "lyrics.loaded", payload: { content: "", providerId: "" } });
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        logService.error("Error fetching lyrics", "LyricsService", { error });
        emit({ type: "lyrics.error", payload: { error: error as Error } });
      }
    }
  }

  /**
   * Cancel any ongoing fetch operations
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Singleton instance
export const lyricsService = new LyricsService();
