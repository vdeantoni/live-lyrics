import { useCallback } from "react";
import { playlistService } from "@/core/services/PlaylistService";
import type { Playlist, PlaylistSong } from "@/types";

/**
 * Hook that provides playlist management functions
 * Wraps PlaylistService methods for use in React components
 *
 * @example
 * const playlists = usePlaylists();
 * <button onClick={() => playlists.createPlaylist("My Playlist")}>
 *   Create Playlist
 * </button>
 */
export const usePlaylists = () => {
  const createPlaylist = useCallback(
    (name: string, description?: string): Playlist => {
      return playlistService.createPlaylist(name, description);
    },
    [],
  );

  const updatePlaylist = useCallback(
    (
      playlistId: string,
      updates: Partial<Omit<Playlist, "id" | "createdAt">>,
    ) => {
      playlistService.updatePlaylist(playlistId, updates);
    },
    [],
  );

  const deletePlaylist = useCallback((playlistId: string) => {
    playlistService.deletePlaylist(playlistId);
  }, []);

  const addSongToPlaylist = useCallback(
    (playlistId: string, song: Omit<PlaylistSong, "id" | "order">) => {
      playlistService.addSongToPlaylist(playlistId, song);
    },
    [],
  );

  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      playlistService.removeSongFromPlaylist(playlistId, songId);
    },
    [],
  );

  const reorderPlaylistSongs = useCallback(
    (playlistId: string, oldIndex: number, newIndex: number) => {
      playlistService.reorderPlaylistSongs(playlistId, oldIndex, newIndex);
    },
    [],
  );

  return {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
  };
};
