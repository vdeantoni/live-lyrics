import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { POLLING_INTERVALS } from "@/constants/timing";
import type { Song } from "@/types";
import { useCallback } from "react";

/**
 * Hook that fetches and manages the player history
 * Polls every 300ms to stay in sync with player state
 * Provides helper methods for history operations
 */
export const usePlayerHistory = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerId = selectedPlayer?.config.id;

  // Fetch history from player
  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["player-history", playerId],
    queryFn: async () => {
      if (!playerId) return [];

      try {
        const player = await loadPlayer(playerId);
        const historyData = await player.getHistory();
        return historyData;
      } catch (error) {
        console.error(`Failed to fetch history from "${playerId}":`, error);
        // Return empty array on error to prevent UI crashes
        return [];
      }
    },
    enabled: !!playerId,
    refetchInterval: POLLING_INTERVALS.SONG_SYNC, // 300ms
    staleTime: 0,
    gcTime: 0,
  });

  // Helper: Clear entire history
  const clear = useCallback(async () => {
    if (!playerId) return;

    try {
      const player = await loadPlayer(playerId);
      await player.clearHistory();
      await refetch(); // Refresh immediately
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, [playerId, refetch]);

  // Helper: Replay a song from history (add to queue)
  const replay = useCallback(
    async (song: Song) => {
      if (!playerId) return;

      try {
        const player = await loadPlayer(playerId);
        await player.add(song);
        // No need to refetch history - it doesn't change
      } catch (error) {
        console.error("Failed to replay song:", error);
      }
    },
    [playerId],
  );

  return {
    history,
    isLoading,
    error: error as Error | null,
    clear,
    replay,
  };
};
