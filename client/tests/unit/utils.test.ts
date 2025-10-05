import { describe, it, expect } from "vitest";
import { formatTime, cn, isSongEqual } from "@/lib/utils";
import type { Song } from "@/types";

describe("Utils", () => {
  describe("formatTime", () => {
    it("formats seconds correctly", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(30)).toBe("0:30");
      expect(formatTime(60)).toBe("1:00");
      expect(formatTime(90)).toBe("1:30");
      expect(formatTime(3661)).toBe("61:01");
    });

    it("pads seconds with leading zero", () => {
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(125)).toBe("2:05");
    });

    it("handles edge cases", () => {
      expect(formatTime(NaN)).toBe("0:00");
      expect(formatTime(null as unknown as number)).toBe("0:00");
      expect(formatTime(undefined as unknown as number)).toBe("0:00");
    });

    it("handles large numbers", () => {
      expect(formatTime(7200)).toBe("120:00"); // 2 hours
      expect(formatTime(7261)).toBe("121:01"); // 2 hours 1 minute 1 second
    });
  });

  describe("cn (className utility)", () => {
    it("merges class names correctly", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const isInactive = false;
      expect(cn("base", isActive && "active", isInactive && "inactive")).toBe(
        "base active",
      );
    });

    it("handles Tailwind conflicts", () => {
      // twMerge should resolve conflicts
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn(null, undefined, "")).toBe("");
    });
  });

  describe("isSongEqual", () => {
    const song1: Song = {
      name: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 355,
      currentTime: 0,
      isPlaying: false,
    };

    it("returns true when all fields match", () => {
      const song2: Song = {
        name: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 999, // Different duration shouldn't matter
        currentTime: 100,
        isPlaying: true,
      };
      expect(isSongEqual(song1, song2)).toBe(true);
    });

    it("returns false when name differs", () => {
      const song2: Song = {
        ...song1,
        name: "Another One Bites the Dust",
      };
      expect(isSongEqual(song1, song2)).toBe(false);
    });

    it("returns false when artist differs", () => {
      const song2: Song = {
        ...song1,
        artist: "Led Zeppelin",
      };
      expect(isSongEqual(song1, song2)).toBe(false);
    });

    it("returns false when album differs", () => {
      const song2: Song = {
        ...song1,
        album: "Greatest Hits",
      };
      expect(isSongEqual(song1, song2)).toBe(false);
    });

    it("handles empty strings", () => {
      const song2: Song = {
        name: "",
        artist: "",
        album: "",
        duration: 0,
        currentTime: 0,
        isPlaying: false,
      };
      const song3: Song = { ...song2 };
      expect(isSongEqual(song2, song3)).toBe(true);
    });

    it("is case sensitive", () => {
      const song2: Song = {
        ...song1,
        name: "bohemian rhapsody", // lowercase
      };
      expect(isSongEqual(song1, song2)).toBe(false);
    });

    it("handles whitespace differences", () => {
      const song2: Song = {
        ...song1,
        name: "Bohemian Rhapsody ", // trailing space
      };
      expect(isSongEqual(song1, song2)).toBe(false);
    });
  });
});
