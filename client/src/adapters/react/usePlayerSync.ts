import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { selectedPlayerAtom } from "@/atoms/appState";
import { playerService } from "@/core/services/PlayerService";
import { emit } from "@/core/events/bus";
import { POLLING_INTERVALS } from "@/constants/timing";

/**
 * Hook that syncs player state with the selected player
 * Handles both WebSocket subscription (for RemotePlayer) and polling (for LocalPlayer)
 *
 * Replaces the old useSongSync hook
 */
export const usePlayerSync = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerId = selectedPlayer?.config.id;
  const isWebSocket = playerId === "remote";
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Initialize player service when player changes
  useEffect(() => {
    if (!playerId) {
      setIsPlayerReady(false);
      return;
    }

    let cancelled = false;

    const initializePlayer = async () => {
      try {
        await playerService.setPlayer(playerId);
        if (!cancelled) {
          setIsPlayerReady(true);
        }
      } catch (error) {
        console.error(`Failed to initialize player "${playerId}":`, error);
        if (!cancelled) {
          setIsPlayerReady(false);
        }
      }
    };

    setIsPlayerReady(false);
    initializePlayer();

    return () => {
      cancelled = true;
      setIsPlayerReady(false);
    };
  }, [playerId]);

  // WebSocket subscription for RemotePlayer
  useEffect(() => {
    if (!isWebSocket || !playerId || !isPlayerReady) return;

    const unsubscribe = playerService.onSongUpdate((song) => {
      emit({ type: "player.state.changed", payload: song });
    });

    return unsubscribe;
  }, [playerId, isWebSocket, isPlayerReady]);

  // Polling for non-WebSocket players (e.g., LocalPlayer)
  useEffect(() => {
    if (isWebSocket || !playerId || !isPlayerReady) return;

    const interval = setInterval(async () => {
      try {
        const song = await playerService.getSong();
        emit({ type: "player.state.changed", payload: song });
      } catch (error) {
        console.error("Failed to poll song:", error);
      }
    }, POLLING_INTERVALS.SONG_SYNC);

    // Initial fetch
    (async () => {
      try {
        const song = await playerService.getSong();
        emit({ type: "player.state.changed", payload: song });
      } catch (error) {
        console.error("Failed to fetch initial song:", error);
      }
    })();

    return () => clearInterval(interval);
  }, [playerId, isWebSocket, isPlayerReady]);
};
