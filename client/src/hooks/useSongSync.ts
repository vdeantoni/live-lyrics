import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { syncFromSourceAtom } from "@/atoms/playerAtoms";
import { currentMusicSourceAtom } from "@/atoms/sourceAtoms";
import { useEffect } from "react";
import type { Song } from "@/lib/api";

/**
 * Hook that syncs player state with data from the current music source
 * Only updates atoms when user is not actively interacting with controls
 */
export const useSongSync = () => {
  const source = useAtomValue(currentMusicSourceAtom);
  const syncFromSource = useSetAtom(syncFromSourceAtom);

  // Use React Query to fetch song data from the current source
  const { data: songData } = useQuery({
    queryKey: ["song", source.getId()],
    queryFn: async () => {
      return await source.getSong();
    },
    refetchInterval: 300, // Keep the frequent polling for real-time sync
    staleTime: 0, // Always consider stale - refetch immediately
    gcTime: 0, // Don't cache in memory at all
  });

  useEffect(() => {
    if (songData) {
      syncFromSource(songData);
    }
  }, [songData, syncFromSource]);

  // Return the song data and source info for components that might need it
  return {
    songData,
    source,
  };
};

/**
 * Hook that fetches lyrics using the current music source's lyrics provider
 */
export const useLyricsFromSource = (song?: Song) => {
  const source = useAtomValue(currentMusicSourceAtom);
  const lyricsProvider = source.getLyricsProvider();

  return useQuery({
    queryKey: ["lyrics", source.getId(), song?.name, song?.artist, song?.album],
    queryFn: async (): Promise<string> => {
      if (!song || !lyricsProvider) {
        return "";
      }

      const lyrics = await lyricsProvider.getLyrics(song);
      return lyrics || "";
    },
    enabled: !!song && !!lyricsProvider,
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - lyrics rarely change
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });
};

/**
 * Hook that fetches artwork using the current music source's artwork provider
 */
export const useArtworkFromSource = (song?: Song) => {
  const source = useAtomValue(currentMusicSourceAtom);
  const artworkProvider = source.getArtworkProvider();

  return useQuery({
    queryKey: [
      "artwork",
      source.getId(),
      song?.name,
      song?.artist,
      song?.album,
    ],
    queryFn: async (): Promise<string[]> => {
      if (!song || !artworkProvider) {
        return [];
      }

      const artwork = await artworkProvider.getArtwork(song);
      return artwork || [];
    },
    enabled: !!song && !!artworkProvider,
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - artwork rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });
};
