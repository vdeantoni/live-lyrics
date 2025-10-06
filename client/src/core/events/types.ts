import type { Song } from "@/types";

/**
 * Type-safe event definitions for the application event bus
 * All events follow the pattern: { type: string; payload?: any }
 */
export type AppEvent =
  // Player control events (user actions)
  | { type: "player.play" }
  | { type: "player.pause" }
  | { type: "player.seek"; payload: { time: number } }

  // Player state events (emitted by services)
  | { type: "player.state.changed"; payload: Song }
  | { type: "player.error"; payload: { error: Error } }

  // Lyrics events
  | { type: "lyrics.fetch"; payload: { song: Song } }
  | {
      type: "lyrics.loaded";
      payload: { content: string; providerId: string };
    }
  | { type: "lyrics.error"; payload: { error: Error } }

  // Artwork events
  | { type: "artwork.fetch"; payload: { song: Song } }
  | { type: "artwork.loaded"; payload: { urls: string[] } }
  | { type: "artwork.error"; payload: { error: Error } }

  // UI events
  | { type: "ui.settings.toggle" }
  | { type: "ui.search.toggle" }
  | { type: "ui.playlists.toggle" };
