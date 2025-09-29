import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { playerIdAtom, toggleSettingsAtom } from "@/atoms/settingsAtoms";
import {
  lyricsDataAtom,
  songInfoAtom,
  currentTimeAtom,
  durationAtom,
} from "@/atoms/playerAtoms";
import { loadPlayer } from "@/config/providers";

/**
 * Global keyboard shortcuts hook for the player
 *
 * Shortcuts:
 * - Space: Play/Pause
 * - Left/Right arrows: Seek backward/forward (5s)
 * - Up/Down arrows: Navigate to previous/next lyrics line
 * - C: Toggle settings screen
 */
export const useKeyboardShortcuts = () => {
  const playerId = useAtomValue(playerIdAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);
  const lyricsData = useAtomValue(lyricsDataAtom);
  const songInfo = useAtomValue(songInfoAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const duration = useAtomValue(durationAtom);

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
          console.error("Failed to load player:", error);
          return null;
        }
      };

      switch (key.toLowerCase()) {
        case " ": // Space - Play/Pause
          event.preventDefault();
          if (playerId && songInfo) {
            const player = await getPlayer();
            if (player) {
              if (songInfo.isPlaying) {
                await player.pause();
              } else {
                await player.play();
              }
            }
          }
          break;

        case "c": // C - Toggle Settings
          event.preventDefault();
          toggleSettings();
          break;

        case "arrowleft": // Left Arrow - Seek backward
          event.preventDefault();
          if (playerId) {
            const player = await getPlayer();
            if (player) {
              const newTime = Math.max(0, currentTime - 5);
              await player.seek(newTime);
            }
          }
          break;

        case "arrowright": // Right Arrow - Seek forward
          event.preventDefault();
          if (playerId) {
            const player = await getPlayer();
            if (player) {
              const newTime = Math.min(duration, currentTime + 5);
              await player.seek(newTime);
            }
          }
          break;

        case "arrowup": // Up Arrow - Previous lyrics line
          event.preventDefault();
          if (playerId && lyricsData && lyricsData.lines.length > 0) {
            const player = await getPlayer();
            if (player) {
              const currentIndex = getCurrentLineIndex();
              const prevIndex = Math.max(0, currentIndex - 1);
              const prevLine = lyricsData.lines[prevIndex];
              if (prevLine) {
                await player.seek(prevLine.time);
              }
            }
          }
          break;

        case "arrowdown": // Down Arrow - Next lyrics line
          event.preventDefault();
          if (playerId && lyricsData && lyricsData.lines.length > 0) {
            const player = await getPlayer();
            if (player) {
              const currentIndex = getCurrentLineIndex();
              const nextIndex = Math.min(
                lyricsData.lines.length - 1,
                currentIndex + 1,
              );
              const nextLine = lyricsData.lines[nextIndex];
              if (nextLine) {
                await player.seek(nextLine.time);
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
  }, [playerId, lyricsData, songInfo, currentTime, duration, toggleSettings]);
};
