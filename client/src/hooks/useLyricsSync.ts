import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { songInfoAtom, rawLrcContentAtom } from "@/atoms/playerAtoms";
import {
  lyricsProviderIdsAtom,
  enabledLyricsProvidersAtom,
} from "@/atoms/settingsAtoms";
import { loadLyricsProvider } from "@/config/providers";

/**
 * Hook that fetches lyrics using enabled providers in priority order with fallback
 * Components should use rawLrcContentAtom instead of returned values
 */
export const useLyricsSync = () => {
  const songInfo = useAtomValue(songInfoAtom);
  const lyricsProviderIds = useAtomValue(lyricsProviderIdsAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setRawLrcContent = useSetAtom(rawLrcContentAtom);

  // Get enabled providers in priority order
  const enabledProviderIds = (lyricsProviderIds || []).filter((id) =>
    enabledLyricsProviders?.has(id),
  );

  // Use React Query to fetch lyrics using priority-based fallback system
  const { data: lrcContent } = useQuery({
    queryKey: [
      "lyrics",
      enabledProviderIds,
      songInfo.name,
      songInfo.artist,
      songInfo.album,
    ],
    queryFn: async (): Promise<string> => {
      if (
        !songInfo.name ||
        !songInfo.artist ||
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
          const supportsLyrics = await provider.supportsLyrics(songInfo);
          if (!supportsLyrics) {
            console.log(
              `Lyrics provider "${providerId}" doesn't support this song, trying next...`,
            );
            continue;
          }

          // Try to get lyrics
          const lyrics = await provider.getLyrics(songInfo);
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
      songInfo.name &&
      songInfo.artist &&
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
