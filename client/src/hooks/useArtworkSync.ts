import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { songInfoAtom, artworkUrlsAtom } from "@/atoms/playerAtoms";
import { currentArtworkProviderAtom } from "@/atoms/settingsAtoms";

/**
 * Hook that fetches artwork using the current artwork provider and syncs to atom
 * Components should use artworkUrlsAtom instead of returned values
 */
export const useArtworkSync = () => {
  const songInfo = useAtomValue(songInfoAtom);
  const artworkProvider = useAtomValue(currentArtworkProviderAtom);
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);

  // Use React Query to fetch artwork
  const { data: artworkUrls } = useQuery({
    queryKey: [
      "artwork",
      artworkProvider?.getId(),
      songInfo.name,
      songInfo.artist,
      songInfo.album,
    ],
    queryFn: async (): Promise<string[]> => {
      if (!songInfo.name || !songInfo.artist || !artworkProvider) {
        return [];
      }

      const artwork = await artworkProvider.getArtwork(songInfo);
      return artwork || [];
    },
    enabled: !!(songInfo.name && songInfo.artist && artworkProvider),
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - artwork rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result to atom
  useEffect(() => {
    setArtworkUrls(artworkUrls || []);
  }, [artworkUrls, setArtworkUrls]);
};
