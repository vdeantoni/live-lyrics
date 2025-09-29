import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  AppSettings,
  Player,
  LyricsProvider,
  ArtworkProvider,
} from "@/types";
import {
  getPlayerConfigs,
  getLyricsProviderConfigs,
  getArtworkProviderConfigs,
  loadPlayer,
  loadLyricsProvider,
  loadArtworkProvider,
} from "@/config/providers";

/**
 * Default application settings
 */
export const defaultSettings: AppSettings = {
  playerId: "local",
  lyricsProviderIds: ["lrclib", "local-server", "simulated"],
  artworkProviderIds: ["itunes"],
  enabledLyricsProviders: new Set(["lrclib"]),
  enabledArtworkProviders: new Set(["itunes"]),
};

/**
 * Persistent settings atom (stored in localStorage)
 * Custom serialization to handle Set types
 */
export const settingsAtom = atomWithStorage<AppSettings>(
  "LIVE_LYRICS_SETTINGS",
  defaultSettings,
  {
    getItem: (key: string, initialValue: AppSettings): AppSettings => {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) return initialValue;

        const parsed = JSON.parse(storedValue);
        // Ensure all required fields exist with proper defaults and convert arrays back to Sets
        return {
          playerId: parsed.playerId || initialValue.playerId,
          lyricsProviderIds:
            parsed.lyricsProviderIds || initialValue.lyricsProviderIds,
          artworkProviderIds:
            parsed.artworkProviderIds || initialValue.artworkProviderIds,
          enabledLyricsProviders: new Set<string>(
            parsed.enabledLyricsProviders ||
              Array.from(initialValue.enabledLyricsProviders),
          ),
          enabledArtworkProviders: new Set<string>(
            parsed.enabledArtworkProviders ||
              Array.from(initialValue.enabledArtworkProviders),
          ),
        };
      } catch {
        return initialValue;
      }
    },
    setItem: (key, value) => {
      try {
        // Convert Sets to arrays for serialization
        const serializable = {
          ...value,
          enabledLyricsProviders: Array.from(value.enabledLyricsProviders),
          enabledArtworkProviders: Array.from(value.enabledArtworkProviders),
        };
        localStorage.setItem(key, JSON.stringify(serializable));
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  },
);

/**
 * Individual setting atoms (derived from main settings)
 */
export const playerIdAtom = atom(
  (get) => {
    const settings = get(settingsAtom);
    return settings.playerId;
  },
  (get, set, newPlayerId: string) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, { ...currentSettings, playerId: newPlayerId });
  },
);

export const lyricsProviderIdsAtom = atom(
  (get) => get(settingsAtom).lyricsProviderIds,
  (get, set, newProviderIds: string[]) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, {
      ...currentSettings,
      lyricsProviderIds: newProviderIds,
    });
  },
);

export const artworkProviderIdsAtom = atom(
  (get) => get(settingsAtom).artworkProviderIds,
  (get, set, newProviderIds: string[]) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, {
      ...currentSettings,
      artworkProviderIds: newProviderIds,
    });
  },
);

export const enabledLyricsProvidersAtom = atom(
  (get) => get(settingsAtom).enabledLyricsProviders,
  (get, set, newEnabledProviders: Set<string>) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, {
      ...currentSettings,
      enabledLyricsProviders: newEnabledProviders,
    });
  },
);

export const enabledArtworkProvidersAtom = atom(
  (get) => get(settingsAtom).enabledArtworkProviders,
  (get, set, newEnabledProviders: Set<string>) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, {
      ...currentSettings,
      enabledArtworkProviders: newEnabledProviders,
    });
  },
);

/**
 * Configuration atoms - provide metadata without instantiating providers
 */
export const availablePlayersAtom = atom(() => getPlayerConfigs());
export const availableLyricsProvidersAtom = atom(() =>
  getLyricsProviderConfigs(),
);
export const availableArtworkProvidersAtom = atom(() =>
  getArtworkProviderConfigs(),
);

/**
 * Atoms for tracking provider availability with individual loading states
 */

// Cache atoms to store availability results and loading states
const lyricsProviderAvailabilityCache = atom<Record<string, boolean>>({});
const lyricsProviderLoadingStates = atom<Record<string, boolean>>({});
const artworkProviderAvailabilityCache = atom<Record<string, boolean>>({});
const artworkProviderLoadingStates = atom<Record<string, boolean>>({});
const playerAvailabilityCache = atom<Record<string, boolean>>({});
const playerLoadingStates = atom<Record<string, boolean>>({});

