import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { modeIdAtom, toggleSettingsAtom } from "@/atoms/settingsAtoms";
import {
  lyricsDataAtom,
  songInfoAtom,
  currentTimeAtom,
  durationAtom,
} from "@/atoms/playerAtoms";
import { loadMusicMode } from "@/config/providers";

/**
 * Global keyboard shortcuts hook for the music player
 *
 * Shortcuts:
 * - Space: Play/Pause
 * - Left/Right arrows: Seek backward/forward (5s)
 * - Up/Down arrows: Navigate to previous/next lyrics line
 * - C: Toggle settings screen
 */
export const useKeyboardShortcuts = () => {
  const modeId = useAtomValue(modeIdAtom);
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

      // Helper function to get music mode instance
      const getMusicMode = async () => {
        if (!modeId) return null;
        try {
          return await loadMusicMode(modeId);
        } catch (error) {
          console.error("Failed to load music mode:", error);
          return null;
        }
      };

      switch (key.toLowerCase()) {
        case " ": // Space - Play/Pause
          event.preventDefault();
          if (modeId && songInfo) {
            const musicMode = await getMusicMode();
            if (musicMode) {
              if (songInfo.isPlaying) {
                await musicMode.pause();
              } else {
                await musicMode.play();
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
          if (modeId) {
            const musicMode = await getMusicMode();
            if (musicMode) {
              const newTime = Math.max(0, currentTime - 5);
              await musicMode.seek(newTime);
            }
          }
          break;

        case "arrowright": // Right Arrow - Seek forward
          event.preventDefault();
          if (modeId) {
            const musicMode = await getMusicMode();
            if (musicMode) {
              const newTime = Math.min(duration, currentTime + 5);
              await musicMode.seek(newTime);
            }
          }
          break;

        case "arrowup": // Up Arrow - Previous lyrics line
          event.preventDefault();
          if (modeId && lyricsData && lyricsData.lines.length > 0) {
            const musicMode = await getMusicMode();
            if (musicMode) {
              const currentIndex = getCurrentLineIndex();
              const prevIndex = Math.max(0, currentIndex - 1);
              const prevLine = lyricsData.lines[prevIndex];
              if (prevLine) {
                await musicMode.seek(prevLine.time);
              }
            }
          }
          break;

        case "arrowdown": // Down Arrow - Next lyrics line
          event.preventDefault();
          if (modeId && lyricsData && lyricsData.lines.length > 0) {
            const musicMode = await getMusicMode();
            if (musicMode) {
              const currentIndex = getCurrentLineIndex();
              const nextIndex = Math.min(
                lyricsData.lines.length - 1,
                currentIndex + 1,
              );
              const nextLine = lyricsData.lines[nextIndex];
              if (nextLine) {
                await musicMode.seek(nextLine.time);
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
  }, [modeId, lyricsData, songInfo, currentTime, duration, toggleSettings]);
};
