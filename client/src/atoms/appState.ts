import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  CoreAppState,
  AppProviders,
  AppProviderSettings,
  UserProviderOverride,
  ProviderConfig,
  EffectiveProvider,
} from "@/types/appState";
import { BUILTIN_PROVIDER_CONFIGS } from "@/config/providers";

/**
 * Unified AppState Atoms
 *
 * This replaces the scattered atom system with a clean, unified structure:
 * - Core app state (loading, ready, error)
 * - Provider registry (what's available)
 * - User settings (sparse overrides)
 */

// 1. Core App State (loading, ready, error)
export const coreAppStateAtom = atom<CoreAppState>({
  isLoading: true,
  isReady: false,
});

// 2. Provider Registry (runtime-replaceable, initialized with builtins)
export const appProvidersAtom = atom<AppProviders>({
  players: Object.values(BUILTIN_PROVIDER_CONFIGS.players),
  lyrics: Object.values(BUILTIN_PROVIDER_CONFIGS.lyricsProviders),
  artwork: Object.values(BUILTIN_PROVIDER_CONFIGS.artworkProviders),
});

// 3. User Provider Settings (persistent, sparse overrides only)
// Split into separate atoms to prevent cross-contamination between provider types
const playersSettingsAtom = atomWithStorage<Map<string, UserProviderOverride>>(
  "LIVE_LYRICS_PLAYER_SETTINGS",
  new Map(),
  {
    getItem: (key, initialValue) => {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) return initialValue;
        const parsed = JSON.parse(storedValue);
        return new Map(
          Object.entries(parsed) as [string, UserProviderOverride][],
        );
      } catch {
        return initialValue;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify(Object.fromEntries(value.entries())),
        );
      } catch (error) {
        console.error("Failed to save player settings:", error);
      }
    },
    removeItem: (key) => localStorage.removeItem(key),
  },
);

const lyricsSettingsAtom = atomWithStorage<Map<string, UserProviderOverride>>(
  "LIVE_LYRICS_LYRICS_SETTINGS",
  new Map(),
  {
    getItem: (key, initialValue) => {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) return initialValue;
        const parsed = JSON.parse(storedValue);
        return new Map(
          Object.entries(parsed) as [string, UserProviderOverride][],
        );
      } catch {
        return initialValue;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify(Object.fromEntries(value.entries())),
        );
      } catch (error) {
        console.error("Failed to save lyrics settings:", error);
      }
    },
    removeItem: (key) => localStorage.removeItem(key),
  },
);

const artworkSettingsAtom = atomWithStorage<Map<string, UserProviderOverride>>(
  "LIVE_LYRICS_ARTWORK_SETTINGS",
  new Map(),
  {
    getItem: (key, initialValue) => {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) return initialValue;
        const parsed = JSON.parse(storedValue);
        return new Map(
          Object.entries(parsed) as [string, UserProviderOverride][],
        );
      } catch {
        return initialValue;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify(Object.fromEntries(value.entries())),
        );
      } catch (error) {
        console.error("Failed to save artwork settings:", error);
      }
    },
    removeItem: (key) => localStorage.removeItem(key),
  },
);

// Backwards compatibility: unified view of settings
export const appProviderSettingsAtom = atom(
  (get) => ({
    players: get(playersSettingsAtom),
    lyrics: get(lyricsSettingsAtom),
    artwork: get(artworkSettingsAtom),
  }),
  (_get, set, newValue: AppProviderSettings) => {
    set(playersSettingsAtom, newValue.players);
    set(lyricsSettingsAtom, newValue.lyrics);
    set(artworkSettingsAtom, newValue.artwork);
  },
);

// 4. Helper Atoms for Easy Updates

/**
 * Update the entire provider registry (useful for tests and runtime changes)
 */
export const updateProvidersAtom = atom(
  null,
  (get, set, providers: Partial<AppProviders>) => {
    const current = get(appProvidersAtom);
    set(appProvidersAtom, { ...current, ...providers });
  },
);

/**
 * Replace the entire provider registry (for tests)
 */
export const replaceProvidersAtom = atom(
  null,
  (_get, set, providers: AppProviders) => {
    set(appProvidersAtom, providers);
  },
);

/**
 * Update user settings for a specific provider
 */
export const updateProviderSettingAtom = atom(
  null,
  (
    _get,
    set,
    providerType: keyof AppProviderSettings,
    providerId: string,
    override: Partial<UserProviderOverride>,
  ) => {
    const currentSettings = _get(
      appProviderSettingsAtom,
    ) as AppProviderSettings;
    const typeSettings = new Map(currentSettings[providerType]);
    const existingOverride = typeSettings.get(providerId) || {};

    // Merge with existing override
    const newOverride = { ...existingOverride, ...override };

    // If the override is now empty (all undefined), remove it entirely
    if (Object.values(newOverride).every((v) => v === undefined)) {
      typeSettings.delete(providerId);
    } else {
      typeSettings.set(providerId, newOverride);
    }

    set(appProviderSettingsAtom, {
      ...currentSettings,
      [providerType]: typeSettings,
    });
  },
);

/**
 * Remove all user overrides for a provider
 */
export const removeProviderSettingAtom = atom(
  null,
  (_get, set, providerType: keyof AppProviderSettings, providerId: string) => {
    const currentSettings = _get(
      appProviderSettingsAtom,
    ) as AppProviderSettings;
    const typeSettings = new Map(currentSettings[providerType]);
    typeSettings.delete(providerId);

    set(appProviderSettingsAtom, {
      ...currentSettings,
      [providerType]: typeSettings,
    });
  },
);

/**
 * Reset all provider settings (clear user overrides)
 */
