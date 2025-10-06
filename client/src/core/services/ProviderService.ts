import { emit } from "@/core/events/bus";
import type { Player, LyricsProvider, ArtworkProvider } from "@/types";
import type { ProviderConfig, AppProviders } from "@/types/appState";
import { BUILTIN_PROVIDER_CONFIGS } from "@/config/providers";

/**
 * Provider type for provider management
 */
export type ProviderType = "players" | "lyrics" | "artwork";

/**
 * Provider service that handles all provider registry management
 * Emits events instead of updating state directly for decoupling
 *
 * Pattern: Service → Events → Atoms (via useEventSync)
 */
export class ProviderService {
  // In-memory cache of current providers (source of truth)
  private providers: AppProviders;

  constructor() {
    // Initialize with builtin providers
    this.providers = {
      players: Object.values(BUILTIN_PROVIDER_CONFIGS.players),
      lyrics: Object.values(BUILTIN_PROVIDER_CONFIGS.lyricsProviders),
      artwork: Object.values(BUILTIN_PROVIDER_CONFIGS.artworkProviders),
    };
  }

  /**
   * Get current providers (for useEventSync to read from)
   */
  getProviders(): AppProviders {
    return this.providers;
  }

  /**
   * Register a single provider
   * @param type - Provider type (players, lyrics, artwork)
   * @param config - Provider configuration
   */
  registerProvider(
    type: ProviderType,
    config:
      | ProviderConfig<Player>
      | ProviderConfig<LyricsProvider>
      | ProviderConfig<ArtworkProvider>,
  ): void {
    // Check for duplicates
    const exists = this.providers[type].some((p) => p.id === config.id);
    if (exists) {
      console.warn(
        `Provider ${config.id} already exists in ${type}, skipping registration`,
      );
      return;
    }

    // Update in-memory cache
    this.providers = {
      ...this.providers,
      [type]: [...this.providers[type], config as never],
    };

    // Emit event
    emit({
      type: "providers.changed",
      payload: { providerType: type },
    });
  }

  /**
   * Unregister a single provider by ID
   * @param type - Provider type (players, lyrics, artwork)
   * @param providerId - Provider ID to remove
   */
  unregisterProvider(type: ProviderType, providerId: string): void {
    // Check if provider exists
    const exists = this.providers[type].some((p) => p.id === providerId);
    if (!exists) {
      console.warn(
        `Provider ${providerId} not found in ${type}, skipping removal`,
      );
      return;
    }

    // Update in-memory cache
    this.providers = {
      ...this.providers,
      [type]: this.providers[type].filter((p) => p.id !== providerId) as never,
    };

    // Emit event
    emit({
      type: "providers.changed",
      payload: { providerType: type },
    });
  }

  /**
   * Replace entire provider registry (for tests)
   * @param providers - New provider registry (fully replaces current)
   */
  replaceProviders(providers: AppProviders): void {
    // Fully replace providers (no merge)
    this.providers = providers;

    // Emit event (no specific type since multiple types may change)
    emit({
      type: "providers.changed",
      payload: {},
    });
  }

  /**
   * Reset providers to builtins
   */
  resetProviders(): void {
    // Reset to builtin providers
    this.providers = {
      players: Object.values(BUILTIN_PROVIDER_CONFIGS.players),
      lyrics: Object.values(BUILTIN_PROVIDER_CONFIGS.lyricsProviders),
      artwork: Object.values(BUILTIN_PROVIDER_CONFIGS.artworkProviders),
    };

    // Emit event
    emit({
      type: "providers.changed",
      payload: {},
    });
  }
}

// Singleton instance
export const providerService = new ProviderService();
