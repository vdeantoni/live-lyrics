import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Song } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Compare two songs for equality based on name, artist, and album
 * Works with both Song and PlaylistSong types
 * @param song1 First song to compare
 * @param song2 Second song to compare
 * @returns true if name, artist, and album all match
 */
export const isSongEqual = (
  song1: Pick<Song, "name" | "artist" | "album">,
  song2: Pick<Song, "name" | "artist" | "album">,
): boolean => {
  return (
    song1.name === song2.name &&
    song1.artist === song2.artist &&
    song1.album === song2.album
  );
};
