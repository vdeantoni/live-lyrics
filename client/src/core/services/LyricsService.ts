import type { Song } from "@/types";
import { loadLyricsProvider } from "@/config/providers";
import { getCache } from "@/core/services/cache";
import type { IProviderCache } from "@/core/services/cache";
import { emit } from "@/core/events/bus";

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
            console.log(
              `Cache hit for lyrics provider "${providerId}" - returning cached lyrics`,
            );
            emit({
              type: "lyrics.loaded",
              payload: { content: cached, providerId },
            });
            return;
          }

          console.log(
            `Cache miss for lyrics provider "${providerId}" - fetching from provider`,
          );

          // Cache miss - fetch from provider
          const provider = await loadLyricsProvider(providerId);

          // Check if provider is available
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            console.warn(
              `Lyrics provider "${providerId}" is not available, trying next...`,
            );
            continue;
          }

          // Check if provider supports this song (optional)
          if (provider.supportsLyrics) {
            const supportsData = await provider.supportsLyrics(song);
            if (!supportsData) {
              console.log(
                `Lyrics provider "${providerId}" doesn't support this song, trying next...`,
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
            console.log(
              `Successfully got lyrics from provider "${providerId}"`,
            );

            // Cache the result
            await this.cache.set(song, providerId, "lyrics", result);

            emit({
              type: "lyrics.loaded",
              payload: { content: result, providerId },
            });
            return;
          }

          console.log(
            `Provider "${providerId}" returned empty lyrics, trying next...`,
          );
        } catch (error) {
          if (this.abortController.signal.aborted) break;
          console.error(
            `Failed to get lyrics from provider "${providerId}":`,
            error,
          );
          // Continue to next provider
        }
      }

      // All providers failed
      console.warn(
        "All enabled lyrics providers failed or returned empty results",
      );
      emit({ type: "lyrics.loaded", payload: { content: "", providerId: "" } });
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        console.error("Error fetching lyrics:", error);
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
