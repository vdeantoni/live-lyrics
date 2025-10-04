import { useAtomValue, useSetAtom } from "jotai";
import {
  playlistsAtom,
  selectedSongForPlaylistAtom,
  addToPlaylistDialogOpenAtom,
  closeAddToPlaylistDialogAtom,
  addSongToPlaylistAtom,
} from "@/atoms/appState";
import { X, Plus, Check, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CreatePlaylistDialog from "./CreatePlaylistDialog";

const AddToPlaylistDialog = () => {
  const isOpen = useAtomValue(addToPlaylistDialogOpenAtom);
  const selectedSong = useAtomValue(selectedSongForPlaylistAtom);
  const playlists = useAtomValue(playlistsAtom);
  const closeDialog = useSetAtom(closeAddToPlaylistDialogAtom);
  const addSongToPlaylist = useSetAtom(addSongToPlaylistAtom);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (!isOpen || !selectedSong) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addSongToPlaylist(playlistId, {
      name: selectedSong.name,
      artist: selectedSong.artist,
      album: selectedSong.album,
      duration: selectedSong.duration,
    });
    closeDialog();
  };

  const isSongInPlaylist = (playlistId: string): boolean => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;
    return playlist.songs.some(
      (song) =>
        song.name === selectedSong.name && song.artist === selectedSong.artist,
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeDialog}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            data-testid="add-to-playlist-dialog"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    Add to Playlist
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                    <Music2 className="h-4 w-4" />
                    <div className="truncate">
                      <span className="font-medium">{selectedSong.name}</span>
                      <span className="mx-1">•</span>
                      <span>{selectedSong.artist}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={closeDialog}
                  data-testid="add-to-playlist-close"
                  className="h-8 w-8 rounded-full p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto p-6">
              {/* Create New Playlist Button */}
              <Button
                onClick={() => setShowCreateDialog(true)}
                data-testid="add-to-playlist-create-new"
                className="mb-4 w-full justify-start"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Playlist
              </Button>

              {/* Empty State */}
              {playlists.length === 0 && (
                <div
                  data-testid="add-to-playlist-empty-state"
                  className="py-8 text-center text-sm text-zinc-500"
                >
                  No playlists yet. Create one to get started!
                </div>
              )}

              {/* Playlists List */}
              {playlists.length > 0 && (
                <div className="space-y-2">
                  {playlists.map((playlist) => {
                    const alreadyAdded = isSongInPlaylist(playlist.id);
                    return (
                      <button
                        key={playlist.id}
                        onClick={() =>
                          !alreadyAdded && handleAddToPlaylist(playlist.id)
                        }
                        disabled={alreadyAdded}
                        data-testid={`add-to-playlist-item-${playlist.id}`}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          alreadyAdded
                            ? "cursor-not-allowed border-white/5 bg-zinc-800/30 opacity-50"
                            : "border-white/10 bg-zinc-800/50 hover:border-white/20 hover:bg-zinc-800 active:scale-[0.98]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-white">
                              {playlist.name}
                            </h3>
                            <p className="text-xs text-zinc-500">
                              {playlist.songs.length}{" "}
                              {playlist.songs.length === 1 ? "song" : "songs"}
                            </p>
                          </div>
                          {alreadyAdded && (
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <Check className="h-4 w-4" />
                              <span>Added</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Create Playlist Dialog */}
          <CreatePlaylistDialog
            isOpen={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            addSongAfterCreate={true}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default AddToPlaylistDialog;