export const resetProviderSettingsAtom = atom(null, (_get, set) => {
  set(appProviderSettingsAtom, {
    players: new Map(),
    lyrics: new Map(),
    artwork: new Map(),
  });
});

/**
 * Update core app state (loading, ready, error)
 */
export const updateCoreAppStateAtom = atom(
  null,
  (get, set, state: Partial<CoreAppState>) => {
    const current = get(coreAppStateAtom);
    set(coreAppStateAtom, { ...current, ...state });
  },
);

// Export types for external use
export type {
  CoreAppState,
  AppProviders,
  AppProviderSettings,
  UserProviderOverride,
  ProviderConfig,
  EffectiveProvider,
} from "@/types/appState";

// 5. Computed Atoms - Combine providers + settings for effective states

/**
 * Compute effective providers by combining provider configs with user overrides
 */
const computeEffectiveProviders = <T>(
  providers: ProviderConfig<T>[],
  settings: Map<string, UserProviderOverride>,
): EffectiveProvider<T>[] => {
  return providers.map((config, index) => {
    const userOverride = settings.get(config.id);

    // Compute effective enabled state
    // User explicitly disabled = false, otherwise assume available (will be checked at runtime)
    const isEffectivelyEnabled = userOverride?.disabled !== true;

    // Compute effective priority (user override or default order)
    const effectivePriority = userOverride?.priority ?? index + 1;

    // Merge provider config with user config overrides
    const effectiveConfig = {
      ...config,
      ...(userOverride?.config || {}),
    };

    return {
      config,
      userOverride,
      isEffectivelyEnabled,
      effectivePriority,
      effectiveConfig,
    };
  });
};

/**
 * Effective lyrics providers (providers + user overrides)
 * Only subscribes to lyrics settings changes
 */
export const effectiveLyricsProvidersAtom = atom((get) => {
  const providers = get(appProvidersAtom).lyrics;
  const settings = get(lyricsSettingsAtom);
  return computeEffectiveProviders(providers, settings).sort(
    (a, b) => a.effectivePriority - b.effectivePriority,
  );
});

/**
 * Effective artwork providers (providers + user overrides)
 * Only subscribes to artwork settings changes
 */
export const effectiveArtworkProvidersAtom = atom((get) => {
  const providers = get(appProvidersAtom).artwork;
  const settings = get(artworkSettingsAtom);
  return computeEffectiveProviders(providers, settings).sort(
    (a, b) => a.effectivePriority - b.effectivePriority,
  );
});

/**
 * Effective players (providers + user overrides)
 * Only subscribes to player settings changes
 */
export const effectivePlayersAtom = atom((get) => {
  const providers = get(appProvidersAtom).players;
  const settings = get(playersSettingsAtom);
  return computeEffectiveProviders(providers, settings).sort(
    (a, b) => a.effectivePriority - b.effectivePriority,
  );
});

/**
 * Only enabled lyrics providers (filtered and sorted by priority)
 */
export const enabledLyricsProvidersAtom = atom((get) => {
  return get(effectiveLyricsProvidersAtom).filter(
    (provider) => provider.isEffectivelyEnabled,
  );
});

/**
 * Only enabled artwork providers (filtered and sorted by priority)
 */
export const enabledArtworkProvidersAtom = atom((get) => {
  return get(effectiveArtworkProvidersAtom).filter(
    (provider) => provider.isEffectivelyEnabled,
  );
});

/**
 * Selected player (first enabled player)
 */
export const selectedPlayerAtom = atom((get) => {
  const enabledPlayers = get(effectivePlayersAtom).filter(
    (player) => player.isEffectivelyEnabled,
  );
  return enabledPlayers[0] || null;
});

// 6. Convenience Helper Atoms

/**
 * Disable a provider
 */
export const disableProviderAtom = atom(
  null,
  (_get, set, providerType: keyof AppProviderSettings, providerId: string) => {
    set(updateProviderSettingAtom, providerType, providerId, {
      disabled: true,
    });
  },
);

/**
 * Enable a provider
 */
export const enableProviderAtom = atom(
  null,
  (_get, set, providerType: keyof AppProviderSettings, providerId: string) => {
    set(updateProviderSettingAtom, providerType, providerId, {
      disabled: undefined,
    });
  },
);

/**
 * Set provider priority
 */
export const setProviderPriorityAtom = atom(
  null,
  (
    _get,
    set,
    providerType: keyof AppProviderSettings,
    providerId: string,
    priority: number,
  ) => {
    set(updateProviderSettingAtom, providerType, providerId, { priority });
  },
);

/**
 * Set provider config
 */
export const setProviderConfigAtom = atom(
  null,
  (
    _get,
    set,
    providerType: keyof AppProviderSettings,
    providerId: string,
    config: Record<string, string | number | boolean>,
  ) => {
    set(updateProviderSettingAtom, providerType, providerId, { config });
  },
);

/**
 * Toggle provider enabled/disabled
 */
export const toggleProviderAtom = atom(
  null,
  (_get, set, providerType: keyof AppProviderSettings, providerId: string) => {
    const settings = (_get(appProviderSettingsAtom) as AppProviderSettings)[
      providerType
    ];
    const currentOverride = settings.get(providerId);
    const currentlyDisabled = currentOverride?.disabled === true;

    set(updateProviderSettingAtom, providerType, providerId, {
      disabled: currentlyDisabled ? undefined : true,
    });
  },
);

// 7. Settings UI State
// Simple settings state - not backward compatibility, just clean architecture
export const settingsOpenAtom = atom(false);
export const toggleSettingsAtom = atom(null, (get, set) => {
  set(settingsOpenAtom, !get(settingsOpenAtom));
});
