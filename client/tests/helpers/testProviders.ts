/**
 * Test-specific provider implementations
 *
 * These providers are designed specifically for testing and provide controlled,
 * predictable data for both unit and E2E tests.
 */

import type {
  Player,
  LyricsProvider,
  ArtworkProvider,
  Song,
  PlayerSettings,
} from "@/types";
import {
  BOHEMIAN_RHAPSODY_ENHANCED_LRC,
  BOHEMIAN_RHAPSODY_NORMAL_LRC,
  BOHEMIAN_RHAPSODY_PLAIN_TEXT,
  BOHEMIAN_RHAPSODY_LRC,
} from "./testData";

/**
 * Helper function to get lyrics content based on format type
 * Used by both unit and E2E tests for consistent test data
 */
export const getLyricsForFormat = (format: string): string => {
  switch (format) {
    case "enhanced":
      return BOHEMIAN_RHAPSODY_ENHANCED_LRC;
    case "normal":
      return BOHEMIAN_RHAPSODY_NORMAL_LRC;
    case "plain":
      return BOHEMIAN_RHAPSODY_PLAIN_TEXT;
    default:
      return BOHEMIAN_RHAPSODY_ENHANCED_LRC;
  }
};

/**
 * Test lyrics provider that only returns lyrics for Bohemian Rhapsody
 */
export class TestLyricsProvider implements LyricsProvider {
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return `${this.name} test provider`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async isFetching(): Promise<boolean> {
    return false;
  }

  async supportsLyrics(song: {
    name: string;
    artist: string;
    album?: string;
  }): Promise<boolean> {
    // Support Bohemian Rhapsody only for testing
    return song.name === "Bohemian Rhapsody" && song.artist === "Queen";
  }

  async getLyrics(song: {
    name: string;
    artist: string;
    album?: string;
  }): Promise<string | null> {
    // Only return lyrics for "Bohemian Rhapsody" by "Queen" (exact match)
    if (song.name === "Bohemian Rhapsody" && song.artist === "Queen") {
      return BOHEMIAN_RHAPSODY_LRC;
    }
    // Return null for all other songs (no lyrics found)
    return null;
  }

  async search(): Promise<
    Array<{
      id: string;
      trackName: string;
      artistName: string;
      albumName: string;
      duration: number;
    }>
  > {
    // Test provider doesn't support search - return empty array
    return [];
  }
}

/**
 * Test artwork provider that returns no artwork but is available
 */
export class TestArtworkProvider implements ArtworkProvider {
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return `${this.name} test provider`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async isFetching(): Promise<boolean> {
    return false;
  }

  async getArtwork(): Promise<string[]> {
    // Return empty array - no artwork available
    return [];
  }
}

/**
 * Test player provider with stateful playback simulation
 * Tracks play/pause/seek state and simulates time progression
 * Implements queue-based architecture for testing
 */
export class TestPlayer implements Player {
  private state = {
    currentTime: 0,
    isPlaying: false,
    startTime: 0,
  };

  // Queue system for testing
  private currentSong: Song | null = {
    name: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 355,
    currentTime: 0,
    isPlaying: false,
  };
  private queue: Song[] = [];
  private history: Song[] = [];
  private settings: PlayerSettings = { playOnAdd: false, timeOffsetInMs: 0 };

  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return `${this.name} test player`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getSong() {
    // Handle null current song
    if (!this.currentSong) {
      return {
        name: "",
        artist: "",
        album: "",
        duration: 0,
        currentTime: 0,
        isPlaying: false,
      };
    }

    // Simulate time progression when playing
    if (this.state.isPlaying) {
      const now = Date.now();
      const elapsed = (now - this.state.startTime) / 1000;
      this.state.currentTime = Math.min(elapsed, this.currentSong.duration);
    }

    return {
      ...this.currentSong,
      currentTime: this.state.currentTime,
      isPlaying: this.state.isPlaying,
    };
  }

