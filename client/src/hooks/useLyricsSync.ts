import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  playerStateAtom,
  lyricsContentAtom,
  lyricsLoadingAtom,
  currentLyricsProviderAtom,
} from "@/atoms/playerAtoms";
import {
  enabledLyricsProvidersAtom,
  appProviderSettingsAtom,
} from "@/atoms/appState";
import { loadLyricsProvider } from "@/config/providers";
import { normalizeLyricsToEnhanced } from "@/utils/lyricsNormalizer";
import { POLLING_INTERVALS } from "@/constants/timing";

/**
 * Hook that fetches lyrics using enabled providers sequentially with individual loading states
 * Uses TanStack Query for caching with 1-year cache duration
 * Components should use lyricsContentAtom, lyricsLoadingAtom, and currentLyricsProviderAtom for state
 */
export const useLyricsSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const lyricsSettings = useAtomValue(appProviderSettingsAtom).lyrics;
  const setLyricsContent = useSetAtom(lyricsContentAtom);
  const setLyricsLoading = useSetAtom(lyricsLoadingAtom);
  const setCurrentLyricsProvider = useSetAtom(currentLyricsProviderAtom);

  // Get enabled providers in priority order
  const enabledProviderIds = enabledLyricsProviders.map(
    (entry) => entry.config.id,
  );

  // Serialize lyrics provider settings for cache key
  // This ensures cache invalidates when user changes provider settings (enable/disable/priority/config)
  const lyricsSettingsKey = JSON.stringify(
    Object.fromEntries(lyricsSettings.entries()),
  );

  const queryEnabled = !!(
    playerState.name &&
    playerState.artist &&
    enabledProviderIds.length > 0
  );

  // Use React Query to fetch lyrics using priority-based fallback system
  const {
    data: lyricsResult,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "lyrics", // Consistent prefix for all lyrics queries
      lyricsSettingsKey, // Invalidates when user changes lyrics provider settings
      enabledProviderIds, // Keep for readability
      playerState.name,
      playerState.artist,
      playerState.album,
    ],
    queryFn: async (): Promise<{
      lyrics: string;
      providerId: string | null;
    }> => {
      if (
        !playerState.name ||
        !playerState.artist ||
        enabledProviderIds.length === 0
      ) {
        return { lyrics: "", providerId: null };
      }

      // Try each provider sequentially
      for (const providerId of enabledProviderIds) {
        try {
          setCurrentLyricsProvider(providerId);
          const provider = await loadLyricsProvider(providerId);

          // Check if provider is available
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            console.warn(
              `Lyrics provider "${providerId}" is not available, trying next...`,
            );
            continue;
          }

          // Check if provider supports this song
          const supportsLyrics = await provider.supportsLyrics(playerState);
          if (!supportsLyrics) {
            console.log(
              `Lyrics provider "${providerId}" doesn't support this song, trying next...`,
            );
            continue;
          }

          // Start fetching and poll until complete
          const lyricsPromise = provider.getLyrics(playerState);

          // Wait for fetching to complete
          while (await provider.isFetching()) {
            // Small delay to avoid tight polling loop
            await new Promise((resolve) =>
              setTimeout(resolve, POLLING_INTERVALS.LYRICS_FETCH_POLL),
            );
          }

          const lyrics = await lyricsPromise;
          if (lyrics && lyrics.trim()) {
            console.log(
              `Successfully got lyrics from provider "${providerId}"`,
            );
            return { lyrics, providerId };
          }

          console.log(
            `Provider "${providerId}" returned empty lyrics, trying next...`,
          );
        } catch (error) {
          console.error(
            `Failed to get lyrics from provider "${providerId}":`,
            error,
          );
          // Continue to next provider
        }
      }

      console.warn(
        "All enabled lyrics providers failed or returned empty results",
      );
      return { lyrics: "", providerId: null };
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - lyrics rarely change
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result and loading state to atoms
  useEffect(() => {
    // Update loading state based on React Query state
    setLyricsLoading(isLoading || isFetching);
  }, [isLoading, isFetching, setLyricsLoading]);

  useEffect(() => {
    // If no providers are enabled, set empty string and clear loading
    if (enabledProviderIds.length === 0) {
      setLyricsContent("");
      setLyricsLoading(false);
      setCurrentLyricsProvider(null);
      return;
    }

    // Use explicit loading state - only update lyrics when not loading
    if (!isLoading && !isFetching) {
      // Normalize lyrics to enhanced format before storing
      const normalizedLyrics = normalizeLyricsToEnhanced(
        lyricsResult?.lyrics || "",
      );
      setLyricsContent(normalizedLyrics);
      setCurrentLyricsProvider(null);
    }
  }, [
    lyricsResult,
    setLyricsContent,
    enabledProviderIds.length,
    isLoading,
    isFetching,
    setLyricsLoading,
    setCurrentLyricsProvider,
  ]);
};
