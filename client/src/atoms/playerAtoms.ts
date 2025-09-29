import { atom } from "jotai";
import type { Song, LyricsData, LineData, WordData } from "@/types";
import { currentMusicModeAtom } from "@/atoms/settingsAtoms";

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

// Action atoms for player controls using music mode
export const playAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  const musicMode = get(currentMusicModeAtom);

  if (!musicMode) {
    console.error("No music mode available");
    return;
  }

  set(isPlayingAtom, true);

  try {
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
  const musicMode = get(currentMusicModeAtom);

  if (!musicMode) {
    console.error("No music mode available");
    return;
  }

  set(isPlayingAtom, false);

  try {
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
  const musicMode = get(currentMusicModeAtom);

  if (!musicMode) {
    console.error("No music mode available");
    return;
  }

  set(currentTimeAtom, time);
  set(isUserSeekingAtom, true);

  try {
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

// Fetch song data from current music mode
export const fetchSongDataAtom = atom(async (get) => {
  const musicMode = get(currentMusicModeAtom);
  if (!musicMode) {
    throw new Error("No music mode available");
  }
  try {
    return await musicMode.getSong();
  } catch (error) {
    console.error("Failed to fetch song data:", error);
    throw error;
  }
});
