import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { songInfoAtom, rawLrcContentAtom } from "@/atoms/playerAtoms";
import { currentLyricsProviderAtom } from "@/atoms/settingsAtoms";

/**
 * Hook that fetches lyrics using the current lyrics provider and syncs to atom
 * Components should use rawLrcContentAtom instead of returned values
 */
export const useLyricsSync = () => {
  const songInfo = useAtomValue(songInfoAtom);
  const lyricsProvider = useAtomValue(currentLyricsProviderAtom);
  const setRawLrcContent = useSetAtom(rawLrcContentAtom);

  // Use React Query to fetch lyrics
  const { data: lrcContent } = useQuery({
    queryKey: [
      "lyrics",
      lyricsProvider?.getId(),
      songInfo.name,
      songInfo.artist,
      songInfo.album,
    ],
    queryFn: async (): Promise<string> => {
      if (!songInfo.name || !songInfo.artist || !lyricsProvider) {
        return "";
      }

      const lyrics = await lyricsProvider.getLyrics(songInfo);
      return lyrics || "";
    },
    enabled: !!(songInfo.name && songInfo.artist && lyricsProvider),
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - lyrics rarely change
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result to atom
  useEffect(() => {
    setRawLrcContent(lrcContent || null);
  }, [lrcContent, setRawLrcContent]);
};