// Sync atom that combines cached availability with current order/enabled state and loading states
export const lyricsProvidersWithStatusAtom = atom((get) => {
  const configs = get(availableLyricsProvidersAtom);
  const providerIds = get(lyricsProviderIdsAtom);
  const enabledProviders = get(enabledLyricsProvidersAtom);
  const cache = get(lyricsProviderAvailabilityCache);
  const loadingStates = get(lyricsProviderLoadingStates);

  // Create ordered list based on priority, with enabled status
  const orderedConfigs = providerIds
    .map((id) => configs.find((config) => config.id === id))
    .filter(Boolean) as typeof configs;

  // Add any configs not in the priority list at the end
  const missingConfigs = configs.filter(
    (config) => !providerIds.includes(config.id),
  );
  const allConfigs = [...orderedConfigs, ...missingConfigs];

  return allConfigs.map((config) => ({
    ...config,
    isAvailable: cache[config.id] ?? true, // Default to true until checked
    isEnabled: enabledProviders.has(config.id),
    priority: providerIds.indexOf(config.id) + 1 || 999,
    isLoading: loadingStates[config.id] ?? false,
  }));
});

export const artworkProvidersWithStatusAtom = atom((get) => {
  const configs = get(availableArtworkProvidersAtom);
  const providerIds = get(artworkProviderIdsAtom);
  const enabledProviders = get(enabledArtworkProvidersAtom);
  const cache = get(artworkProviderAvailabilityCache);
  const loadingStates = get(artworkProviderLoadingStates);

  // Create ordered list based on priority, with enabled status
  const orderedConfigs = providerIds
    .map((id) => configs.find((config) => config.id === id))
    .filter(Boolean) as typeof configs;

  // Add any configs not in the priority list at the end
  const missingConfigs = configs.filter(
    (config) => !providerIds.includes(config.id),
  );
  const allConfigs = [...orderedConfigs, ...missingConfigs];

  return allConfigs.map((config) => ({
    ...config,
    isAvailable: cache[config.id] ?? true, // Default to true until checked
    isEnabled: enabledProviders.has(config.id),
    priority: providerIds.indexOf(config.id) + 1 || 999,
    isLoading: loadingStates[config.id] ?? false,
  }));
});

// Write-only atoms to update individual provider states
export const updateLyricsProviderStateAtom = atom(
  null,
  (
    get,
    set,
    update: { id: string; isAvailable?: boolean; isLoading?: boolean },
  ) => {
    if (update.isAvailable !== undefined) {
      const cache = get(lyricsProviderAvailabilityCache);
      set(lyricsProviderAvailabilityCache, {
        ...cache,
        [update.id]: update.isAvailable,
      });
    }
    if (update.isLoading !== undefined) {
      const loadingStates = get(lyricsProviderLoadingStates);
      set(lyricsProviderLoadingStates, {
        ...loadingStates,
        [update.id]: update.isLoading,
      });
    }
  },
);

export const updateArtworkProviderStateAtom = atom(
  null,
  (
    get,
    set,
    update: { id: string; isAvailable?: boolean; isLoading?: boolean },
  ) => {
    if (update.isAvailable !== undefined) {
      const cache = get(artworkProviderAvailabilityCache);
      set(artworkProviderAvailabilityCache, {
        ...cache,
        [update.id]: update.isAvailable,
      });
    }
    if (update.isLoading !== undefined) {
      const loadingStates = get(artworkProviderLoadingStates);
      set(artworkProviderLoadingStates, {
        ...loadingStates,
        [update.id]: update.isLoading,
      });
    }
  },
);

// Helper atoms to check availability for individual providers
export const checkLyricsProviderAvailabilityAtom = atom(
  null,
  async (_get, set, providerId: string) => {
    set(updateLyricsProviderStateAtom, { id: providerId, isLoading: true });

    try {
      const provider = await loadLyricsProvider(providerId);
      const isAvailable = await provider.isAvailable();
      set(updateLyricsProviderStateAtom, {
        id: providerId,
        isAvailable,
        isLoading: false,
      });
    } catch (error) {
      console.error(`Failed to check availability for ${providerId}:`, error);
      set(updateLyricsProviderStateAtom, {
        id: providerId,
        isAvailable: false,
        isLoading: false,
      });
    }
  },
);

export const checkArtworkProviderAvailabilityAtom = atom(
  null,
  async (_get, set, providerId: string) => {
    set(updateArtworkProviderStateAtom, { id: providerId, isLoading: true });

    try {
      const provider = await loadArtworkProvider(providerId);
      const isAvailable = await provider.isAvailable();
      set(updateArtworkProviderStateAtom, {
        id: providerId,
        isAvailable,
        isLoading: false,
      });
    } catch (error) {
      console.error(`Failed to check availability for ${providerId}:`, error);
      set(updateArtworkProviderStateAtom, {
        id: providerId,
        isAvailable: false,
        isLoading: false,
      });
    }
  },
);

