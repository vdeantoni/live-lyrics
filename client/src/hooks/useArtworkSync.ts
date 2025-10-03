import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  playerStateAtom,
  artworkUrlsAtom,
  artworkLoadingAtom,
} from "@/atoms/playerAtoms";
import {
  enabledArtworkProvidersAtom,
  appProviderSettingsAtom,
} from "@/atoms/appState";
import { loadArtworkProvider } from "@/config/providers";

/**
 * Hook that fetches artwork using enabled providers in priority order with fallback
 * Uses explicit loading state management via artworkLoadingAtom
 * Components should use artworkUrlsAtom and artworkLoadingAtom for state
 */
export const useArtworkSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledArtworkProviders = useAtomValue(enabledArtworkProvidersAtom);
  const artworkSettings = useAtomValue(appProviderSettingsAtom).artwork;
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);
  const setArtworkLoading = useSetAtom(artworkLoadingAtom);

  // Get enabled providers in priority order
  const enabledProviderIds = enabledArtworkProviders.map(
    (entry) => entry.config.id,
  );

  // Serialize artwork provider settings for cache key
  // This ensures cache invalidates when user changes provider settings (enable/disable/priority/config)
  const artworkSettingsKey = JSON.stringify(
    Object.fromEntries(artworkSettings.entries()),
  );

  const queryEnabled = !!(
    playerState.name &&
    playerState.artist &&
    enabledProviderIds.length > 0
  );

  // Use React Query to fetch artwork using priority-based fallback system
  const {
    data: artworkUrls,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "artwork", // Consistent prefix for all artwork queries
      artworkSettingsKey, // Invalidates when user changes artwork provider settings
      enabledProviderIds, // Keep for readability
      playerState.name,
      playerState.artist,
      playerState.album,
    ],
    queryFn: async (): Promise<string[]> => {
      if (
        !playerState.name ||
        !playerState.artist ||
        enabledProviderIds.length === 0
      ) {
        return [];
      }

      // Try each provider in priority order until one succeeds
      for (const providerId of enabledProviderIds) {
        try {
          const provider = await loadArtworkProvider(providerId);

          // Check if provider is available
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) {
            console.warn(
              `Artwork provider "${providerId}" is not available, trying next...`,
            );
            continue;
          }

          // Check if provider is currently fetching
          const providerIsFetching = await provider.isFetching();
          if (providerIsFetching) {
            console.log(
              `Artwork provider "${providerId}" is currently fetching, waiting...`,
            );
            // For now, skip to next provider. In the future, we could implement waiting logic
            continue;
          }

          // Try to get artwork
          const artwork = await provider.getArtwork(playerState);

          if (artwork && artwork.length > 0) {
            console.log(
              `Successfully got artwork from provider "${providerId}"`,
            );
            return artwork;
          }

          console.log(
            `Provider "${providerId}" returned no artwork, trying next...`,
          );
        } catch (error) {
          console.error(
            `Failed to get artwork from provider "${providerId}":`,
            error,
          );
          // Continue to next provider
        }
      }

      console.warn(
        "All enabled artwork providers failed or returned empty results",
      );
      return [];
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - artwork rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result and loading state to atoms
  useEffect(() => {
    // Update loading state based on React Query state
    setArtworkLoading(isLoading || isFetching);
  }, [isLoading, isFetching, setArtworkLoading]);

  useEffect(() => {
    // If no providers are enabled, set empty array and clear loading
    if (enabledProviderIds.length === 0) {
      setArtworkUrls([]);
      setArtworkLoading(false);
      return;
    }

    // Use explicit loading state - only update URLs when not loading
    if (!isLoading && !isFetching) {
      setArtworkUrls(artworkUrls || []);
    }
  }, [
    artworkUrls,
    setArtworkUrls,
    enabledProviderIds.length,
    isLoading,
    isFetching,
    setArtworkLoading,
  ]);
};
