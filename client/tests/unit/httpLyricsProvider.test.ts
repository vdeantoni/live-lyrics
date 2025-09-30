import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpLyricsProvider } from "@/providers/httpLyricsProvider";
import type { Song } from "@/types";

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to suppress test output noise
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  // Suppress console output during tests
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  // Restore original console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe("HttpLyricsProvider", () => {
  let provider: HttpLyricsProvider;
  const mockSong: Song = {
    name: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    currentTime: 0,
    duration: 355,
    isPlaying: true,
  };

  beforeEach(() => {
    provider = new HttpLyricsProvider();
    vi.clearAllMocks();
  });

  describe("getLyrics", () => {
    it("should return lyrics from local server when available", async () => {
      const mockLyrics = "[00:00.00] Is this the real life?";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockLyrics),
      } as Response);

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(mockLyrics);
      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:4000/lyrics");
    });

    it("should fallback to LrcLib API when local server fails", async () => {
      const mockLrcLibResponse = [
        {
          id: 1,
          trackName: "Bohemian Rhapsody",
          artistName: "Queen",
          albumName: "A Night at the Opera",
          duration: 355,
          instrumental: false,
          syncedLyrics: "[00:00.00] Is this the real life?",
          plainLyrics: "Is this the real life?",
        },
      ];

      // First call (local server) fails
      mockFetch.mockRejectedValueOnce(new Error("Local server unavailable"));

      // Second call (LrcLib) succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLrcLibResponse),
      } as Response);

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(mockLrcLibResponse[0].syncedLyrics);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        "http://127.0.0.1:4000/lyrics",
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("https://lrclib.net/api/search"),
      );
    });

    it("should return null when both sources fail", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await provider.getLyrics(mockSong);

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should prefer synced lyrics over plain lyrics from LrcLib", async () => {
      const mockLrcLibResponse = [
        {
          id: 1,
          trackName: "Bohemian Rhapsody",
          artistName: "Queen",
          albumName: "A Night at the Opera",
          duration: 355,
          instrumental: false,
          syncedLyrics: "[00:00.00] Synced lyrics",
          plainLyrics: "Plain lyrics",
        },
      ];

      mockFetch.mockRejectedValueOnce(new Error("Local server unavailable"));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLrcLibResponse),
      } as Response);

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(mockLrcLibResponse[0].syncedLyrics);
    });

    it("should handle empty song data", async () => {
      const emptySong: Song = {
        name: "",
        artist: "",
        album: "",
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      };

      const result = await provider.getLyrics(emptySong);

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
