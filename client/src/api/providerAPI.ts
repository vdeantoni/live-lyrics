/**
 * Provider Management API for Live Lyrics Application
 *
 * This module provides a comprehensive API for managing music providers (lyrics, artwork, players)
 * using Jotai atoms. It supports both runtime customization and testing scenarios:
 *
 * 1. Full provider registry replacement (ideal for tests)
 * 2. Individual provider add/remove operations (lightweight modifications)
 * 3. Utility functions for checking provider state
 *
 * All operations work with the reactive Jotai atom system, ensuring UI updates
 * automatically when providers change.
 */

import type { Player, LyricsProvider, ArtworkProvider } from "@/types";
import type { ProviderConfig, AppProviders } from "@/types/appState";
import { BUILTIN_PROVIDER_CONFIGS } from "@/config/providers";
import { getDefaultStore } from "jotai";
import {
  appProvidersAtom,
  updateProvidersAtom,
  replaceProvidersAtom,
  resetProviderSettingsAtom,
} from "@/atoms/appState";

// Get the global Jotai store for provider state management
const store = getDefaultStore();

/**
 * Main Provider Management API
 *
 * This API provides methods to manage all types of providers (lyrics, artwork, players)
 * in the Live Lyrics application. All operations are reactive through Jotai atoms.
 */
export const providerAPI = {
  /**
   * FULL FLEXIBILITY: Replace entire registry with custom providers
   * Perfect for tests that need complete control
   *
   * @example
   * ```typescript
   * providerRegistryAPI.replaceAll({
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
    const newProviders: AppProviders = {
      players: providers.players || [],
      lyrics: providers.lyricsProviders || [],
      artwork: providers.artworkProviders || [],
    };

    // Replace the entire provider registry using the unified atom
    store.set(replaceProvidersAtom, newProviders);

    // Clear all user overrides to ensure clean test state
    store.set(resetProviderSettingsAtom);
  },

  /**
   * LIGHTWEIGHT: Add individual providers to existing registry
   * Perfect for extending functionality without replacing everything
   */
  add: {
    lyricsProvider: (config: ProviderConfig<LyricsProvider>) => {
      const currentProviders = store.get(appProvidersAtom);
      const updatedLyrics = [...currentProviders.lyrics, config];
      store.set(updateProvidersAtom, { lyrics: updatedLyrics });
    },
    artworkProvider: (config: ProviderConfig<ArtworkProvider>) => {
      const currentProviders = store.get(appProvidersAtom);
      const updatedArtwork = [...currentProviders.artwork, config];
      store.set(updateProvidersAtom, { artwork: updatedArtwork });
    },
    player: (config: ProviderConfig<Player>) => {
      const currentProviders = store.get(appProvidersAtom);
      const updatedPlayers = [...currentProviders.players, config];
      store.set(updateProvidersAtom, { players: updatedPlayers });
    },
  },

  /**
   * LIGHTWEIGHT: Remove individual providers from registry
   * Perfect for disabling specific providers in tests
   */
  remove: {
    lyricsProvider: (id: string) => {
      const currentProviders = store.get(appProvidersAtom);
      const updatedLyrics = currentProviders.lyrics.filter((p) => p.id !== id);
      store.set(updateProvidersAtom, { lyrics: updatedLyrics });
      return true; // Return boolean for backwards compatibility
    },
    artworkProvider: (id: string) => {
      const currentProviders = store.get(appProvidersAtom);
      const updatedArtwork = currentProviders.artwork.filter(
        (p) => p.id !== id,
      );
      store.set(updateProvidersAtom, { artwork: updatedArtwork });
      return true;
    },
    player: (id: string) => {
      const currentProviders = store.get(appProvidersAtom);
      const updatedPlayers = currentProviders.players.filter(
        (p) => p.id !== id,
      );
      store.set(updateProvidersAtom, { players: updatedPlayers });
      return true;
    },
  },

  /**
   * UTILITY: Check if providers exist
   */
  has: {
    lyricsProvider: (id: string) => {
      const providers = store.get(appProvidersAtom);
      return providers.lyrics.some((p) => p.id === id);
    },
    artworkProvider: (id: string) => {
      const providers = store.get(appProvidersAtom);
      return providers.artwork.some((p) => p.id === id);
    },
    player: (id: string) => {
      const providers = store.get(appProvidersAtom);
      return providers.players.some((p) => p.id === id);
    },
  },

  /**
   * UTILITY: Get all current providers
   */
  getAll: {
    lyricsProviders: () => {
      const providers = store.get(appProvidersAtom);
      return providers.lyrics;
    },
    artworkProviders: () => {
      const providers = store.get(appProvidersAtom);
      return providers.artwork;
    },
    players: () => {
      const providers = store.get(appProvidersAtom);
      return providers.players;
    },
  },

  /**
   * UTILITY: Reset to built-in providers only
   */
  resetToBuiltins: () => {
    // Reset to builtin providers
    const builtinProviders: AppProviders = {
      players: Object.values(BUILTIN_PROVIDER_CONFIGS.players),
      lyrics: Object.values(BUILTIN_PROVIDER_CONFIGS.lyricsProviders),
      artwork: Object.values(BUILTIN_PROVIDER_CONFIGS.artworkProviders),
    };

    store.set(replaceProvidersAtom, builtinProviders);

    // Clear all user overrides
    store.set(resetProviderSettingsAtom);
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
 * Backward compatibility alias for existing code
 * This maintains the same API surface without deprecation warnings
 */
export const providerRegistryAPI = providerAPI;

/**
 * Re-export types for convenience
 */
export type { Player, LyricsProvider, ArtworkProvider, Song } from "@/types";
export type { ProviderConfig } from "@/types/appState";
