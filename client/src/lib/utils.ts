import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const parseLRC = (lrcContent: string) => {
  if (!lrcContent) {
    return [];
  }

  const lines = lrcContent
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);
      if (match) {
        const [, minutes, seconds, hundredths, text] = match;
        const time =
          parseInt(minutes) * 60 +
          parseInt(seconds) +
          parseInt(hundredths) / (hundredths.length === 3 ? 1000 : 100);
        return { time, text: text.trim() };
      }
      return null;
    })
    .filter(Boolean) as Array<{ time: number; text: string }>;

  return lines.map(({ time, text }) => ({
    time,
    text,
  }));
};
