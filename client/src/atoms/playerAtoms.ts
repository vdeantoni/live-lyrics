import { atom } from "jotai";
import type { Song, LyricsData, LineData, WordData } from "@/types";
import { selectedPlayerAtom } from "@/atoms/appState";
import { loadPlayer } from "@/config/providers";

const SEEK_END_TIMEOUT_MS = 1000;

export const playerStateAtom = atom<Song>({
  name: "",
  artist: "",
  album: "",
  currentTime: 0,
  duration: 0,
  isPlaying: false,
});

export const rawLrcContentAtom = atom<string | null>(null);
export const lyricsDataAtom = atom<LyricsData | null>(null);
export const activeLineAtom = atom<LineData | null>(null);
export const activeWordAtom = atom<WordData | null>(null);

export const artworkUrlsAtom = atom<string[]>([]);

// Loading state atoms for explicit state management
export const lyricsLoadingAtom = atom<boolean>(false);
export const artworkLoadingAtom = atom<boolean>(false);

export const playerUIStateAtom = atom({
  isDragging: false,
  isUserSeeking: false,
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
    const currentUIState = get(playerUIStateAtom);
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
          set(playerUIStateAtom, { ...currentUIState, isUserSeeking: true });

          await player.seek(action.payload);

          // Clear seeking state after delay
          setTimeout(
            () =>
              set(playerUIStateAtom, (prev) => ({
                ...prev,
                isUserSeeking: false,
              })),
            SEEK_END_TIMEOUT_MS,
          );
          break;
      }
    } catch (error) {
      // Rollback on error
      switch (action.type) {
        case "play":
        case "pause":
          set(playerStateAtom, {
            ...currentState,
            isPlaying: currentState.isPlaying,
          });
          break;
        case "seek":
          set(playerStateAtom, {
            ...currentState,
            currentTime: currentState.currentTime,
          });
          break;
      }
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

      const currentState = get(playerStateAtom);

      // Build update object with only changed fields for performance
      const updates: Partial<typeof currentState> = {};

      if (currentState.currentTime !== songData.currentTime) {
        updates.currentTime = songData.currentTime;
      }
      if (currentState.duration !== songData.duration) {
        updates.duration = songData.duration;
      }
      if (currentState.isPlaying !== songData.isPlaying) {
        updates.isPlaying = songData.isPlaying;
      }
      if (currentState.name !== songData.name) {
        updates.name = songData.name;
      }
      if (currentState.artist !== songData.artist) {
        updates.artist = songData.artist;
      }
      if (currentState.album !== songData.album) {
        updates.album = songData.album;
      }

      // Only update if there are actual changes
      if (Object.keys(updates).length > 0) {
        set(playerStateAtom, { ...currentState, ...updates });
      }
    } catch (error) {
      console.error("Failed to sync from source:", error);
    }
  },
);
