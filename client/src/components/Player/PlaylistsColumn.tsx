import { useState } from "react";
import { useAtomValue } from "jotai";
import { playlistsAtom, selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { usePlaylists } from "@/adapters/react/usePlaylists";
import {
  ListMusic,
  Plus,
  ChevronDown,
  ChevronUp,
  Play,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import CreatePlaylistDialog from "../Playlists/CreatePlaylistDialog";

interface PlaylistsColumnProps {
  showHeader?: boolean;
}

const PlaylistsColumn = ({ showHeader = false }: PlaylistsColumnProps) => {
  const playlists = useAtomValue(playlistsAtom);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(
    null,
  );
  const { removeSongFromPlaylist, deletePlaylist } = usePlaylists();
  const selectedPlayer = useAtomValue(selectedPlayerAtom);

  const handlePlaySong = async (song: {
    name: string;
    artist: string;
    album: string;
    duration: number;
  }) => {
    const playerId = selectedPlayer?.config.id;
    if (!playerId) return;

    try {
      const player = await loadPlayer(playerId);
      // Convert to full Song object with playback state
      await player.add({
        ...song,
        currentTime: 0,
        isPlaying: false,
      });
    } catch (error) {
      console.error("Failed to add song to queue:", error);
    }
  };

  const handlePlayAll = async (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.songs.length === 0) return;

    const playerId = selectedPlayer?.config.id;
    if (!playerId) return;

    try {
      const player = await loadPlayer(playerId);
      // Clear queue and add all songs
      await player.clear();
      const songsToAdd = playlist.songs
        .sort((a, b) => a.order - b.order)
        .map((song) => ({
          ...song,
          currentTime: 0,
          isPlaying: false,
        }));
      await player.add(...songsToAdd);
    } catch (error) {
      console.error("Failed to play all songs:", error);
    }
  };

  const handleRemoveSong = (playlistId: string, songId: string) => {
    removeSongFromPlaylist(playlistId, songId);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(playlistId);
      if (expandedPlaylistId === playlistId) {
        setExpandedPlaylistId(null);
      }
    }
  };

  const togglePlaylistExpanded = (playlistId: string) => {
    setExpandedPlaylistId(
      expandedPlaylistId === playlistId ? null : playlistId,
    );
  };

  return (
    <>
      {/* Optional Header */}
      {showHeader && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Playlists</h3>
        </div>
      )}

      {/* Empty State */}
      {playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ListMusic className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-lg text-zinc-400">No playlists yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Create a playlist to get started
          </p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-playlist-empty-state"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Playlist
          </Button>
        </div>
      )}

      {/* Playlists List */}
      {playlists.length > 0 && (
        <div className="space-y-3">
          {/* Create Playlist Button */}
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-new-playlist-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Playlist
          </Button>

          {/* Playlist Cards */}
          {playlists.map((playlist) => {
            const isExpanded = expandedPlaylistId === playlist.id;
            return (
              <div
                key={playlist.id}
                data-testid={`playlist-card-${playlist.id}`}
                className="w-full rounded-lg border border-white/10 bg-zinc-800/50 transition-all hover:border-white/20"
              >
                {/* Playlist Header */}
                <div
                  onClick={() => togglePlaylistExpanded(playlist.id)}
                  data-testid={`playlist-header-${playlist.id}`}
                  className="w-full cursor-pointer p-4 text-left transition-all hover:bg-zinc-800/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {playlist.name}
                        </h3>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 flex-shrink-0 text-zinc-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 flex-shrink-0 text-zinc-400" />
                        )}
                      </div>
                      {playlist.description && (
                        <p className="mt-1 truncate text-sm text-zinc-400">
                          {playlist.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        {playlist.songs.length}{" "}
                        {playlist.songs.length === 1 ? "song" : "songs"}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {/* Play All Button */}
                      {playlist.songs.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAll(playlist.id);
                          }}
                          data-testid={`play-all-${playlist.id}`}
                          className="hover:bg-primary/20 hover:text-primary h-8 w-8 rounded-full p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist.id);
                        }}
                        data-testid={`delete-playlist-${playlist.id}`}
                        className="h-8 w-8 rounded-full p-0 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Songs List */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    {playlist.songs.length === 0 && (
                      <p className="py-4 text-center text-sm text-zinc-500">
                        No songs in this playlist yet
                      </p>
                    )}
                    {playlist.songs.length > 0 && (
                      <div className="space-y-2">
                        {playlist.songs
                          .sort((a, b) => a.order - b.order)
                          .map((song, index) => (
                            <div
                              key={song.id}
                              data-testid={`playlist-song-${song.id}`}
                              className="group flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-zinc-700/50"
                            >
                              {/* Order Number */}
                              <span className="w-6 text-center text-sm text-zinc-500">
                                {index + 1}
                              </span>

                              {/* Song Info - Clickable */}
                              <button
                                onClick={() => handlePlaySong(song)}
                                data-testid={`play-song-${song.id}`}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              >
                                <Play className="h-4 w-4 flex-shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {song.name}
                                  </p>
                                  <p className="truncate text-xs text-zinc-400">
                                    {song.artist}
                                  </p>
                                </div>
                              </button>

                              {/* Duration */}
                              <span className="flex-shrink-0 text-xs text-zinc-500">
                                {formatTime(song.duration)}
                              </span>

                              {/* Remove Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveSong(playlist.id, song.id)
                                }
                                data-testid={`remove-song-${song.id}`}
                                className="h-7 w-7 flex-shrink-0 rounded-full p-0 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        addSongAfterCreate={false}
      />
    </>
  );
};

export default PlaylistsColumn;
