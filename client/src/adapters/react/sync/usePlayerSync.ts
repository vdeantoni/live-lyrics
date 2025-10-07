import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { selectedPlayerAtom } from "@/atoms/appState";
import { playerService } from "@/core/services/PlayerService";
import { emit } from "@/core/events/bus";

/**
 * Hook that syncs player state with the selected player
 * All players now use subscription-based updates (fully reactive!)
 *
 * Replaces the old polling-based useSongSync hook
 */
export const usePlayerSync = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerId = selectedPlayer?.config.id;
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
        // IMMEDIATELY clear player state when switching players
        // This ensures artwork/lyrics are cleared instantly during transitions
        emit({
          type: "player.state.changed",
          payload: {
            name: "",
            artist: "",
            album: "",
            currentTime: 0,
            duration: 0,
            isPlaying: false,
          },
        });

        // Small delay to ensure React processes the empty state
        // before we fetch the new player's state
        await new Promise((resolve) => setTimeout(resolve, 50));

        await playerService.setPlayer(playerId);
        if (cancelled) return;

        setIsPlayerReady(true);

        // Immediately fetch initial song data after player is ready
        try {
          const song = await playerService.getSong();
          emit({ type: "player.state.changed", payload: song });
        } catch (error) {
          console.error("Failed to fetch initial song:", error);
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

  // Subscribe to player updates (works for all players!)
  useEffect(() => {
    if (!playerId || !isPlayerReady) return;

    const unsubscribe = playerService.onSongUpdate((song) => {
      emit({ type: "player.state.changed", payload: song });
    });

    return unsubscribe;
  }, [playerId, isPlayerReady]);
};
