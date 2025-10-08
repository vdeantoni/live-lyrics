import type { Song } from "@/types";
import { loadArtworkProvider } from "@/config/providers";
import { getCache } from "@/core/services/cache";
import type { IProviderCache } from "@/core/services/cache";
import { emit } from "@/core/events/bus";
import { logService } from "@/core/services/LogService";

/**
 * Artwork service that handles fetching artwork from providers with caching
 * Supports multi-variant storage (multiple URLs per song)
 */
export class ArtworkService {
  private cache: IProviderCache;
  private abortController: AbortController | null = null;

  constructor(cache?: IProviderCache) {
    this.cache = cache || getCache();
  }

  /**
   * Fetch artwork for a song from enabled providers
   * Tries each provider sequentially until one returns valid artwork URLs
   *
   * @param song - Song metadata
   * @param providerIds - Array of provider IDs to try (in priority order)
   */
  async fetchArtwork(song: Song, providerIds: string[]): Promise<void> {
    // Cancel previous fetch
    if (this.abortController) {
      this.abortController.abort();
    }

    // Check if song info is available
    if (!song.name || !song.artist) {
      emit({ type: "artwork.loaded", payload: { urls: [] } });
      return;
    }

    // Check if no providers are enabled
    if (providerIds.length === 0) {
      emit({ type: "artwork.loaded", payload: { urls: [] } });
      return;
    }

    this.abortController = new AbortController();
    emit({ type: "artwork.fetch", payload: { song } });

    try {
      // Try each provider sequentially
      for (const providerId of providerIds) {
        if (this.abortController.signal.aborted) break;

        try {
          // Check cache first (get all variants)
          const cached = await this.cache.getAll(song, providerId, "artwork");
          if (cached.length > 0) {
            logService.debug(
              "Cache hit - returning cached URLs",
              "ArtworkService",
              { providerId, count: cached.length },
            );
            const urls = cached.map((entry) => entry.data);
            emit({ type: "artwork.loaded", payload: { urls } });
            return;
          }

          logService.debug(
            "Cache miss - fetching from provider",
            "ArtworkService",
            { providerId },
          );

          // Cache miss - fetch from provider
          const provider = await loadArtworkProvider(providerId);

          // Check if provider is available
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            logService.warn(
              "Provider not available, trying next",
              "ArtworkService",
              { providerId },
            );
            continue;
          }

          // Fetch artwork URLs
          const urls = await provider.getArtwork(
            song,
            this.abortController.signal,
          );

          if (urls && urls.length > 0) {
            logService.debug(
              "Successfully fetched artwork URLs",
              "ArtworkService",
              { providerId, count: urls.length },
            );

            // Cache each URL as a separate variant
            await this.cache.setMany(
              song,
              providerId,
              "artwork",
              urls.map((url, index) => ({
                data: url,
                variant: `url_${index}`,
                metadata: { index },
              })),
            );

            emit({ type: "artwork.loaded", payload: { urls } });
            return;
          }

          logService.debug(
            "Provider returned no artwork URLs, trying next",
            "ArtworkService",
            { providerId },
          );
        } catch (error) {
          if (this.abortController.signal.aborted) break;
          logService.error(
            "Failed to get artwork from provider",
            "ArtworkService",
            { providerId, error },
          );
          // Continue to next provider
        }
      }

      // All providers failed
      logService.warn(
        "All enabled providers failed or returned empty results",
        "ArtworkService",
      );
      emit({ type: "artwork.loaded", payload: { urls: [] } });
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        logService.error("Error fetching artwork", "ArtworkService", { error });
        emit({ type: "artwork.error", payload: { error: error as Error } });
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
export const artworkService = new ArtworkService();
