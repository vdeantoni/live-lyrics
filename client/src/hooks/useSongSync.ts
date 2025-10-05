import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { syncFromSourceAtom } from "@/atoms/playerAtoms";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { POLLING_INTERVALS } from "@/constants/timing";
import type { RemotePlayer } from "@/services/remotePlayer";
import type { Song } from "@/types";

/**
 * Hook that syncs player state with data from the current player
 * For WebSocket players, subscribes to real-time updates
 * For other players, falls back to polling
 * Components should use individual atoms instead of returned values
 */
export const useSongSync = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const syncFromSource = useSetAtom(syncFromSourceAtom);

  const playerId = selectedPlayer?.config.id;
  const isWebSocket = playerId === "remote";

  // WebSocket subscription effect
  useEffect(() => {
    if (!isWebSocket || !playerId) return;

    let unsubscribe: (() => void) | null = null;

    const setupWebSocketSubscription = async () => {
      try {
        const player = (await loadPlayer(playerId)) as RemotePlayer;

        // Subscribe to song updates from WebSocket
        unsubscribe = player.onSongUpdate((songData: Song) => {
          syncFromSource(songData);
        });
      } catch (error) {
        console.error(
          `[useSongSync] Failed to setup WebSocket subscription:`,
          error,
        );
      }
    };

    setupWebSocketSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [playerId, isWebSocket, syncFromSource]);

  // Fallback polling for non-WebSocket players (e.g., LocalPlayer)
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
    enabled: !!playerId && !isWebSocket, // Only enable polling for non-WebSocket players
    refetchInterval: POLLING_INTERVALS.SONG_SYNC,
    staleTime: 0,
    gcTime: 0,
  });

  // Sync query result to atom (for fallback polling)
  useEffect(() => {
    if (songData && !isWebSocket) {
      syncFromSource(songData);
    }
  }, [songData, syncFromSource, isWebSocket]);
};
