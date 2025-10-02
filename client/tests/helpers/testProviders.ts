/**
 * Test-specific provider implementations
 *
 * These providers are designed specifically for testing and provide controlled,
 * predictable data for both unit and E2E tests.
 */

import type { Player, LyricsProvider, ArtworkProvider } from "@/types";

/**
 * Mock LRC lyrics data for Bohemian Rhapsody - centralized for all tests
 */
export const BOHEMIAN_RHAPSODY_LRC = `[00:00.00]Is this the real life?
[00:15.00]Is this just fantasy?
[00:30.00]Caught in a landslide
[00:45.00]No escape from reality
[01:00.00]Open your eyes
[01:15.00]Look up to the skies and see
[01:30.00]I'm just a poor boy, I need no sympathy
[01:45.00]Because I'm easy come, easy go
[02:00.00]Little high, little low
[02:15.00]Any way the wind blows, doesn't really matter to me
[02:30.00]To me`;

/**
 * Test lyrics provider that only returns lyrics for Bohemian Rhapsody
 */
export class TestLyricsProvider implements LyricsProvider {
  constructor(
    private id: string,
    private name: string,
  ) {}

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
}

/**
 * Test artwork provider that returns no artwork but is available
 */
export class TestArtworkProvider implements ArtworkProvider {
  constructor(
    private id: string,
    private name: string,
  ) {}

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
 */
export class TestPlayer implements Player {
  private state = {
    currentTime: 0,
    isPlaying: false,
    startTime: 0,
  };

  constructor(
    private id: string,
    private name: string,
  ) {}

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
    // Simulate time progression when playing
    if (this.state.isPlaying) {
      const now = Date.now();
      const elapsed = (now - this.state.startTime) / 1000;
      this.state.currentTime = Math.min(elapsed, 355); // Cap at song duration
    }

    return {
      name: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 355,
      currentTime: this.state.currentTime,
      isPlaying: this.state.isPlaying,
    };
  }

  async play(): Promise<void> {
    this.state.isPlaying = true;
    // Resume from current position
    this.state.startTime = Date.now() - this.state.currentTime * 1000;
  }

  async pause(): Promise<void> {
    // Update currentTime before pausing
    if (this.state.isPlaying) {
      const now = Date.now();
      const elapsed = (now - this.state.startTime) / 1000;
      this.state.currentTime = Math.min(elapsed, 355);
    }
    this.state.isPlaying = false;
  }

  async seek(time: number): Promise<void> {
    // Clamp time to valid range [0, duration]
    this.state.currentTime = Math.max(0, Math.min(time, 355));

    // If playing, update startTime to maintain continuity
    if (this.state.isPlaying) {
      this.state.startTime = Date.now() - this.state.currentTime * 1000;
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
  }
}
