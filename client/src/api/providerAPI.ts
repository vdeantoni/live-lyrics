/**
 * Provider Management API for Live Lyrics Application
 *
 * This module provides a comprehensive API for managing music providers (lyrics, artwork, players)
 * using the ProviderService event-driven architecture. It supports both runtime customization and testing scenarios:
 *
 * 1. Full provider registry replacement (ideal for tests)
 * 2. Individual provider add/remove operations (lightweight modifications)
 * 3. Utility functions for checking provider state
 *
 * All operations work through the ProviderService which emits events that update Jotai atoms,
 * ensuring UI updates automatically when providers change.
 */

import type { Player, LyricsProvider, ArtworkProvider } from "@/types";
import type { ProviderConfig, AppProviders } from "@/types/appState";
import { providerService } from "@/core/services/ProviderService";
import { settingsService } from "@/core/services/SettingsService";

/**
 * Main Provider Management API
 *
 * This API provides methods to manage all types of providers (lyrics, artwork, players)
 * in the Live Lyrics application. All operations are reactive through the event-driven architecture.
 */
export const providerAPI = {
  /**
   * FULL FLEXIBILITY: Replace entire registry with custom providers
   * Perfect for tests that need complete control
   *
   * @example
   * ```typescript
   * providerAPI.replaceAll({
   *   lyricsProviders: [
   *     {
   *       id: "test-provider",
   *       name: "Test Provider",
   *       description: "Test only",
   *       load: async () => new MyTestProvider()
   *     }
   *   ],
   *   players: [
   *     {
   *       id: "mock-player",
   *       name: "Mock Player",
   *       description: "Mock player for testing",
   *       load: async () => new MockPlayer()
   *     }
   *   ]
   * });
   * ```
   */
  replaceAll: (providers: {
    players?: ProviderConfig<Player>[];
    lyricsProviders?: ProviderConfig<LyricsProvider>[];
    artworkProviders?: ProviderConfig<ArtworkProvider>[];
  }) => {
    // Build the new provider registry structure
    // Use empty arrays for any type not provided to ensure full replacement
    const newProviders: AppProviders = {
      players: providers.players || [],
      lyrics: providers.lyricsProviders || [],
      artwork: providers.artworkProviders || [],
    };

    // Use service to replace providers (emits event)
    providerService.replaceProviders(newProviders);

    // Clear all user overrides to ensure clean test state
    settingsService.clearAllSettings();
  },

  /**
   * LIGHTWEIGHT: Add individual providers to existing registry
   * Perfect for extending functionality without replacing everything
   */
  add: {
    lyricsProvider: (config: ProviderConfig<LyricsProvider>) => {
      providerService.registerProvider("lyrics", config);
    },
    artworkProvider: (config: ProviderConfig<ArtworkProvider>) => {
      providerService.registerProvider("artwork", config);
    },
    player: (config: ProviderConfig<Player>) => {
      providerService.registerProvider("players", config);
    },
  },

  /**
   * LIGHTWEIGHT: Remove individual providers from registry
   * Perfect for disabling specific providers in tests
   */
  remove: {
    lyricsProvider: (id: string) => {
      providerService.unregisterProvider("lyrics", id);
      return true; // Return boolean for backwards compatibility
    },
    artworkProvider: (id: string) => {
      providerService.unregisterProvider("artwork", id);
      return true;
    },
    player: (id: string) => {
      providerService.unregisterProvider("players", id);
      return true;
    },
  },

  /**
   * UTILITY: Check if providers exist
   */
  has: {
    lyricsProvider: (id: string) => {
      const providers = providerService.getProviders();
      return providers.lyrics.some((p) => p.id === id);
    },
    artworkProvider: (id: string) => {
      const providers = providerService.getProviders();
      return providers.artwork.some((p) => p.id === id);
    },
    player: (id: string) => {
      const providers = providerService.getProviders();
      return providers.players.some((p) => p.id === id);
    },
  },

  /**
   * UTILITY: Get all current providers
   */
  getAll: {
    lyricsProviders: () => {
      const providers = providerService.getProviders();
      return providers.lyrics;
    },
    artworkProviders: () => {
      const providers = providerService.getProviders();
      return providers.artwork;
    },
    players: () => {
      const providers = providerService.getProviders();
      return providers.players;
    },
  },

  /**
   * UTILITY: Reset to built-in providers only
   */
  resetToBuiltins: () => {
    // Use service to reset providers (emits event)
    providerService.resetProviders();

    // Clear all user overrides
    settingsService.clearAllSettings();
  },
};

/**
 * Convenience functions for common provider registration patterns
 */

/**
 * Register a lyrics provider with an instance
 */
export const registerLyricsProvider = (
  id: string,
  name: string,
  description: string,
  provider: LyricsProvider,
): void => {
  providerAPI.add.lyricsProvider({
    id,
    name,
    description,
    load: async () => provider,
  });
};

/**
 * Register a lyrics provider with a factory function
 */
export const registerLyricsProviderFactory = (
  id: string,
  name: string,
  description: string,
  factory: () => Promise<LyricsProvider>,
): void => {
  providerAPI.add.lyricsProvider({
    id,
    name,
    description,
    load: factory,
  });
};

/**
 * Register an artwork provider with an instance
 */
export const registerArtworkProvider = (
  id: string,
  name: string,
  description: string,
  provider: ArtworkProvider,
): void => {
  providerAPI.add.artworkProvider({
    id,
    name,
    description,
    load: async () => provider,
  });
};

/**
 * Register an artwork provider with a factory function
 */
export const registerArtworkProviderFactory = (
  id: string,
  name: string,
  description: string,
  factory: () => Promise<ArtworkProvider>,
): void => {
  providerAPI.add.artworkProvider({
    id,
    name,
    description,
    load: factory,
  });
};

/**
 * Register a player with an instance
 */
export const registerPlayer = (
  id: string,
  name: string,
  description: string,
  player: Player,
): void => {
  providerAPI.add.player({
    id,
    name,
    description,
    load: async () => player,
  });
};

/**
 * Register a player with a factory function
 */
export const registerPlayerFactory = (
  id: string,
  name: string,
  description: string,
  factory: () => Promise<Player>,
): void => {
  providerAPI.add.player({
    id,
    name,
    description,
    load: factory,
  });
};

/**
 * Re-export types for convenience
 */
export type { Player, LyricsProvider, ArtworkProvider, Song } from "@/types";
export type { ProviderConfig } from "@/types/appState";