  async play(): Promise<void> {
    if (!this.currentSong) return;

    this.state.isPlaying = true;
    // Resume from current position
    this.state.startTime = Date.now() - this.state.currentTime * 1000;
  }

  async pause(): Promise<void> {
    // Update currentTime before pausing
    if (this.state.isPlaying && this.currentSong) {
      const now = Date.now();
      const elapsed = (now - this.state.startTime) / 1000;
      this.state.currentTime = Math.min(elapsed, this.currentSong.duration);
    }
    this.state.isPlaying = false;
  }

  async seek(time: number): Promise<void> {
    if (!this.currentSong) return;

    // Clamp time to valid range [0, duration]
    this.state.currentTime = Math.max(
      0,
      Math.min(time, this.currentSong.duration),
    );

    // If playing, update startTime to maintain continuity
    if (this.state.isPlaying) {
      this.state.startTime = Date.now() - this.state.currentTime * 1000;
    }
  }

  async next(): Promise<void> {
    // Handle null current song
    if (!this.currentSong) {
      if (this.queue.length > 0) {
        this.shiftQueueToCurrentSong();
      }
      return;
    }

    // If queue has songs, shift to current
    if (this.queue.length > 0) {
      this.shiftQueueToCurrentSong();
    } else {
      // No queue: clear current and stop
      this.history.push(this.currentSong);
      this.currentSong = null;
      this.state.currentTime = 0;
      this.state.isPlaying = false;
    }
  }

  async previous(): Promise<void> {
    // If more than 3 seconds, restart current song
    if (this.state.currentTime > 3) {
      this.state.currentTime = 0;
      this.state.startTime = Date.now();
      return;
    }

    // Otherwise, pop from history
    if (this.history.length > 0) {
      if (this.currentSong) {
        this.queue.unshift(this.currentSong);
      }
      const previousSong = this.history.pop();
      if (previousSong) {
        this.currentSong = previousSong;
        this.state.currentTime = 0;
        this.state.startTime = Date.now();
      }
    } else if (this.currentSong) {
      // No history: restart current song
      this.state.currentTime = 0;
      this.state.startTime = Date.now();
    }
  }

  async add(...songs: Song[]): Promise<void> {
    if (songs.length === 0) return;

    // Insert songs at beginning of queue
    this.queue.unshift(...songs);

    // If no current song, shift first to current
    if (!this.currentSong && this.queue.length > 0) {
      this.shiftQueueToCurrentSong();
    }

    // Auto-play if playOnAdd is enabled
    if (this.settings.playOnAdd && this.currentSong) {
      await this.play();
    }
  }

  async getQueue(): Promise<Song[]> {
    return [...this.queue];
  }

  async getHistory(): Promise<Song[]> {
    return [...this.history];
  }

  async clear(): Promise<void> {
    this.queue = [];
    this.currentSong = null;
    this.state.currentTime = 0;
    this.state.isPlaying = false;
  }

  async getSettings(): Promise<PlayerSettings> {
    return { ...this.settings };
  }

  async setSettings(settings: Partial<PlayerSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
  }

  async setQueue(songs: Song[]): Promise<void> {
    this.queue = [...songs];
  }

  async clearHistory(): Promise<void> {
    this.history = [];
  }

  private shiftQueueToCurrentSong(): void {
    // Move current to history
    if (this.currentSong) {
      this.history.push(this.currentSong);
    }

    // Shift first song from queue to current
    const nextSong = this.queue.shift();
    if (nextSong) {
      this.currentSong = nextSong;
      this.state.currentTime = 0;
      this.state.startTime = Date.now();
    }
  }

  /**
   * Test helper: Reset player to initial state
   * Useful for resetting between tests
   */
  reset(): void {
    this.state = {
      currentTime: 0,
      isPlaying: false,
      startTime: 0,
    };
    this.currentSong = {
      name: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 355,
      currentTime: 0,
      isPlaying: false,
    };
    this.queue = [];
    this.history = [];
    this.settings = { playOnAdd: false, timeOffsetInMs: 0 };
  }
}
