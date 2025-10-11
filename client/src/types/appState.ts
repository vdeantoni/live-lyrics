import type {
  Player,
  LyricsProvider,
  ArtworkProvider,
  PlayerSettings,
} from "@/types";

/**
 * Provider configuration interface - matches the existing ProviderConfig
 */
export interface ProviderConfig<T = unknown> {
  id: string;
  name: string;
  description: string;
  load: () => Promise<T>;
}

/**
 * User override for individual providers (sparse - only stores user changes)
 */
export interface UserProviderOverride {
  // User explicitly disabled this provider (overrides isAvailable())
  disabled?: boolean;

  // User-defined priority (lower = higher priority)
  priority?: number;

  // Provider-specific configuration overrides
  config?: Record<string, string | number | boolean>;

  // Player-specific settings (for Player providers only)
  playerSettings?: PlayerSettings;
}

/**
 * Core app state (loading, ready, errors)
 */
export interface CoreAppState {
  isLoading: boolean;
  isReady: boolean;
  error?: string;
}

/**
 * Provider registry - what providers are available
 */
export interface AppProviders {
  players: ProviderConfig<Player>[];
  lyrics: ProviderConfig<LyricsProvider>[];
  artwork: ProviderConfig<ArtworkProvider>[];
}

/**
 * User settings - sparse overrides only
 */
export interface AppProviderSettings {
  players: Map<string, UserProviderOverride>;
  lyrics: Map<string, UserProviderOverride>;
  artwork: Map<string, UserProviderOverride>;
}

/**
 * Complete unified AppState structure
 */
export interface AppState {
  // Core app state
  isLoading: boolean;
  isReady: boolean;
  error?: string;

  // Provider registry (what's available)
  providers: AppProviders;

  // User settings (sparse overrides only)
  settings: {
    providers: AppProviderSettings;
  };
}

/**
 * Effective provider entry - combines provider config with user overrides
 */
export interface EffectiveProvider<T = unknown> {
  // Base provider config
  config: ProviderConfig<T>;

  // User override (if any)
  userOverride?: UserProviderOverride;

  // Computed effective values
  isEffectivelyEnabled: boolean;
  effectivePriority: number;
  effectiveConfig: Record<string, unknown>;
}

/**
 * Provider availability status
 */
export interface ProviderAvailability {
  isAvailable: boolean;
  isLoading: boolean;
  lastChecked?: number;
  error?: string;
}
