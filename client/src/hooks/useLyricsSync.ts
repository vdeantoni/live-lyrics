import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { playerStateAtom, rawLrcContentAtom } from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/settingsAtoms";
import { loadLyricsProvider } from "@/config/providers";

/**
 * Hook that fetches lyrics using enabled providers in priority order with fallback
 * Components should use rawLrcContentAtom instead of returned values
 */
export const useLyricsSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setRawLrcContent = useSetAtom(rawLrcContentAtom);

  // Get enabled providers in priority order
  const enabledProviderIds = enabledLyricsProviders.map(
    (entry) => entry.config.id,
  );

  // Use React Query to fetch lyrics using priority-based fallback system
  const { data: lrcContent } = useQuery({
    queryKey: [
      "lyrics",
      enabledProviderIds,
      playerState.name,
      playerState.artist,
      playerState.album,
    ],
    queryFn: async (): Promise<string> => {
      if (
        !playerState.name ||
        !playerState.artist ||
        enabledProviderIds.length === 0
      ) {
        return "";
      }

      // Try each provider in priority order until one succeeds
      for (const providerId of enabledProviderIds) {
        try {
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

          // Try to get lyrics
          const lyrics = await provider.getLyrics(playerState);
          if (lyrics && lyrics.trim()) {
            console.log(
              `Successfully got lyrics from provider "${providerId}"`,
            );
            return lyrics;
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
      return "";
    },
    enabled: !!(
      playerState.name &&
      playerState.artist &&
      enabledProviderIds.length > 0
    ),
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - lyrics rarely change
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result to atom
  useEffect(() => {
    setRawLrcContent(lrcContent || null);
  }, [lrcContent, setRawLrcContent]);
};
