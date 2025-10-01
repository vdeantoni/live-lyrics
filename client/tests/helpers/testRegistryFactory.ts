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

// Re-export test data for consistency
export { BOHEMIAN_RHAPSODY_LRC } from "./testProviders";
