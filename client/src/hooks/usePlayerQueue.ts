import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { POLLING_INTERVALS } from "@/constants/timing";
import type { Song } from "@/types";
import { useCallback } from "react";

/**
 * Hook that fetches and manages the player queue
 * Polls every 300ms to stay in sync with player state
 * Provides helper methods for queue manipulation
 */
export const usePlayerQueue = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerId = selectedPlayer?.config.id;

  // Fetch queue from player
  const {
    data: queue = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["player-queue", playerId],
    queryFn: async () => {
      if (!playerId) return [];

      try {
        const player = await loadPlayer(playerId);
        const queueData = await player.getQueue();
        return queueData;
      } catch (error) {
        console.error(`Failed to fetch queue from "${playerId}":`, error);
        // Return empty array on error to prevent UI crashes
        return [];
      }
    },
    enabled: !!playerId,
    refetchInterval: POLLING_INTERVALS.SONG_SYNC, // 300ms
    staleTime: 0,
    gcTime: 0,
  });

  // Helper: Remove song at specific index
  const removeAt = useCallback(
    async (index: number) => {
      if (!playerId || !queue) return;

      try {
        const player = await loadPlayer(playerId);
        const newQueue = queue.filter((_, i) => i !== index);
        await player.setQueue(newQueue);
        await refetch(); // Refresh immediately
      } catch (error) {
        console.error("Failed to remove song from queue:", error);
      }
    },
    [playerId, queue, refetch],
  );

  // Helper: Reorder songs (for drag & drop)
  const reorder = useCallback(
    async (oldIndex: number, newIndex: number) => {
      if (!playerId || !queue) return;

      try {
        const player = await loadPlayer(playerId);
        // Reorder array
        const result = Array.from(queue);
        const [removed] = result.splice(oldIndex, 1);
        result.splice(newIndex, 0, removed);

        await player.setQueue(result);
        await refetch(); // Refresh immediately
      } catch (error) {
        console.error("Failed to reorder queue:", error);
      }
    },
    [playerId, queue, refetch],
  );

  // Helper: Clear entire queue
  const clear = useCallback(async () => {
    if (!playerId) return;

    try {
      const player = await loadPlayer(playerId);
      await player.setQueue([]);
      await refetch(); // Refresh immediately
    } catch (error) {
      console.error("Failed to clear queue:", error);
    }
  }, [playerId, refetch]);

  // Helper: Add songs to queue
  const addSongs = useCallback(
    async (...songs: Song[]) => {
      if (!playerId || songs.length === 0) return;

      try {
        const player = await loadPlayer(playerId);
        await player.add(...songs);
        await refetch(); // Refresh immediately
      } catch (error) {
        console.error("Failed to add songs to queue:", error);
      }
    },
    [playerId, refetch],
  );

  return {
    queue,
    isLoading,
    error: error as Error | null,
    removeAt,
    reorder,
    clear,
    addSongs,
  };
};
