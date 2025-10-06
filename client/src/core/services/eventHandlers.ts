import { on } from "@/core/events/bus";
import { playerService } from "./PlayerService";

/**
 * Initialize all event handlers
 * This wires up events to services
 *
 * Should be called once at app initialization
 */
export const initializeEventHandlers = () => {
  // Player control events → PlayerService
  on("player.play", async () => {
    try {
      await playerService.play();
    } catch (error) {
      console.error("Failed to handle player.play event:", error);
    }
  });

  on("player.pause", async () => {
    try {
      await playerService.pause();
    } catch (error) {
      console.error("Failed to handle player.pause event:", error);
    }
  });

  on("player.seek", async (event) => {
    try {
      await playerService.seek(event.payload.time);
    } catch (error) {
      console.error("Failed to handle player.seek event:", error);
    }
  });

  console.log("Event handlers initialized");
};
