import { useAtomValue } from "jotai";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { POLLING_INTERVALS } from "@/constants/timing";
import { useLogger } from "@/adapters/react/hooks/useLogger";
import type { Song } from "@/types";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook that fetches and manages the player queue
 * Polls every 300ms to stay in sync with player state
 * Provides helper methods for queue manipulation
 */
export const usePlayerQueue = () => {
  const logger = useLogger("usePlayerQueue");
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerId = selectedPlayer?.config.id;

  const [queue, setQueue] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch queue function
  const fetchQueue = useCallback(async () => {
    if (!playerId) {
      setQueue([]);
      return;
    }

    try {
      const player = await loadPlayer(playerId);
      const queueData = await player.getQueue();
      setQueue(queueData);
      setError(null);
    } catch (err) {
      logger.error("Failed to fetch queue", { playerId, error: err });
      setError(err as Error);
      setQueue([]); // Return empty array on error to prevent UI crashes
    }
  }, [playerId, logger]);

  // Poll for queue updates
  useEffect(() => {
    if (!playerId) {
      setQueue([]);
      return;
    }

    setIsLoading(true);
    fetchQueue().finally(() => setIsLoading(false));

    const interval = setInterval(fetchQueue, POLLING_INTERVALS.SONG_SYNC);

    return () => clearInterval(interval);
  }, [playerId, fetchQueue]);

  // Helper: Remove song at specific index
  const removeAt = useCallback(
    async (index: number) => {
      if (!playerId || !queue) return;

      try {
        const player = await loadPlayer(playerId);
        const newQueue = queue.filter((_: Song, i: number) => i !== index);
        await player.setQueue(newQueue);
        await fetchQueue(); // Refresh immediately
      } catch (error) {
        logger.error("Failed to remove song from queue", { index, error });
      }
    },
    [playerId, queue, fetchQueue, logger],
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
        await fetchQueue(); // Refresh immediately
      } catch (error) {
        logger.error("Failed to reorder queue", { oldIndex, newIndex, error });
      }
    },
    [playerId, queue, fetchQueue, logger],
  );

  // Helper: Clear entire queue
  const clear = useCallback(async () => {
    if (!playerId) return;

    try {
      const player = await loadPlayer(playerId);
      await player.setQueue([]);
      await fetchQueue(); // Refresh immediately
    } catch (error) {
      logger.error("Failed to clear queue", { error });
    }
  }, [playerId, fetchQueue, logger]);

  // Helper: Add songs to queue
  const addSongs = useCallback(
    async (...songs: Song[]) => {
      if (!playerId || songs.length === 0) return;

      try {
        const player = await loadPlayer(playerId);
        await player.add(...songs);
        await fetchQueue(); // Refresh immediately
      } catch (error) {
        logger.error("Failed to add songs to queue", {
          count: songs.length,
          error,
        });
      }
    },
    [playerId, fetchQueue, logger],
  );

  return {
    queue,
    isLoading,
    error,
    removeAt,
    reorder,
    clear,
    addSongs,
  };
};
