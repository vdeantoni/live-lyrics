import { describe, it, expect, vi, beforeEach } from "vitest";
import { LrclibLyricsProvider } from "@/services/lrclibLyricsProvider";
import type { Song } from "@/types";

// Mock fetch globally
const mockFetch = vi.fn() as ReturnType<typeof vi.fn>;
global.fetch = mockFetch;

describe("LrclibLyricsProvider", () => {
  let provider: LrclibLyricsProvider;
  const mockSong: Song = {
    name: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    currentTime: 0,
    duration: 200,
    isPlaying: false,
  };

  beforeEach(() => {
    provider = new LrclibLyricsProvider();
    vi.clearAllMocks();
  });

  describe("getLyrics", () => {
    it("should return synced lyrics when available", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: "Plain lyrics text",
          syncedLyrics:
            "[00:10.00]Synced lyrics with timestamps\n[00:15.00]Second line",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(
        "[00:10.00]Synced lyrics with timestamps\n[00:15.00]Second line",
      );
      expect(fetch).toHaveBeenCalledWith(
        "https://lrclib.net/api/search?track_name=Test+Song&artist_name=Test+Artist&album_name=Test+Album",
      );
    });

    it("should fall back to plain lyrics when no synced lyrics available", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: "Plain lyrics text without timestamps",
          syncedLyrics: null,
        },
        {
          id: 2,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: "Another plain lyrics version",
          syncedLyrics: "", // Empty string should be treated as no synced lyrics
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe("Plain lyrics text without timestamps");
    });

    it("should prefer synced lyrics over plain lyrics from multiple tracks", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: "Plain lyrics from first track",
          syncedLyrics: null,
        },
        {
          id: 2,
          trackName: "Test Song (Remastered)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: "Plain lyrics from second track",
          syncedLyrics: "[00:10.00]Synced lyrics from second track",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe("[00:10.00]Synced lyrics from second track");
    });

    it("should return null when no lyrics are available", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: true,
          plainLyrics: null,
          syncedLyrics: null,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBeNull();
    });

    it("should return null when no tracks are found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBeNull();
    });

    it("should return null when API request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBeNull();
    });

    it("should return null when fetch throws an error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await provider.getLyrics(mockSong);

      expect(result).toBeNull();
    });

    it("should return null when song has no name or artist", async () => {
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
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle missing album parameter", async () => {
      const songWithoutAlbum: Song = {
        name: "Test Song",
        artist: "Test Artist",
        album: "",
        currentTime: 0,
        duration: 200,
        isPlaying: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await provider.getLyrics(songWithoutAlbum);

      expect(fetch).toHaveBeenCalledWith(
        "https://lrclib.net/api/search?track_name=Test+Song&artist_name=Test+Artist",
      );
    });
  });

  describe("Enhanced Selection Algorithm", () => {
    it("should prefer Enhanced LRC over regular LRC", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Regular LRC line\n[00:15.00]Another line",
        },
        {
          id: 2,
          trackName: "Test Song (Enhanced)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics:
            "[00:10.00]Enhanced <00:10.50>word <00:11.00>timing\n[00:15.00]More precise timing",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(
        "[00:10.00]Enhanced <00:10.50>word <00:11.00>timing\n[00:15.00]More precise timing",
      );
    });

    it("should prefer regular LRC over plain text", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: "Plain lyrics without timestamps",
          syncedLyrics: null,
        },
        {
          id: 2,
          trackName: "Test Song (With LRC)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Regular LRC line\n[00:15.00]Another line",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe("[00:10.00]Regular LRC line\n[00:15.00]Another line");
    });

    it("should choose closest duration match when same lyrics type", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song (Far Duration)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 300, // 100 seconds difference from mockSong (200)
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Far duration lyrics",
        },
        {
          id: 2,
          trackName: "Test Song (Close Duration)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 195, // 5 seconds difference from mockSong (200)
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Close duration lyrics",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe("[00:10.00]Close duration lyrics");
    });

    it("should choose track with more lines when duration is tied", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Test Song (Few Lines)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200, // Exact match
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Only one line",
        },
        {
          id: 2,
          trackName: "Test Song (Many Lines)",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200, // Exact match
          instrumental: false,
          plainLyrics: null,
          syncedLyrics:
            "[00:10.00]First line\n[00:15.00]Second line\n[00:20.00]Third line",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(
        "[00:10.00]First line\n[00:15.00]Second line\n[00:20.00]Third line",
      );
    });

    it("should handle mixed lyrics types with proper prioritization", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Plain Text Track",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 190, // Closest to 200
          instrumental: false,
          plainLyrics: "Just plain text lyrics",
          syncedLyrics: null,
        },
        {
          id: 2,
          trackName: "Regular LRC Track",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 250, // Further from 200
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Regular LRC lyrics",
        },
        {
          id: 3,
          trackName: "Enhanced LRC Track",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 300, // Furthest from 200
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Enhanced <00:10.50>lyrics",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      // Should choose Enhanced LRC despite worse duration match
      expect(result).toBe("[00:10.00]Enhanced <00:10.50>lyrics");
    });

    it("should detect Enhanced LRC with multiple timestamps per line", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Regular LRC",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Regular line\n[00:15.00]Another line",
        },
        {
          id: 2,
          trackName: "Enhanced LRC",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics:
            "[00:10.00]First part [00:12.00]Second part\n[00:15.00]Another line",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe(
        "[00:10.00]First part [00:12.00]Second part\n[00:15.00]Another line",
      );
    });

    it("should ignore tracks with only empty lyrics", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Empty Track",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 190, // Closer duration
          instrumental: false,
          plainLyrics: "",
          syncedLyrics: "   ", // Only whitespace
        },
        {
          id: 2,
          trackName: "Valid Track",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 250, // Further duration
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Valid lyrics",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      expect(result).toBe("[00:10.00]Valid lyrics");
    });

    it("should count lyrics lines correctly excluding metadata", async () => {
      const mockTracks = [
        {
          id: 1,
          trackName: "Track with Metadata",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics:
            "[ar:Test Artist]\n[ti:Test Song]\n[00:10.00]Actual lyric line\n[00:15.00]Another lyric line",
        },
        {
          id: 2,
          trackName: "Track without Metadata",
          artistName: "Test Artist",
          albumName: "Test Album",
          duration: 200,
          instrumental: false,
          plainLyrics: null,
          syncedLyrics: "[00:10.00]Only one lyric line",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTracks),
      });

      const result = await provider.getLyrics(mockSong);

      // Should choose the track with more actual lyric lines (2 vs 1)
      expect(result).toBe(
        "[ar:Test Artist]\n[ti:Test Song]\n[00:10.00]Actual lyric line\n[00:15.00]Another lyric line",
      );
    });
  });

  describe("supportsLyrics", () => {
    it("should return true when song has name and artist", async () => {
      const result = await provider.supportsLyrics(mockSong);
      expect(result).toBe(true);
    });

    it("should return false when song has no name", async () => {
      const result = await provider.supportsLyrics({
        ...mockSong,
        name: "",
      });
      expect(result).toBe(false);
    });

    it("should return false when song has no artist", async () => {
      const result = await provider.supportsLyrics({
        ...mockSong,
        artist: "",
      });
      expect(result).toBe(false);
    });
  });

  describe("isAvailable", () => {
    it("should return true when API responds successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it("should return true when API returns 404 (means API is working)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it("should return false when API is unreachable", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe("provider info", () => {
    it("should return correct provider information", () => {
      expect(provider.getId()).toBe("lrclib");
      expect(provider.getName()).toBe("LrcLib");
      expect(provider.getDescription()).toBe(
        "Community-driven lyrics database with synchronized lyrics support",
      );
    });
  });

  describe("isFetching", () => {
    it("should return false initially", async () => {
      const result = await provider.isFetching();
      expect(result).toBe(false);
    });

    it("should return true during fetch and false after completion", async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: () => Promise.resolve([]) }),
              100,
            ),
          ),
      );

      const lyricsPromise = provider.getLyrics(mockSong);

      // Should be fetching during the request
      expect(await provider.isFetching()).toBe(true);

      // Wait for completion
      await lyricsPromise;

      // Should not be fetching after completion
      expect(await provider.isFetching()).toBe(false);
    });
  });
});
