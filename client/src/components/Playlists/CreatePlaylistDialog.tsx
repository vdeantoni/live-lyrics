import { useState } from "react";
import { useSetAtom } from "jotai";
import {
  createPlaylistAtom,
  addSongToPlaylistAtom,
  selectedSongForPlaylistAtom,
  closeAddToPlaylistDialogAtom,
} from "@/atoms/appState";
import { useAtomValue } from "jotai";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addSongAfterCreate?: boolean; // If true, adds the selected song after creating playlist
}

const CreatePlaylistDialog = ({
  isOpen,
  onClose,
  addSongAfterCreate = false,
}: CreatePlaylistDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createPlaylist = useSetAtom(createPlaylistAtom);
  const addSongToPlaylist = useSetAtom(addSongToPlaylistAtom);
  const selectedSong = useAtomValue(selectedSongForPlaylistAtom);
  const closeAddToPlaylistDialog = useSetAtom(closeAddToPlaylistDialogAtom);

  const handleCreate = () => {
    if (!name.trim()) return;

    setIsCreating(true);

    // Create the playlist
    const newPlaylist = createPlaylist(
      name.trim(),
      description.trim() || undefined,
    );

    // If requested, add the selected song to the new playlist
    if (addSongAfterCreate && selectedSong && newPlaylist) {
      addSongToPlaylist(newPlaylist.id, {
        name: selectedSong.name,
        artist: selectedSong.artist,
        album: selectedSong.album,
        duration: selectedSong.duration,
      });
      // Close both dialogs
      closeAddToPlaylistDialog();
    }

    // Reset form
    setName("");
    setDescription("");
    setIsCreating(false);
    onClose();
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    onClose();
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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            data-testid="create-playlist-dialog"
            className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Create Playlist
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Give your playlist a name and description
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  data-testid="create-playlist-close"
                  className="h-8 w-8 rounded-full p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label
                    htmlFor="playlist-name"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="playlist-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim()) {
                        handleCreate();
                      }
                    }}
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label
                    htmlFor="playlist-description"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="playlist-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/10 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-white/10 p-6">
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="create-playlist-cancel"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                data-testid="create-playlist-submit"
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create Playlist"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePlaylistDialog;
