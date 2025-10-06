import { useAtomValue } from "jotai";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { POLLING_INTERVALS } from "@/constants/timing";
import type { Song } from "@/types";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook that fetches and manages the player history
 * Polls every 300ms to stay in sync with player state
 * Provides helper methods for history operations
 */
export const usePlayerHistory = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerId = selectedPlayer?.config.id;

  const [history, setHistory] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch history function
  const fetchHistory = useCallback(async () => {
    if (!playerId) {
      setHistory([]);
      return;
    }

    try {
      const player = await loadPlayer(playerId);
      const historyData = await player.getHistory();
      setHistory(historyData);
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch history from "${playerId}":`, err);
      setError(err as Error);
      setHistory([]); // Return empty array on error to prevent UI crashes
    }
  }, [playerId]);

  // Poll for history updates
  useEffect(() => {
    if (!playerId) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    fetchHistory().finally(() => setIsLoading(false));

    const interval = setInterval(fetchHistory, POLLING_INTERVALS.SONG_SYNC);

    return () => clearInterval(interval);
  }, [playerId, fetchHistory]);

  // Helper: Clear entire history
  const clear = useCallback(async () => {
    if (!playerId) return;

    try {
      const player = await loadPlayer(playerId);
      await player.clearHistory();
      await fetchHistory(); // Refresh immediately
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, [playerId, fetchHistory]);

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
    error,
    clear,
    replay,
  };
};
