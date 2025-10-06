import { atom } from "jotai";
import type { Song, LyricsData, LineData, WordData } from "@/types";

/**
 * Player state atoms (read-only)
 * These are updated by the event system, not directly by components
 */

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

/**
 * Computed atom: Check if player has no song loaded
 * Returns true when there's no song name (empty player state)
 */
export const isPlayerEmptyAtom = atom((get) => {
  const playerState = get(playerStateAtom);
  return !playerState.name;
});
