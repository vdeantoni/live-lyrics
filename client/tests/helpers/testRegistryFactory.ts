/**
 * Test provider factory functions for testing
 *
 * These functions create mock implementations of providers that can be used
 * in both unit tests and E2E tests with the new Jotai-based system.
 *
 * Test Data Configuration:
 * - Players: Local and Remote players (returns Bohemian Rhapsody)
 * - Lyrics: LrcLib provider that only returns lyrics for Bohemian Rhapsody
 * - Artwork: iTunes provider that returns no artwork but is available
 */

import type { LyricsProvider, ArtworkProvider, Player } from "@/types";
import type { ProviderConfig } from "@/types/appState";
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
      id: "lrclib",
      name: "LrcLib",
      description:
        "Community-driven lyrics database with synchronized lyrics support",
      load: async () => new TestLyricsProvider("lrclib", "LrcLib"),
    },
  ],
  artworkProviders: [
    {
      id: "itunes",
      name: "iTunes",
      description: "Album artwork from iTunes Search API",
      load: async () => new TestArtworkProvider("itunes", "iTunes"),
    },
  ],
  players: [
    {
      id: "local",
      name: "Local",
      description: "Local player",
      load: async () => new TestPlayer("local", "Local"),
    },
    {
      id: "remote",
      name: "Server",
      description: "Remote player",
      load: async () => new TestPlayer("remote", "Server"),
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
        id: "itunes",
        name: "iTunes",
        description: "Album artwork from iTunes Search API",
        load: async () => new TestArtworkProvider("itunes", "iTunes"),
      },
    ],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local player",
        load: async () => new TestPlayer("local", "Local"),
      },
      {
        id: "remote",
        name: "Server",
        description: "Remote player",
        load: async () => new TestPlayer("remote", "Server"),
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
        id: "lrclib",
        name: "LrcLib",
        description:
          "Community-driven lyrics database with synchronized lyrics support",
        load: async () => new TestLyricsProvider("lrclib", "LrcLib"),
      },
    ],
    artworkProviders: [],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local player",
        load: async () => new TestPlayer("local", "Local"),
      },
      {
        id: "remote",
        name: "Server",
        description: "Remote player",
        load: async () => new TestPlayer("remote", "Server"),
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
        id: "lrclib",
        name: "LrcLib",
        description:
          "Community-driven lyrics database with synchronized lyrics support",
        load: async () => new TestLyricsProvider("lrclib", "LrcLib"),
      },
    ],
    artworkProviders: [
      {
        id: "itunes",
        name: "iTunes",
        description: "Album artwork from iTunes Search API",
        load: async () => new TestArtworkProvider("itunes", "iTunes"),
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
        id: "lrclib",
        name: "LrcLib",
        description:
          "Community-driven lyrics database with synchronized lyrics support",
        load: async () => new TestLyricsProvider("lrclib", "LrcLib"),
      },
      {
        id: "local-server",
        name: "Local Server",
        description: "Local server lyrics provider",
        load: async () =>
          new TestLyricsProvider("local-server", "Local Server"),
      },
      {
        id: "simulated",
        name: "Simulated",
        description: "Simulated lyrics provider",
        load: async () => new TestLyricsProvider("simulated", "Simulated"),
      },
    ],
    artworkProviders: [
      {
        id: "itunes",
        name: "iTunes",
        description: "Album artwork from iTunes Search API",
        load: async () => new TestArtworkProvider("itunes", "iTunes"),
      },
    ],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local player",
        load: async () => new TestPlayer("local", "Local"),
      },
      {
        id: "remote",
        name: "Server",
        description: "Remote player",
        load: async () => new TestPlayer("remote", "Server"),
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
        id: "lrclib",
        name: "LrcLib",
        description:
          "Community-driven lyrics database with synchronized lyrics support",
        load: async () => new TestLyricsProvider("lrclib", "LrcLib"),
      },
    ],
    artworkProviders: [],
    players: [
      {
        id: "local",
        name: "Local",
        description: "Local player",
        load: async () => new TestPlayer("local", "Local"),
      },
      {
        id: "remote",
        name: "Server",
        description: "Remote player",
        load: async () => new TestPlayer("remote", "Server"),
      },
    ],
  }),
};

// Re-export test data for consistency
export { BOHEMIAN_RHAPSODY_LRC } from "./testProviders";
