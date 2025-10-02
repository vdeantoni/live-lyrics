/**
 * Test-specific provider implementations
 *
 * These providers are designed specifically for testing and provide controlled,
 * predictable data for both unit and E2E tests.
 */

import type { Player, LyricsProvider, ArtworkProvider } from "@/types";

/**
 * Mock lyrics data for Bohemian Rhapsody - centralized for all tests
 * Provides different formats for testing various lyrics display scenarios
 */

/** Enhanced LRC format with word-level timing */
export const BOHEMIAN_RHAPSODY_ENHANCED_LRC = `[00:00.00]<00:00.00>Is <00:00.30>this <00:00.50>the <00:00.80>real <00:01.20>life?
[00:02.00]<00:02.00>Is <00:02.30>this <00:02.50>just <00:02.90>fantasy?
[00:04.00]<00:04.00>Caught <00:04.40>in <00:04.60>a <00:04.80>landslide
[00:06.00]<00:06.00>No <00:06.40>escape <00:06.90>from <00:07.20>reality
[00:08.00]<00:08.00>Open <00:08.40>your <00:08.70>eyes
[00:10.00]<00:10.00>Look <00:10.30>up <00:10.50>to <00:10.70>the <00:10.90>skies <00:11.30>and <00:11.50>see
[00:13.00]<00:13.00>I'm <00:13.20>just <00:13.50>a <00:13.70>poor <00:14.10>boy, <00:14.50>I <00:14.70>need <00:15.00>no <00:15.30>sympathy
[00:17.00]<00:17.00>Because <00:17.50>I'm <00:17.80>easy <00:18.20>come, <00:18.60>easy <00:19.00>go
[00:20.00]<00:20.00>Little <00:20.40>high, <00:20.80>little <00:21.20>low
[00:22.00]<00:22.00>Any <00:22.30>way <00:22.60>the <00:22.80>wind <00:23.20>blows, <00:23.70>doesn't <00:24.20>really <00:24.70>matter <00:25.20>to <00:25.50>me
[00:27.00]<00:27.00>To <00:27.50>me`;

/** Standard LRC format with line-level timing only */
export const BOHEMIAN_RHAPSODY_NORMAL_LRC = `[00:00.00]Is this the real life?
[00:02.00]Is this just fantasy?
[00:04.00]Caught in a landslide
[00:06.00]No escape from reality
[00:08.00]Open your eyes
[00:10.00]Look up to the skies and see
[00:13.00]I'm just a poor boy, I need no sympathy
[00:17.00]Because I'm easy come, easy go
[00:20.00]Little high, little low
[00:22.00]Any way the wind blows, doesn't really matter to me
[00:27.00]To me`;

/** Plain text format with no timing information */
export const BOHEMIAN_RHAPSODY_PLAIN_TEXT = `Is this the real life?
Is this just fantasy?
Caught in a landslide
No escape from reality
Open your eyes
Look up to the skies and see
I'm just a poor boy, I need no sympathy
Because I'm easy come, easy go
Little high, little low
Any way the wind blows, doesn't really matter to me
To me`;

/** Default export for backward compatibility */
export const BOHEMIAN_RHAPSODY_LRC = BOHEMIAN_RHAPSODY_ENHANCED_LRC;

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
