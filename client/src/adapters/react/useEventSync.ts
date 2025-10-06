import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { on } from "@/core/events/bus";
import { playerStateAtom, playerUIStateAtom } from "@/atoms/playerAtoms";
import { UI_DELAYS } from "@/constants/timing";

/**
 * Hook that syncs events to Jotai atoms
 * This is the bridge between the event system and Jotai state
 *
 * Should be called once at the app root level
 */
export const useEventSync = () => {
  const setPlayerState = useSetAtom(playerStateAtom);
  const setPlayerUIState = useSetAtom(playerUIStateAtom);

  useEffect(() => {
    // Sync player state changes to atom
    const unsubscribePlayerState = on("player.state.changed", (event) => {
      setPlayerState(event.payload);
    });

    // Handle player errors
    const unsubscribePlayerError = on("player.error", (event) => {
      console.error("Player error:", event.payload.error);
    });

    return () => {
      unsubscribePlayerState();
      unsubscribePlayerError();
    };
  }, [setPlayerState]);

  // Handle optimistic UI updates for seeking
  useEffect(() => {
    const unsubscribeSeek = on("player.seek", (event) => {
      // Optimistically update currentTime
      setPlayerState((prev) => ({
        ...prev,
        currentTime: event.payload.time,
      }));

      // Set seeking state
      setPlayerUIState((prev) => ({ ...prev, isUserSeeking: true }));

      // Clear seeking state after delay
      setTimeout(() => {
        setPlayerUIState((prev) => ({ ...prev, isUserSeeking: false }));
      }, UI_DELAYS.SEEK_END_TIMEOUT);
    });

    return unsubscribeSeek;
  }, [setPlayerState, setPlayerUIState]);
};
