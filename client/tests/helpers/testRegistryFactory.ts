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
