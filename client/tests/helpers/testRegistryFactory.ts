/**
 * Test provider factory functions for testing
 *
 * These functions create mock implementations of providers that can be used
 * in both unit tests and E2E tests with the new Jotai-based system.
 *
 * Test Data Configuration:
 * - Players: Local player only (returns Bohemian Rhapsody)
 * - Lyrics: Test provider that only returns lyrics for Bohemian Rhapsody
 * - Artwork: Test provider that returns no artwork but is available
 */

import type { LyricsProvider, ArtworkProvider, Player } from "@/types";
import type { ProviderConfig } from "@/config/providers";
import {
  TestLyricsProvider,
  TestArtworkProvider,
  TestPlayer,
} from "./testProviders";

/**
 * Create test provider configurations for Jotai atoms
 * These match the structure expected by the app but provide controlled test data
 */
export const createTestProviderConfigs = (): {
  lyricsProviders: ProviderConfig<LyricsProvider>[];
  artworkProviders: ProviderConfig<ArtworkProvider>[];
  players: ProviderConfig<Player>[];
} => ({
  lyricsProviders: [
    {
      id: "test-lyrics",
      name: "Test Lyrics",
      description: "Test lyrics provider (Bohemian Rhapsody only)",
      load: async () => new TestLyricsProvider("test-lyrics", "Test Lyrics"),
    },
  ],
  artworkProviders: [
    {
      id: "test-artwork",
      name: "Test Artwork",
      description: "Test artwork provider (no artwork)",
      load: async () => new TestArtworkProvider("test-artwork", "Test Artwork"),
    },
  ],
  players: [
    {
      id: "local",
      name: "Local",
      description: "Local test player",
      load: async () => new TestPlayer("local", "Local"),
    },
  ],
});

/**
 * Test scenario factory functions for different test cases
 * These provide pre-configured provider setups for common testing scenarios
 */
export const testScenarios = {
  /**
   * Default scenario: All providers available and enabled
   * Use for happy-path testing
   */
  default: createTestProviderConfigs,

  /**
   * No lyrics available: All lyrics providers unavailable
   * Use for testing error handling and fallback behavior
   */
  noLyrics: (): {
    lyricsProviders: ProviderConfig<LyricsProvider>[];
    artworkProviders: ProviderConfig<ArtworkProvider>[];
    players: ProviderConfig<Player>[];
  } => ({
    lyricsProviders: [],
    artworkProviders: [
      {
        id: "test-artwork",
        name: "Test Artwork",
        description: "Test artwork provider (no artwork)",
        load: async () =>
          new TestArtworkProvider("test-artwork", "Test Artwork"),
      },
    ],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local test player",
        load: async () => new TestPlayer("local", "Local"),
      },
    ],
  }),

  /**
   * No artwork available: All artwork providers unavailable
   * Use for testing artwork fallback and placeholder behavior
   */
  noArtwork: (): {
    lyricsProviders: ProviderConfig<LyricsProvider>[];
    artworkProviders: ProviderConfig<ArtworkProvider>[];
    players: ProviderConfig<Player>[];
  } => ({
    lyricsProviders: [
      {
        id: "test-lyrics",
        name: "Test Lyrics",
        description: "Test lyrics provider (Bohemian Rhapsody only)",
        load: async () => new TestLyricsProvider("test-lyrics", "Test Lyrics"),
      },
    ],
    artworkProviders: [],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local test player",
        load: async () => new TestPlayer("local", "Local"),
      },
    ],
  }),

  /**
   * No player available: Player is unavailable
   * Use for testing error states when music source is offline
   */
  noPlayer: (): {
    lyricsProviders: ProviderConfig<LyricsProvider>[];
    artworkProviders: ProviderConfig<ArtworkProvider>[];
    players: ProviderConfig<Player>[];
  } => ({
    lyricsProviders: [
      {
        id: "test-lyrics",
        name: "Test Lyrics",
        description: "Test lyrics provider (Bohemian Rhapsody only)",
        load: async () => new TestLyricsProvider("test-lyrics", "Test Lyrics"),
      },
    ],
    artworkProviders: [
      {
        id: "test-artwork",
        name: "Test Artwork",
        description: "Test artwork provider (no artwork)",
        load: async () =>
          new TestArtworkProvider("test-artwork", "Test Artwork"),
      },
    ],
    players: [],
  }),

  /**
   * Multiple lyrics providers: Simulates provider priority/fallback
   * Use for testing provider selection and fallback logic
   */
  multipleLyricsProviders: (): {
    lyricsProviders: ProviderConfig<LyricsProvider>[];
    artworkProviders: ProviderConfig<ArtworkProvider>[];
    players: ProviderConfig<Player>[];
  } => ({
    lyricsProviders: [
      {
        id: "test-lyrics-1",
        name: "Test Lyrics Primary",
        description: "Primary lyrics provider",
        load: async () =>
          new TestLyricsProvider("test-lyrics-1", "Test Lyrics Primary"),
      },
      {
        id: "test-lyrics-2",
        name: "Test Lyrics Secondary",
        description: "Secondary lyrics provider",
        load: async () =>
          new TestLyricsProvider("test-lyrics-2", "Test Lyrics Secondary"),
      },
      {
        id: "test-lyrics-3",
        name: "Test Lyrics Tertiary",
        description: "Tertiary lyrics provider",
        load: async () =>
          new TestLyricsProvider("test-lyrics-3", "Test Lyrics Tertiary"),
      },
    ],
    artworkProviders: [
      {
        id: "test-artwork",
        name: "Test Artwork",
        description: "Test artwork provider (no artwork)",
        load: async () =>
          new TestArtworkProvider("test-artwork", "Test Artwork"),
      },
    ],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local test player",
        load: async () => new TestPlayer("local", "Local"),
      },
    ],
  }),

  /**
   * Minimal setup: Only essential providers
   * Use for fast unit tests that don't need full provider stack
   */
  minimal: (): {
    lyricsProviders: ProviderConfig<LyricsProvider>[];
    artworkProviders: ProviderConfig<ArtworkProvider>[];
    players: ProviderConfig<Player>[];
  } => ({
    lyricsProviders: [
      {
        id: "test-lyrics",
        name: "Test Lyrics",
        description: "Test lyrics provider",
        load: async () => new TestLyricsProvider("test-lyrics", "Test Lyrics"),
      },
    ],
    artworkProviders: [],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local test player",
        load: async () => new TestPlayer("local", "Local"),
      },
    ],
  }),
};

// Re-export test data for consistency
export { BOHEMIAN_RHAPSODY_LRC } from "./testProviders";
