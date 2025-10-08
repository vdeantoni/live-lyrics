import type { Song, Player } from "@/types";
import { loadPlayer } from "@/config/providers";
import { emit } from "@/core/events/bus";
import { logService } from "@/core/services/LogService";

/**
 * Player service that handles all player-related business logic
 * Emits events instead of updating state directly for decoupling
 */
export class PlayerService {
  private currentPlayer: Player | null = null;
  private currentPlayerId: string | null = null;

  /**
   * Initialize the service with a player
   * @param playerId - Player ID to load
   */
  async setPlayer(playerId: string): Promise<void> {
    try {
      this.currentPlayerId = playerId;
      this.currentPlayer = await loadPlayer(playerId);
    } catch (error) {
      logService.error("Failed to load player", "PlayerService", {
        playerId,
        error,
      });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Get the current player ID
   */
  getCurrentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  /**
   * Play the current song
   */
  async play(): Promise<void> {
    if (!this.currentPlayer) {
      const error = new Error("No player selected");
      emit({ type: "player.error", payload: { error } });
      throw error;
    }

    try {
      await this.currentPlayer.play();
      // Get updated state and emit event
      const song = await this.currentPlayer.getSong();
      emit({ type: "player.state.changed", payload: song });
    } catch (error) {
      logService.error("Failed to play", "PlayerService", { error });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Pause the current song
   */
  async pause(): Promise<void> {
    if (!this.currentPlayer) {
      const error = new Error("No player selected");
      emit({ type: "player.error", payload: { error } });
      throw error;
    }

    try {
      await this.currentPlayer.pause();
      // Get updated state and emit event
      const song = await this.currentPlayer.getSong();
      emit({ type: "player.state.changed", payload: song });
    } catch (error) {
      logService.error("Failed to pause", "PlayerService", { error });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Seek to a specific time in the current song
   * @param time - Time in seconds
   */
  async seek(time: number): Promise<void> {
    if (!this.currentPlayer) {
      const error = new Error("No player selected");
      emit({ type: "player.error", payload: { error } });
      throw error;
    }

    try {
      await this.currentPlayer.seek(time);
      // Get updated state and emit event
      const song = await this.currentPlayer.getSong();
      emit({ type: "player.state.changed", payload: song });
    } catch (error) {
      logService.error("Failed to seek", "PlayerService", { time, error });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Skip to next song
   */
  async next(): Promise<void> {
    if (!this.currentPlayer) {
      const error = new Error("No player selected");
      emit({ type: "player.error", payload: { error } });
      throw error;
    }

    try {
      await this.currentPlayer.next();
      // Get updated state and emit event
      const song = await this.currentPlayer.getSong();
      emit({ type: "player.state.changed", payload: song });
    } catch (error) {
      logService.error("Failed to skip to next", "PlayerService", { error });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Go to previous song
   */
  async previous(): Promise<void> {
    if (!this.currentPlayer) {
      const error = new Error("No player selected");
      emit({ type: "player.error", payload: { error } });
      throw error;
    }

    try {
      await this.currentPlayer.previous();
      // Get updated state and emit event
      const song = await this.currentPlayer.getSong();
      emit({ type: "player.state.changed", payload: song });
    } catch (error) {
      logService.error("Failed to go to previous", "PlayerService", { error });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Add songs to the player queue
   * @param songs - Songs to add to the queue
   */
  async add(...songs: Song[]): Promise<void> {
    if (!this.currentPlayer) {
      const error = new Error("No player selected");
      emit({ type: "player.error", payload: { error } });
      throw error;
    }

    try {
      await this.currentPlayer.add(...songs);
      // Get updated state and emit event
      const song = await this.currentPlayer.getSong();
      emit({ type: "player.state.changed", payload: song });
    } catch (error) {
      logService.error("Failed to add songs", "PlayerService", {
        count: songs.length,
        error,
      });
      emit({ type: "player.error", payload: { error: error as Error } });
      throw error;
    }
  }

  /**
   * Get the current song information
   */
  async getSong(): Promise<Song> {
    if (!this.currentPlayer) {
      throw new Error("No player selected");
    }

    return this.currentPlayer.getSong();
  }

  /**
   * Subscribe to song updates (for WebSocket players)
   * @param callback - Callback function to handle song updates
   * @returns Unsubscribe function
   */
  onSongUpdate(callback: (song: Song) => void): () => void {
    if (!this.currentPlayer) {
      logService.warn(
        "No player selected for song update subscription",
        "PlayerService",
      );
      return () => {};
    }

    // Check if player supports WebSocket updates
    if (!("onSongUpdate" in this.currentPlayer)) {
      logService.warn(
        "Player does not support WebSocket updates",
        "PlayerService",
      );
      return () => {};
    }

    return (
      this.currentPlayer as Player & {
        onSongUpdate: (callback: (song: Song) => void) => () => void;
      }
    ).onSongUpdate(callback);
  }
}

// Singleton instance
export const playerService = new PlayerService();
