import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { songInfoAtom, artworkUrlsAtom } from "@/atoms/playerAtoms";
import { artworkProviderIdAtom } from "@/atoms/settingsAtoms";
import { loadArtworkProvider } from "@/config/providers";

/**
 * Hook that fetches artwork using the current artwork provider and syncs to atom
 * Components should use artworkUrlsAtom instead of returned values
 */
export const useArtworkSync = () => {
  const songInfo = useAtomValue(songInfoAtom);
  const artworkProviderId = useAtomValue(artworkProviderIdAtom);
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);

  // Use React Query to fetch artwork directly from provider config
  const { data: artworkUrls } = useQuery({
    queryKey: [
      "artwork",
      artworkProviderId,
      songInfo.name,
      songInfo.artist,
      songInfo.album,
    ],
    queryFn: async (): Promise<string[]> => {
      if (!songInfo.name || !songInfo.artist || !artworkProviderId) {
        return [];
      }

      try {
        const provider = await loadArtworkProvider(artworkProviderId);
        const artwork = await provider.getArtwork(songInfo);
        return artwork || [];
      } catch (error) {
        console.error(
          `Failed to load artwork provider "${artworkProviderId}":`,
          error,
        );
        return [];
      }
    },
    enabled: !!(songInfo.name && songInfo.artist && artworkProviderId),
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - artwork rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });

  // Sync query result to atom
  useEffect(() => {
    setArtworkUrls(artworkUrls || []);
  }, [artworkUrls, setArtworkUrls]);
};
