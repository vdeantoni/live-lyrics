import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { songInfoAtom, rawLrcContentAtom } from "@/atoms/playerAtoms";
import { lyricsProviderIdAtom } from "@/atoms/settingsAtoms";
import { loadLyricsProvider } from "@/config/providers";

/**
 * Hook that fetches lyrics using the current lyrics provider and syncs to atom
 * Components should use rawLrcContentAtom instead of returned values
 */
export const useLyricsSync = () => {
  const songInfo = useAtomValue(songInfoAtom);
  const lyricsProviderId = useAtomValue(lyricsProviderIdAtom);
  const setRawLrcContent = useSetAtom(rawLrcContentAtom);

  // Use React Query to fetch lyrics using centralized provider config
  const { data: lrcContent } = useQuery({
    queryKey: [
      "lyrics",
      lyricsProviderId,
      songInfo.name,
      songInfo.artist,
      songInfo.album,
    ],
    queryFn: async (): Promise<string> => {
      if (!songInfo.name || !songInfo.artist || !lyricsProviderId) {
        return "";
      }

      try {
        const provider = await loadLyricsProvider(lyricsProviderId);
        const lyrics = await provider.getLyrics(songInfo);
        return lyrics || "";
      } catch (error) {
        console.error(
          `Failed to load lyrics provider "${lyricsProviderId}":`,
          error,
        );
        return "";
      }
    },
    enabled: !!(songInfo.name && songInfo.artist && lyricsProviderId),
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - lyrics rarely change
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result to atom
  useEffect(() => {
    setRawLrcContent(lrcContent || null);
  }, [lrcContent, setRawLrcContent]);
};
