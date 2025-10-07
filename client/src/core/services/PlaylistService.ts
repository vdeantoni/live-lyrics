import { emit } from "@/core/events/bus";
import type { Playlist, PlaylistSong } from "@/types";
import { DEFAULT_PLAYLISTS } from "@/config/playlists";

const STORAGE_KEY = "LIVE_LYRICS_PLAYLISTS";

/**
 * Playlist service that handles all playlist-related business logic
 * Emits events instead of updating state directly for decoupling
 *
 * Pattern: Service → Events → Atoms (via useEventSync)
 */
export class PlaylistService {
  private playlists: Playlist[] = [];

  constructor() {
    // Load playlists from localStorage on init
    this.loadPlaylists();
  }

  /**
   * Load playlists from localStorage
   */
  private loadPlaylists(): void {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY);
      if (storedValue === null) {
        // Initialize with default playlists
        this.playlists = DEFAULT_PLAYLISTS;
        this.savePlaylists();
      } else {
        this.playlists = JSON.parse(storedValue);
      }
    } catch (error) {
      console.error("Failed to load playlists:", error);
      this.playlists = DEFAULT_PLAYLISTS;
    }
  }

  /**
   * Save playlists to localStorage
   */
  private savePlaylists(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.playlists));
    } catch (error) {
      console.error("Failed to save playlists:", error);
      throw error;
    }
  }

  /**
   * Get all playlists (for initial load in useEventSync)
   */
  getPlaylists(): Playlist[] {
    return this.playlists;
  }

  /**
   * Create a new playlist
   * @param name - Playlist name
   * @param description - Optional description
   */
  createPlaylist(name: string, description?: string): Playlist {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Create new playlists array
    this.playlists = [...this.playlists, newPlaylist];
    this.savePlaylists();

    emit({
      type: "playlist.changed",
      payload: { operation: "create", playlistId: newPlaylist.id },
    });

    return newPlaylist;
  }

  /**
   * Update an existing playlist
   * @param playlistId - Playlist ID
   * @param updates - Partial updates to apply
   */
  updatePlaylist(
    playlistId: string,
    updates: Partial<Omit<Playlist, "id" | "createdAt">>,
  ): void {
    const index = this.playlists.findIndex((p) => p.id === playlistId);
    if (index === -1) {
      console.warn(`Playlist ${playlistId} not found`);
      return;
    }

    // Create updated playlist object
    const updatedPlaylist: Playlist = {
      ...this.playlists[index],
      ...updates,
      updatedAt: Date.now(),
    };

    // Create new playlists array
    this.playlists = [
      ...this.playlists.slice(0, index),
      updatedPlaylist,
      ...this.playlists.slice(index + 1),
    ];

    this.savePlaylists();

    emit({
      type: "playlist.changed",
      payload: { operation: "update", playlistId },
    });
  }

  /**
   * Delete a playlist
   * @param playlistId - Playlist ID to delete
   */
  deletePlaylist(playlistId: string): void {
    const index = this.playlists.findIndex((p) => p.id === playlistId);
    if (index === -1) {
      console.warn(`Playlist ${playlistId} not found`);
      return;
    }

    // Create new playlists array without the deleted playlist
    this.playlists = this.playlists.filter((p) => p.id !== playlistId);
    this.savePlaylists();

    emit({
      type: "playlist.changed",
      payload: { operation: "delete", playlistId },
    });
  }

  /**
   * Add a song to a playlist
   * @param playlistId - Playlist ID
   * @param song - Song to add (without id and order)
   */
  addSongToPlaylist(
    playlistId: string,
    song: Omit<PlaylistSong, "id" | "order">,
  ): void {
    const playlistIndex = this.playlists.findIndex((p) => p.id === playlistId);
    if (playlistIndex === -1) {
      console.warn(`Playlist ${playlistId} not found`);
      return;
    }

    const playlist = this.playlists[playlistIndex];

    // Check for duplicates based on name + artist
    const isDuplicate = playlist.songs.some(
      (s) => s.name === song.name && s.artist === song.artist,
    );
    if (isDuplicate) {
      console.warn("Song already exists in playlist");
      return;
    }

    const newSong: PlaylistSong = {
      ...song,
      id: `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      order: playlist.songs.length,
    };

    // Create updated playlist with new song
    const updatedPlaylist: Playlist = {
      ...playlist,
      songs: [...playlist.songs, newSong],
      updatedAt: Date.now(),
    };

    // Create new playlists array
    this.playlists = [
      ...this.playlists.slice(0, playlistIndex),
      updatedPlaylist,
      ...this.playlists.slice(playlistIndex + 1),
    ];

    this.savePlaylists();

    emit({
      type: "playlist.changed",
      payload: { operation: "addSong", playlistId, songId: newSong.id },
    });
  }

  /**
   * Remove a song from a playlist
   * @param playlistId - Playlist ID
   * @param songId - Song ID to remove
   */
  removeSongFromPlaylist(playlistId: string, songId: string): void {
    const playlistIndex = this.playlists.findIndex((p) => p.id === playlistId);
    if (playlistIndex === -1) {
      console.warn(`Playlist ${playlistId} not found`);
      return;
    }

    const playlist = this.playlists[playlistIndex];
    const songIndex = playlist.songs.findIndex((s) => s.id === songId);
    if (songIndex === -1) {
      console.warn(`Song ${songId} not found in playlist ${playlistId}`);
      return;
    }

    // Create new songs array without the removed song and re-index
    const newSongs = playlist.songs
      .filter((s) => s.id !== songId)
      .map((song, index) => ({ ...song, order: index }));

    // Create new playlist object
    const updatedPlaylist: Playlist = {
      ...playlist,
      songs: newSongs,
      updatedAt: Date.now(),
    };

    // Create new playlists array with updated playlist
    this.playlists = [
      ...this.playlists.slice(0, playlistIndex),
      updatedPlaylist,
      ...this.playlists.slice(playlistIndex + 1),
    ];

    this.savePlaylists();

    emit({
      type: "playlist.changed",
      payload: { operation: "removeSong", playlistId, songId },
    });
  }

  /**
   * Reorder songs in a playlist
   * @param playlistId - Playlist ID
   * @param oldIndex - Current index
   * @param newIndex - Target index
   */
  reorderPlaylistSongs(
    playlistId: string,
    oldIndex: number,
    newIndex: number,
  ): void {
    const playlistIndex = this.playlists.findIndex((p) => p.id === playlistId);
    if (playlistIndex === -1) {
      console.warn(`Playlist ${playlistId} not found`);
      return;
    }

    const playlist = this.playlists[playlistIndex];
    const songs = [...playlist.songs];
    const [movedSong] = songs.splice(oldIndex, 1);
    songs.splice(newIndex, 0, movedSong);

    // Re-index all songs and create new song objects
    const reorderedSongs = songs.map((song, index) => ({
      ...song,
      order: index,
    }));

    // Create updated playlist
    const updatedPlaylist: Playlist = {
      ...playlist,
      songs: reorderedSongs,
      updatedAt: Date.now(),
    };

    // Create new playlists array
    this.playlists = [
      ...this.playlists.slice(0, playlistIndex),
      updatedPlaylist,
      ...this.playlists.slice(playlistIndex + 1),
    ];

    this.savePlaylists();

    emit({
      type: "playlist.changed",
      payload: { operation: "reorder", playlistId },
    });
  }
}

// Singleton instance
export const playlistService = new PlaylistService();
