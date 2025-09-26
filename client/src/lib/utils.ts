import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Liricle from "liricle";
import type { LyricsData } from "@/lib/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const parseLRC = async (lrcContent: string): Promise<LyricsData> => {
  if (!lrcContent) {
    return { tags: {}, lines: [], enhanced: false };
  }

  const liricle = new Liricle();

  return new Promise((resolve, reject) => {
    liricle.on("load", (data) => {
      resolve(data);
    });

    liricle.on("loaderror", (error: Error) => {
      reject(error);
    });

    liricle.load({ text: lrcContent });
  });
};