// Player availability status atom - sync like providers
export const remotePlayerWithStatusAtom = atom((get) => {
  const cache = get(playerAvailabilityCache);
  const loadingStates = get(playerLoadingStates);

  // Only track remote player since that's what we show in settings
  return {
    id: "remote",
    name: "Server",
    description: "Connect to a remote server",
    isAvailable: cache["remote"] ?? true, // Default to true until checked
    isLoading: loadingStates["remote"] ?? false,
  };
});

// Write-only atom to update player state
export const updatePlayerStateAtom = atom(
  null,
  (
    get,
    set,
    update: { id: string; isAvailable?: boolean; isLoading?: boolean },
  ) => {
    if (update.isAvailable !== undefined) {
      const cache = get(playerAvailabilityCache);
      set(playerAvailabilityCache, {
        ...cache,
        [update.id]: update.isAvailable,
      });
    }
    if (update.isLoading !== undefined) {
      const loadingStates = get(playerLoadingStates);
      set(playerLoadingStates, {
        ...loadingStates,
        [update.id]: update.isLoading,
      });
    }
  },
);

// Helper atom to check availability for individual players
export const checkPlayerAvailabilityAtom = atom(
  null,
  async (_get, set, playerId: string) => {
    set(updatePlayerStateAtom, { id: playerId, isLoading: true });

    try {
      const player = await loadPlayer(playerId);
      const isAvailable = await player.isAvailable();
      set(updatePlayerStateAtom, {
        id: playerId,
        isAvailable,
        isLoading: false,
      });
    } catch (error) {
      console.error(`Failed to check availability for ${playerId}:`, error);
      set(updatePlayerStateAtom, {
        id: playerId,
        isAvailable: false,
        isLoading: false,
      });
    }
  },
);

export const playersWithStatusAtom = atom(async (get) => {
  const configs = get(availablePlayersAtom);
  const statusPromises = configs.map(async (config) => {
    try {
      const player = await loadPlayer(config.id);
      const isAvailable = await player.isAvailable();
      return { ...config, isAvailable };
    } catch (error) {
      console.error(`Failed to check availability for ${config.id}:`, error);
      return { ...config, isAvailable: false };
    }
  });

  return Promise.all(statusPromises);
});

/**
 * Provider instance atoms with lazy loading and caching
 * These atoms provide the actual enabled providers in priority order
 */
const playerInstancesAtom = atom<Map<string, Player>>(new Map());

export const currentPlayerAtom = atom(
  async (get): Promise<Player | null> => {
    const playerId = get(playerIdAtom);
    const instances = get(playerInstancesAtom);

    // Return cached instance if available
    if (instances.has(playerId)) {
      return instances.get(playerId)!;
    }

    try {
      const provider = await loadPlayer(playerId);
      instances.set(playerId, provider);
      return provider;
    } catch (error) {
      console.error(`Failed to load player "${playerId}":`, error);
      return null;
    }
  },
  (get, set, instance: Player | null) => {
    if (instance) {
      const instances = new Map(get(playerInstancesAtom));
      instances.set(instance.getId(), instance);
      set(playerInstancesAtom, instances);
    }
  },
);

/**
 * Provider atoms that return the first enabled provider in priority order
 * for compatibility with components that expect a single provider
 */
export const currentLyricsProviderAtom = atom(
  async (get): Promise<LyricsProvider | null> => {
    const providerIds = get(lyricsProviderIdsAtom);
    const enabledProviders = get(enabledLyricsProvidersAtom);

    // Get the first enabled provider
    const firstEnabledId = providerIds.find((id) => enabledProviders.has(id));
    if (!firstEnabledId) return null;

    try {
      return await loadLyricsProvider(firstEnabledId);
    } catch (error) {
      console.error(
        `Failed to load lyrics provider "${firstEnabledId}":`,
        error,
      );
      return null;
    }
  },
);

export const currentArtworkProviderAtom = atom(
  async (get): Promise<ArtworkProvider | null> => {
    const providerIds = get(artworkProviderIdsAtom);
    const enabledProviders = get(enabledArtworkProvidersAtom);

    // Get the first enabled provider
    const firstEnabledId = providerIds.find((id) => enabledProviders.has(id));
    if (!firstEnabledId) return null;

    try {
      return await loadArtworkProvider(firstEnabledId);
    } catch (error) {
      console.error(
        `Failed to load artwork provider "${firstEnabledId}":`,
        error,
      );
      return null;
    }
  },
);

/**
 * Convenience atom to update multiple settings at once
 */
export const updateSettingsAtom = atom(
  null,
  (_get, set, newSettings: Partial<AppSettings>) => {
    set(settingsAtom, (current) => ({ ...current, ...newSettings }));
  },
);

/**
 * Settings UI state atoms
 */
export const isSettingsOpenAtom = atom(false);

export const toggleSettingsAtom = atom(null, (get, set) => {
  set(isSettingsOpenAtom, !get(isSettingsOpenAtom));
});
