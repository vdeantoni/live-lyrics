import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { syncFromSourceAtom } from "@/atoms/playerAtoms";
import {
  currentMusicModeAtom,
  currentLyricsProviderAtom,
  currentArtworkProviderAtom,
} from "@/atoms/settingsAtoms";
import { useEffect } from "react";
import type { Song } from "@/lib/api";

/**
 * Hook that syncs player state with data from the current music mode
 * Only updates atoms when user is not actively interacting with controls
 */
export const useSongSync = () => {
  const musicMode = useAtomValue(currentMusicModeAtom);
  const syncFromSource = useSetAtom(syncFromSourceAtom);

  // Use React Query to fetch song data from the current music mode
  const { data: songData } = useQuery({
    queryKey: ["song", musicMode?.getId()],
    queryFn: async () => {
      if (!musicMode) throw new Error("No music mode available");
      return await musicMode.getSong();
    },
    enabled: !!musicMode,
    refetchInterval: 300, // Keep the frequent polling for real-time sync
    staleTime: 0, // Always consider stale - refetch immediately
    gcTime: 0, // Don't cache in memory at all
  });

  useEffect(() => {
    if (songData) {
      syncFromSource(songData);
    }
  }, [songData, syncFromSource]);

  // Return the song data and mode info for components that might need it
  return {
    songData,
    musicMode,
  };
};

/**
 * Hook that fetches lyrics using the current lyrics provider
 */
export const useLyrics = (song?: Song) => {
  const lyricsProvider = useAtomValue(currentLyricsProviderAtom);

  return useQuery({
    queryKey: [
      "lyrics",
      lyricsProvider?.getId(),
      song?.name,
      song?.artist,
      song?.album,
    ],
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
 * Hook that fetches artwork using the current artwork provider
 */
export const useArtwork = (song?: Song) => {
  const artworkProvider = useAtomValue(currentArtworkProviderAtom);

  return useQuery({
    queryKey: [
      "artwork",
      artworkProvider?.getId(),
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
