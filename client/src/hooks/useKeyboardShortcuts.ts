import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  selectedPlayerAtom,
  toggleSettingsAtom,
  toggleSearchAtom,
  togglePlaylistsAtom,
  openAddToPlaylistDialogAtom,
} from "@/atoms/appState";
import { lyricsDataAtom, playerStateAtom } from "@/atoms/playerAtoms";
import { loadPlayer } from "@/config/providers";
import { useLogger } from "@/adapters/react/hooks/useLogger";

/**
 * Global keyboard shortcuts hook for the player
 *
 * Shortcuts (only triggered when no modifier keys are pressed, except where noted):
 * - Space: Play/Pause
 * - Left/Right arrows: Seek backward/forward (5s, or 15s with Shift)
 * - Up/Down arrows: Navigate to previous/next lyrics line
 * - C: Toggle settings screen (blocked when Cmd/Ctrl/Alt are pressed to avoid conflicts with copy/paste)
 * - S: Toggle search screen (blocked when Cmd/Ctrl/Alt are pressed)
 * - P: Toggle playlists screen (blocked when Cmd/Ctrl/Alt are pressed)
 * - A: Open add-to-playlist dialog (blocked when Cmd/Ctrl/Alt are pressed)
 */
export const useKeyboardShortcuts = () => {
  const logger = useLogger("useKeyboardShortcuts");
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);
  const toggleSearch = useSetAtom(toggleSearchAtom);
  const togglePlaylists = useSetAtom(togglePlaylistsAtom);
  const openAddToPlaylistDialog = useSetAtom(openAddToPlaylistDialogAtom);
  const lyricsData = useAtomValue(lyricsDataAtom);
  const playerState = useAtomValue(playerStateAtom);
  const {
    currentTime = 0,
    duration = 0,
    isPlaying = false,
  } = playerState || {};

  const playerId = selectedPlayer?.config.id;

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't trigger shortcuts if modifier keys are pressed (except for navigation shortcuts that expect them)
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

      const { key } = event;

      // Helper function to find current line index based on current time
      const getCurrentLineIndex = (): number => {
        if (!lyricsData) return -1;

        // Find the line that should be active at current time
        for (let i = lyricsData.lines.length - 1; i >= 0; i--) {
          if (lyricsData.lines[i].time <= currentTime) {
            return i;
          }
        }
        return 0; // Default to first line if none found
      };

      // Helper function to get player instance
      const getPlayer = async () => {
        if (!playerId) return null;
        try {
          return await loadPlayer(playerId);
        } catch (error) {
          logger.error("Failed to load player", { playerId, error });
          return null;
        }
      };

      switch (key.toLowerCase()) {
        case " ": // Space - Play/Pause
          if (hasModifier) return; // Don't trigger if modifier keys are pressed
          event.preventDefault();
          if (playerId && playerState) {
            const player = await getPlayer();
            if (player) {
              try {
                if (isPlaying) {
                  await player.pause();
                } else {
                  await player.play();
                }
              } catch (error) {
                logger.error("Playback control failed", { error });
              }
            }
          }
          break;

        case "c": // C - Toggle Settings
          if (hasModifier) return; // Don't trigger if modifier keys are pressed (fixes Cmd+C issue)
          event.preventDefault();
          toggleSettings();
          break;

        case "s": // S - Toggle Search
          if (hasModifier) return; // Don't trigger if modifier keys are pressed (fixes Cmd+S issue)
          event.preventDefault();
          toggleSearch();
          break;

        case "p": // P - Toggle Playlists
          if (hasModifier) return; // Don't trigger if modifier keys are pressed (fixes Cmd+P issue)
          event.preventDefault();
          togglePlaylists();
          break;

        case "a": // A - Open Add to Playlist Dialog
          if (hasModifier) return; // Don't trigger if modifier keys are pressed (fixes Cmd+A issue)
          event.preventDefault();
          if (playerState?.name) {
            // Only open if there's a song playing
            openAddToPlaylistDialog(playerState);
          }
          break;

        case "arrowleft": // Left Arrow - Seek backward (5s) or fast seek (15s with Shift)
          event.preventDefault();
          if (playerId) {
            const player = await getPlayer();
            if (player) {
              try {
                const seekAmount = event.shiftKey ? 15 : 5; // Fast seek with Shift
                const newTime = Math.max(0, currentTime - seekAmount);
                await player.seek(newTime);
              } catch (error) {
                logger.error("Seek failed", { error });
              }
            }
          }
          break;

        case "arrowright": // Right Arrow - Seek forward (5s) or fast seek (15s with Shift)
          event.preventDefault();
          if (playerId) {
            const player = await getPlayer();
            if (player) {
              try {
                const seekAmount = event.shiftKey ? 15 : 5; // Fast seek with Shift
                const newTime = Math.min(duration, currentTime + seekAmount);
                await player.seek(newTime);
              } catch (error) {
                logger.error("Seek failed", { error });
              }
            }
          }
          break;

        case "arrowup": // Up Arrow - Previous lyrics line
          if (event.ctrlKey || event.metaKey || event.altKey) return; // Block if Ctrl/Cmd/Alt (but allow Shift for consistency)
          event.preventDefault();
          if (playerId && lyricsData && lyricsData.lines.length > 0) {
            const player = await getPlayer();
            if (player) {
              try {
                const currentIndex = getCurrentLineIndex();
                const prevIndex = Math.max(0, currentIndex - 1);
                const prevLine = lyricsData.lines[prevIndex];
                if (prevLine) {
                  await player.seek(prevLine.time);
                }
              } catch (error) {
                logger.error("Seek failed", { error });
              }
            }
          }
          break;

        case "arrowdown": // Down Arrow - Next lyrics line
          if (event.ctrlKey || event.metaKey || event.altKey) return; // Block if Ctrl/Cmd/Alt (but allow Shift for consistency)
          event.preventDefault();
          if (playerId && lyricsData && lyricsData.lines.length > 0) {
            const player = await getPlayer();
            if (player) {
              try {
                const currentIndex = getCurrentLineIndex();
                const nextIndex = Math.min(
                  lyricsData.lines.length - 1,
                  currentIndex + 1,
                );
                const nextLine = lyricsData.lines[nextIndex];
                if (nextLine) {
                  await player.seek(nextLine.time);
                }
              } catch (error) {
                logger.error("Seek failed", { error });
              }
            }
          }
          break;
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    playerId,
    lyricsData,
    playerState,
    currentTime,
    duration,
    isPlaying,
    toggleSettings,
    toggleSearch,
    togglePlaylists,
    openAddToPlaylistDialog,
    logger,
  ]);
};
