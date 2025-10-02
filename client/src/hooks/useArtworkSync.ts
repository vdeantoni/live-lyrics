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

  console.log("[useArtworkSync] Cache key components:", {
    artworkSettingsKey,
    enabledProviderIds,
    song: {
      name: playerState.name,
      artist: playerState.artist,
      album: playerState.album,
    },
  });

  // Use React Query to fetch artwork using priority-based fallback system
  const {
    data: artworkUrls,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "artwork",
      artworkSettingsKey, // Invalidates when user changes artwork provider settings
      enabledProviderIds, // Keep for readability
      playerState.name,
      playerState.artist,
      playerState.album,
    ],
    queryFn: async (): Promise<string[]> => {
      console.log(
        `[useArtworkSync] Starting artwork fetch for "${playerState.name}" by "${playerState.artist}"`,
      );
      console.log(`[useArtworkSync] Enabled providers:`, enabledProviderIds);

      if (
        !playerState.name ||
        !playerState.artist ||
        enabledProviderIds.length === 0
      ) {
        console.log(
          "[useArtworkSync] Skipping fetch - missing song data or no providers",
        );
        return [];
      }

      // Try each provider in priority order until one succeeds
      for (const providerId of enabledProviderIds) {
        try {
          console.log(`[useArtworkSync] Trying provider "${providerId}"...`);
          const provider = await loadArtworkProvider(providerId);

          // Check if provider is available
          const isAvailable = await provider.isAvailable();
          console.log(
            `[useArtworkSync] Provider "${providerId}" available:`,
            isAvailable,
          );
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
          console.log(
            `[useArtworkSync] Calling getArtwork() on "${providerId}"...`,
          );
          const artwork = await provider.getArtwork(playerState);
          console.log(
            `[useArtworkSync] Provider "${providerId}" returned:`,
            artwork,
          );

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
    enabled: !!(
      playerState.name &&
      playerState.artist &&
      enabledProviderIds.length > 0
    ),
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
