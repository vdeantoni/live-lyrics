import { atom } from "jotai";
import type { Song } from "@/lib/api";

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

// Action atoms for player controls
export const playAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  set(isPlayingAtom, true);

  try {
    const response = await fetch("http://127.0.0.1:4000/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    });

    if (!response.ok) {
      throw new Error("Failed to play");
    }
  } catch (error) {
    // Rollback on error
    set(isPlayingAtom, wasPlaying);
    console.error("Failed to play:", error);
  }
});

export const pauseAtom = atom(null, async (get, set) => {
  const wasPlaying = get(isPlayingAtom);
  set(isPlayingAtom, false);

  try {
    const response = await fetch("http://127.0.0.1:4000/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" }),
    });

    if (!response.ok) {
      throw new Error("Failed to pause");
    }
  } catch (error) {
    // Rollback on error
    set(isPlayingAtom, wasPlaying);
    console.error("Failed to pause:", error);
  }
});

export const seekAtom = atom(null, async (get, set, time: number) => {
  const previousTime = get(currentTimeAtom);
  set(currentTimeAtom, time);
  set(isUserSeekingAtom, true);

  try {
    const response = await fetch("http://127.0.0.1:4000/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seek", time }),
    });

    if (!response.ok) {
      throw new Error("Failed to seek");
    }
  } catch (error) {
    // Rollback on error
    set(currentTimeAtom, previousTime);
    console.error("Failed to seek:", error);
  } finally {
    // Clear seeking state after a delay
    setTimeout(() => set(isUserSeekingAtom, false), 1000);
  }
});

// Server sync atom
export const syncFromServerAtom = atom(null, (get, set, serverData: Song) => {
  const canUpdate = get(canUpdateFromServerAtom);

  if (canUpdate) {
    set(currentTimeAtom, serverData.currentTime || 0);
    set(durationAtom, serverData.duration || 0);
    set(isPlayingAtom, serverData.isPlaying || false);
    set(songNameAtom, serverData.name);
    set(artistAtom, serverData.artist);
    set(albumAtom, serverData.album);
  }
});
