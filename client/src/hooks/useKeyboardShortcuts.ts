import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { toggleSettingsAtom } from "@/atoms/settingsAtoms";
import type { Song } from "@/lib/api";
import type { MusicMode } from "@/types/settings";

/**
 * Global keyboard shortcuts hook for the music player
 *
 * Shortcuts:
 * - Space: Play/Pause
 * - Left/Right arrows: Seek backward/forward (5s)
 * - Shift + Left/Right arrows: Fast seek (15s)
 * - C: Toggle settings screen
 */
export const useKeyboardShortcuts = (
  musicMode?: MusicMode,
  songData?: Song,
) => {
  const toggleSettings = useSetAtom(toggleSettingsAtom);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const { key, shiftKey } = event;

      switch (key.toLowerCase()) {
        case " ": // Space - Play/Pause
          event.preventDefault();
          if (musicMode && songData) {
            if (songData.isPlaying) {
              musicMode.pause();
            } else {
              musicMode.play();
            }
          }
          break;

        case "c": // C - Toggle Settings
          event.preventDefault();
          toggleSettings();
          break;

        case "arrowleft": // Left Arrow - Seek backward
          event.preventDefault();
          if (musicMode && songData) {
            const seekAmount = shiftKey ? 15 : 5; // 15s with shift, 5s without
            const newTime = Math.max(0, songData.currentTime - seekAmount);
            musicMode.seek(newTime);
          }
          break;

        case "arrowright": // Right Arrow - Seek forward
          event.preventDefault();
          if (musicMode && songData) {
            const seekAmount = shiftKey ? 15 : 5; // 15s with shift, 5s without
            const newTime = Math.min(
              songData.duration,
              songData.currentTime + seekAmount,
            );
            musicMode.seek(newTime);
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
  }, [musicMode, songData, toggleSettings]);
};
