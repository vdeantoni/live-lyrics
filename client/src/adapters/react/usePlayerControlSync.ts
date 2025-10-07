import { useEffect } from "react";
import { on } from "@/core/events/bus";
import { playerService } from "@/core/services/PlayerService";

/**
 * Hook that syncs player control events to PlayerService
 * Listens for control events (play, pause, seek, add) and calls PlayerService methods
 *
 * Should be called once at the app root level
 */
export const usePlayerControlSync = () => {
  useEffect(() => {
    // Handle play events
    const unsubscribePlay = on("player.play", async () => {
      try {
        await playerService.play();
      } catch (error) {
        console.error("Failed to handle player.play event:", error);
      }
    });

    // Handle pause events
    const unsubscribePause = on("player.pause", async () => {
      try {
        await playerService.pause();
      } catch (error) {
        console.error("Failed to handle player.pause event:", error);
      }
    });

    // Handle seek events
    const unsubscribeSeek = on("player.seek", async (event) => {
      try {
        await playerService.seek(event.payload.time);
      } catch (error) {
        console.error("Failed to handle player.seek event:", error);
      }
    });

    // Handle add song events
    const unsubscribeAdd = on("player.song.add", async (event) => {
      try {
        await playerService.add(...event.payload.songs);
      } catch (error) {
        console.error("Failed to handle player.song.add event:", error);
      }
    });

    // Handle next song events
    const unsubscribeNext = on("player.next", async () => {
      try {
        await playerService.next();
      } catch (error) {
        console.error("Failed to handle player.next event:", error);
      }
    });

    // Handle previous song events
    const unsubscribePrevious = on("player.previous", async () => {
      try {
        await playerService.previous();
      } catch (error) {
        console.error("Failed to handle player.previous event:", error);
      }
    });

    return () => {
      unsubscribePlay();
      unsubscribePause();
      unsubscribeSeek();
      unsubscribeAdd();
      unsubscribeNext();
      unsubscribePrevious();
    };
  }, []);
};
