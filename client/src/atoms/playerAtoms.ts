import { atom } from "jotai";
import type { Song, LyricsData, LineData, WordData } from "@/types";
import { modeIdAtom } from "@/atoms/settingsAtoms";
import { loadMusicMode } from "@/config/providers";

// Base atoms for player state
export const currentTimeAtom = atom(0);
export const durationAtom = atom(0);
export const isPlayingAtom = atom(false);
export const songNameAtom = atom<string | undefined>(undefined);
export const artistAtom = atom<string | undefined>(undefined);
export const albumAtom = atom<string | undefined>(undefined);

// Lyrics atoms
export const rawLrcContentAtom = atom<string | null>(null);
export const lyricsDataAtom = atom<LyricsData | null>(null);
export const activeLineAtom = atom<LineData | null>(null);
export const activeWordAtom = atom<WordData | null>(null);

// Artwork atoms
export const artworkUrlsAtom = atom<string[]>([]);

// UI state atoms
export const isDraggingAtom = atom(false);
export const isUserSeekingAtom = atom(false);

// Derived atoms
export const progressPercentAtom = atom((get) => {
  const current = get(currentTimeAtom);
  const duration = get(durationAtom);
  return duration > 0 ? (current / duration) * 100 : 0;
});

export const canUpdateFromServerAtom = atom((get) => {
  return !get(isDraggingAtom) && !get(isUserSeekingAtom);
});

// Song info atom (derived from individual atoms)
export const songInfoAtom = atom((get) => ({
  name: get(songNameAtom) || "",
  artist: get(artistAtom) || "",
  album: get(albumAtom) || "",
  currentTime: get(currentTimeAtom),
  duration: get(durationAtom),
  isPlaying: get(isPlayingAtom),
}));

// Helper function to get music mode instance
const getMusicMode = async (modeId: string) => {
  return await loadMusicMode(modeId);
};

// Action atoms for player controls using music mode
export const playAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  const modeId = get(modeIdAtom);

  if (!modeId) {
    console.error("No music mode selected");
    return;
  }

  set(isPlayingAtom, true);

  try {
    const musicMode = await getMusicMode(modeId);
    await musicMode.play();
  } catch (error) {
    // Rollback on error
    set(isPlayingAtom, wasPlaying);
    console.error("Failed to play:", error);
    throw error;
  }
});

export const pauseAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  const modeId = get(modeIdAtom);

  if (!modeId) {
    console.error("No music mode selected");
    return;
  }

  set(isPlayingAtom, false);

  try {
    const musicMode = await getMusicMode(modeId);
    await musicMode.pause();
  } catch (error) {
    // Rollback on error
    set(isPlayingAtom, wasPlaying);
    console.error("Failed to pause:", error);
    throw error;
  }
});

export const seekAtom = atom(null, async (get, set, time: number) => {
  const previousTime = get(currentTimeAtom);
  const modeId = get(modeIdAtom);

  if (!modeId) {
    console.error("No music mode selected");
    return;
  }

  // Update the UI immediately for responsiveness
  set(currentTimeAtom, time);
  set(isUserSeekingAtom, true);

  try {
    const musicMode = await getMusicMode(modeId);
    await musicMode.seek(time);
  } catch (error) {
    // Rollback on error
    set(currentTimeAtom, previousTime);
    console.error("Failed to seek:", error);
    throw error;
  } finally {
    // Clear seeking state after a delay
    setTimeout(() => set(isUserSeekingAtom, false), 1000);
  }
});

// Atom for syncing from source data
export const syncFromSourceAtom = atom(
  null,
  async (get, set, songData: Song) => {
    const canUpdate = get(canUpdateFromServerAtom);
    const modeId = get(modeIdAtom);

    if (!canUpdate || !modeId) return;

    try {
      // Only update if this is still the current mode
      if (get(modeIdAtom) !== modeId) return;

      set(currentTimeAtom, songData.currentTime);
      set(durationAtom, songData.duration);
      set(isPlayingAtom, songData.isPlaying);

      // Only update song metadata if it actually changed
      if (get(songNameAtom) !== songData.name) {
        set(songNameAtom, songData.name);
      }
      if (get(artistAtom) !== songData.artist) {
        set(artistAtom, songData.artist);
      }
      if (get(albumAtom) !== songData.album) {
        set(albumAtom, songData.album);
      }
    } catch (error) {
      console.error("Failed to sync from source:", error);
    }
  },
);
