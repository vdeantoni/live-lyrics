import { atom } from "jotai";
import type { Song, LyricsData, LineData, WordData } from "@/types";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";
import { UI_DELAYS } from "@/constants/timing";

export const playerStateAtom = atom<Song>({
  name: "",
  artist: "",
  album: "",
  currentTime: 0,
  duration: 0,
  isPlaying: false,
});

// Lyrics content atom (stores normalized enhanced LRC format)
export const lyricsContentAtom = atom<string | null>(null);
export const lyricsDataAtom = atom<LyricsData | null>(null);
export const activeLineAtom = atom<LineData | null>(null);
export const activeWordAtom = atom<WordData | null>(null);

export const artworkUrlsAtom = atom<string[]>([]);

// Current artwork URL for background display (selected from artworkUrls)
export const currentArtworkUrlAtom = atom<string>("");

// Loading state atoms for explicit state management
export const lyricsLoadingAtom = atom<boolean>(false);
export const currentLyricsProviderAtom = atom<string | null>(null);
export const artworkLoadingAtom = atom<boolean>(false);

export const playerUIStateAtom = atom({
  isDragging: false,
  isUserSeeking: false,
  pendingSeekTime: undefined as number | undefined,
});

const getPlayer = async (playerId: string) => {
  return await loadPlayer(playerId);
};

export const playerControlAtom = atom(
  null,
  async (
    get,
    set,
    action: { type: "play" | "pause" | "seek"; payload?: number },
  ) => {
    const currentState = get(playerStateAtom);
    const selectedPlayer = get(selectedPlayerAtom);
    const playerId = selectedPlayer?.config.id;

    if (!playerId) {
      console.error("No player selected");
      return;
    }

    try {
      const player = await getPlayer(playerId);

      switch (action.type) {
        case "play":
          set(playerStateAtom, { ...currentState, isPlaying: true });
          await player.play();
          break;

        case "pause":
          set(playerStateAtom, { ...currentState, isPlaying: false });
          await player.pause();
          break;

        case "seek":
          if (action.payload === undefined) {
            console.error("Seek action requires time payload");
            return;
          }
          // Update UI immediately for responsiveness
          set(playerStateAtom, {
            ...currentState,
            currentTime: action.payload,
          });
          // Use updater function to preserve current UI state (e.g., isDragging)
          set(playerUIStateAtom, (prev) => ({ ...prev, isUserSeeking: true }));

          await player.seek(action.payload);

          // Clear seeking state after delay
          setTimeout(
            () =>
              set(playerUIStateAtom, (prev) => ({
                ...prev,
                isUserSeeking: false,
              })),
            UI_DELAYS.SEEK_END_TIMEOUT,
          );
          break;
      }
    } catch (error) {
      // Rollback to previous state on error
      set(playerStateAtom, currentState);
      console.error(`Failed to ${action.type}:`, error);
      throw error;
    }
  },
);

export const syncFromSourceAtom = atom(
  null,
  async (get, set, songData: Song) => {
    const uiState = get(playerUIStateAtom);
    const selectedPlayer = get(selectedPlayerAtom);
    const playerId = selectedPlayer?.config.id;

    // Don't update during user interaction
    const canUpdateFromServer = !uiState.isDragging && !uiState.isUserSeeking;

    if (!canUpdateFromServer || !playerId) return;

    try {
      // Only update if this is still the current player
      const currentSelectedPlayer = get(selectedPlayerAtom);
      if (currentSelectedPlayer?.config.id !== playerId) return;

      // Update state - Jotai handles change detection internally
      set(playerStateAtom, songData);
    } catch (error) {
      console.error("Failed to sync from source:", error);
    }
  },
);
