import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { syncFromSourceAtom } from "@/atoms/playerAtoms";
import { playerIdAtom } from "@/atoms/settingsAtoms";
import { loadPlayer } from "@/config/providers";

/**
 * Hook that syncs player state with data from the current player
 * Only updates atoms when user is not actively interacting with controls
 * Components should use individual atoms instead of returned values
 */
export const useSongSync = () => {
  const playerId = useAtomValue(playerIdAtom);
  const syncFromSource = useSetAtom(syncFromSourceAtom);

  // Use React Query to fetch song data from the current player
  const { data: songData } = useQuery({
    queryKey: ["song", playerId],
    queryFn: async () => {
      if (!playerId) throw new Error("No player selected");

      try {
        const player = await loadPlayer(playerId);
        const songData = await player.getSong();
        return songData;
      } catch (error) {
        console.error(`Failed to load player "${playerId}":`, error);
        throw error;
      }
    },
    enabled: !!playerId,
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
