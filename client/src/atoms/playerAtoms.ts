import { atom } from "jotai";
import type { Song } from "@/lib/api";
import { currentMusicSourceAtom } from "@/atoms/sourceAtoms";

// Base atoms for player state
export const currentTimeAtom = atom(0);
export const durationAtom = atom(0);
export const isPlayingAtom = atom(false);
export const songNameAtom = atom<string | undefined>(undefined);
export const artistAtom = atom<string | undefined>(undefined);
export const albumAtom = atom<string | undefined>(undefined);

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
  name: get(songNameAtom),
  artist: get(artistAtom),
  album: get(albumAtom),
  currentTime: get(currentTimeAtom),
  duration: get(durationAtom),
  isPlaying: get(isPlayingAtom),
}));

// Action atoms for player controls using music source
export const playAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  const source = get(currentMusicSourceAtom);

  set(isPlayingAtom, true);

  try {
    await source.play();
  } catch (error) {
    // Rollback on error
    set(isPlayingAtom, wasPlaying);
    console.error("Failed to play:", error);
    throw error;
  }
});

export const pauseAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  const source = get(currentMusicSourceAtom);

  set(isPlayingAtom, false);

  try {
    await source.pause();
  } catch (error) {
    // Rollback on error
    set(isPlayingAtom, wasPlaying);
    console.error("Failed to pause:", error);
    throw error;
  }
});

export const seekAtom = atom(null, async (get, set, time: number) => {
  const previousTime = get(currentTimeAtom);
  const source = get(currentMusicSourceAtom);

  set(currentTimeAtom, time);
  set(isUserSeekingAtom, true);

  try {
    await source.seek(time);
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

// Server sync atom using music source
export const syncFromSourceAtom = atom(null, (get, set, sourceData: Song) => {
  const canUpdate = get(canUpdateFromServerAtom);

  if (canUpdate) {
    set(currentTimeAtom, sourceData.currentTime || 0);
    set(durationAtom, sourceData.duration || 0);
    set(isPlayingAtom, sourceData.isPlaying || false);
    set(songNameAtom, sourceData.name);
    set(artistAtom, sourceData.artist);
    set(albumAtom, sourceData.album);
  }
});

// Fetch song data from current source
export const fetchSongDataAtom = atom(async (get) => {
  const source = get(currentMusicSourceAtom);
  try {
    return await source.getSong();
  } catch (error) {
    console.error("Failed to fetch song data:", error);
    throw error;
  }
});
