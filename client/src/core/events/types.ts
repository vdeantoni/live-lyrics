import type { Song } from "@/types";
import type { ProviderType as SettingsProviderType } from "@/core/services/SettingsService";
import type { ProviderType } from "@/core/services/ProviderService";

/**
 * Type-safe event definitions for the application event bus
 * All events follow the pattern: { type: string; payload?: any }
 */
export type AppEvent =
  // Player control events (user actions)
  | { type: "player.play" }
  | { type: "player.pause" }
  | { type: "player.seek"; payload: { time: number } }
  | { type: "player.song.add"; payload: { songs: Song[] } }

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

  // Settings events (emitted by SettingsService)
  | {
      type: "settings.changed";
      payload: { providerType: SettingsProviderType; providerId?: string };
    }

  // Provider events (emitted by ProviderService)
  | {
      type: "providers.changed";
      payload: { providerType?: ProviderType };
    }

  // Playlist events (emitted by PlaylistService)
  | {
      type: "playlist.changed";
      payload: {
        operation:
          | "create"
          | "update"
          | "delete"
          | "addSong"
          | "removeSong"
          | "reorder";
        playlistId?: string;
        songId?: string;
      };
    }

  // UI events
  | { type: "ui.settings.toggle" }
  | { type: "ui.search.toggle" }
  | { type: "ui.playlists.toggle" };
