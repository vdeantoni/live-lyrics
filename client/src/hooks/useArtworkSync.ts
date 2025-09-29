import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { songInfoAtom, artworkUrlsAtom } from "@/atoms/playerAtoms";
import {
  artworkProviderIdsAtom,
  enabledArtworkProvidersAtom,
} from "@/atoms/settingsAtoms";
import { loadArtworkProvider } from "@/config/providers";

/**
 * Hook that fetches artwork using enabled providers in priority order with fallback
 * Components should use artworkUrlsAtom instead of returned values
 */
export const useArtworkSync = () => {
  const songInfo = useAtomValue(songInfoAtom);
  const artworkProviderIds = useAtomValue(artworkProviderIdsAtom);
  const enabledArtworkProviders = useAtomValue(enabledArtworkProvidersAtom);
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);

  // Get enabled providers in priority order
  const enabledProviderIds = (artworkProviderIds || []).filter((id) =>
    enabledArtworkProviders?.has(id),
  );

  // Use React Query to fetch artwork using priority-based fallback system
  const { data: artworkUrls } = useQuery({
    queryKey: [
      "artwork",
      enabledProviderIds,
      songInfo.name,
      songInfo.artist,
      songInfo.album,
    ],
    queryFn: async (): Promise<string[]> => {
      if (
        !songInfo.name ||
        !songInfo.artist ||
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

          // Try to get artwork
          const artwork = await provider.getArtwork(songInfo);
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
      songInfo.name &&
      songInfo.artist &&
      enabledProviderIds.length > 0
    ),
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - artwork rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result to atom
  useEffect(() => {
    setArtworkUrls(artworkUrls || []);
  }, [artworkUrls, setArtworkUrls]);
};
