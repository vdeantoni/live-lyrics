import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { syncFromSourceAtom } from "@/atoms/playerAtoms";
import { currentMusicModeAtom } from "@/atoms/settingsAtoms";

/**
 * Hook that syncs player state with data from the current music mode
 * Only updates atoms when user is not actively interacting with controls
 * Components should use individual atoms instead of returned values
 */
export const useSongSync = () => {
  const musicMode = useAtomValue(currentMusicModeAtom);
  const syncFromSource = useSetAtom(syncFromSourceAtom);

  // Use React Query to fetch song data from the current music mode
  const { data: songData } = useQuery({
    queryKey: ["song", musicMode?.getId()],
    queryFn: async () => {
      if (!musicMode) throw new Error("No music mode available");
      const songData = await musicMode.getSong();
      return songData;
    },
    enabled: !!musicMode,
    refetchInterval: 300, // Keep the frequent polling for real-time sync
    staleTime: 0, // Always consider stale - refetch immediately
    gcTime: 0, // Don't cache in memory at all
  });

  // Sync query result to atom
  useEffect(() => {
    if (songData) {
      syncFromSource(songData);
    }
  }, [songData, syncFromSource]);
};
