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

// App state for managing bootstrap status
interface AppState {
  isLoading: boolean;
  isReady: boolean;
  error?: string;
}

export const appStateAtom = atom<AppState>({
  isLoading: true,
  isReady: false,
});

// New Provider Registry Architecture
type ProviderType = "lyrics" | "artwork" | "player-source" | "theme";

interface ProviderStatus {
  isAvailable: boolean;
  isLoading: boolean;
  lastChecked?: Date;
  error?: string;
}

interface BaseProviderConfig {
  id: string;
  name: string;
  description: string;
  type: ProviderType;
}

interface LyricsProviderConfig extends BaseProviderConfig {
  type: "lyrics";
  load: () => Promise<LyricsProvider>;
}

interface ArtworkProviderConfig extends BaseProviderConfig {
  type: "artwork";
  load: () => Promise<ArtworkProvider>;
}

interface PlayerSourceConfig extends BaseProviderConfig {
  type: "player-source";
  load: () => Promise<Player>;
}

interface ThemeConfig extends BaseProviderConfig {
  type: "theme";
  cssVariables: Record<string, string>;
}

type ProviderConfig =
  | LyricsProviderConfig
  | ArtworkProviderConfig
  | PlayerSourceConfig
  | ThemeConfig;

interface ProviderRegistryEntry {
  config: ProviderConfig;
  status: ProviderStatus;
  userPreferences: {
    isEnabled: boolean;
    priority: number;
  };
}

// Export types for external use (tests, etc.)
export type { ProviderRegistryEntry, ProviderConfig, ProviderStatus, AppState };

// Main provider registry with default initialization
export const providerRegistry = atom<Map<string, ProviderRegistryEntry>>(
  (() => {
    // Start with empty registry so it can be populated by initializeRegistry
    return new Map<string, ProviderRegistryEntry>();
  })(),
);

// Registry initialization atom - can be used to set up default or test data
export const initializeRegistryAtom = atom(
  null,
  (_, set, registry?: Map<string, ProviderRegistryEntry>) => {
    if (registry) {
      // Use provided registry (for tests)
      set(providerRegistry, registry);
    } else {
      // Initialize with defaults (for production)
      const defaultRegistry = new Map<string, ProviderRegistryEntry>();

      // Add default lyrics providers
      const lyricsConfigs = getLyricsProviderConfigs();
      lyricsConfigs.forEach((config, index) => {
        defaultRegistry.set(config.id, {
          config: {
            ...config,
            type: "lyrics" as const,
            load: () => loadLyricsProvider(config.id),
          },
          status: {
            isAvailable: true, // Default to available until checked
            isLoading: false,
          },
          userPreferences: {
            isEnabled: config.id === "lrclib", // Enable lrclib by default
            priority: index + 1,
          },
        });
      });

      // Add default artwork providers
      const artworkConfigs = getArtworkProviderConfigs();
      artworkConfigs.forEach((config, index) => {
        defaultRegistry.set(config.id, {
          config: {
            ...config,
            type: "artwork" as const,
            load: () => loadArtworkProvider(config.id),
          },
          status: {
            isAvailable: true,
            isLoading: false,
          },
          userPreferences: {
            isEnabled: config.id === "itunes", // Enable iTunes by default
            priority: index + 1,
          },
        });
      });

      // Add default player sources
      const playerConfigs = getPlayerConfigs();
      playerConfigs.forEach((config, index) => {
        defaultRegistry.set(config.id, {
          config: {
            ...config,
            type: "player-source" as const,
            load: () => loadPlayer(config.id),
          },
          status: {
            isAvailable: true,
            isLoading: false,
          },
          userPreferences: {
            isEnabled: config.id === "local", // Enable local by default
            priority: index + 1,
          },
        });
      });

      // Add default themes
      const defaultThemes = [
        {
          id: "default",
          name: "Default",
          description: "Default theme with standard colors",
          cssVariables: {} as Record<string, string>,
        },
        {
          id: "dark",
          name: "Dark Mode",
          description: "Dark theme for low-light environments",
          cssVariables: {
            "--background": "0 0% 5%",
            "--foreground": "0 0% 95%",
          } as Record<string, string>,
        },
      ];

      defaultThemes.forEach((theme, index) => {
        defaultRegistry.set(theme.id, {
          config: {
            ...theme,
            type: "theme" as const,
          },
          status: {
            isAvailable: true,
            isLoading: false,
          },
          userPreferences: {
            isEnabled: theme.id === "default", // Enable default theme
            priority: index + 1,
          },
        });
      });

      set(providerRegistry, defaultRegistry);
    }
  },
);

// Registry management atoms
export const addProviderAtom = atom(
  null,
  (get, set, entry: ProviderRegistryEntry) => {
    const registry = new Map(get(providerRegistry));
    registry.set(entry.config.id, entry);
    set(providerRegistry, registry);
  },
);

export const removeProviderAtom = atom(null, (get, set, providerId: string) => {
  const registry = new Map(get(providerRegistry));
  registry.delete(providerId);
  set(providerRegistry, registry);
});

export const updateProviderStatusAtom = atom(
  null,
  (get, set, providerId: string, status: Partial<ProviderStatus>) => {
    const registry = new Map(get(providerRegistry));
    const entry = registry.get(providerId);
    if (entry) {
      registry.set(providerId, {
        ...entry,
        status: { ...entry.status, ...status },
      });
      set(providerRegistry, registry);
    }
  },
);

export const updateProviderPreferencesAtom = atom(
  null,
  (
    get,
    set,
    providerId: string,
    preferences: Partial<ProviderRegistryEntry["userPreferences"]>,
  ) => {
    const registry = new Map(get(providerRegistry));
    const entry = registry.get(providerId);
    if (entry) {
      registry.set(providerId, {
        ...entry,
        userPreferences: { ...entry.userPreferences, ...preferences },
      });
      set(providerRegistry, registry);
    }
  },
);

// Provider availability checking
export const checkProviderAvailabilityAtom = atom(
  null,
  async (get, set, providerId: string) => {
    const registry = get(providerRegistry);
    const entry = registry.get(providerId);

    if (!entry) return;

    // Set loading state
    set(updateProviderStatusAtom, providerId, { isLoading: true });

    try {
      // Only check availability for providers that have async loading
      if (entry.config.type !== "theme" && "load" in entry.config) {
        const provider = await entry.config.load();
        const isAvailable = await provider.isAvailable();

        set(updateProviderStatusAtom, providerId, {
          isAvailable,
          isLoading: false,
          lastChecked: new Date(),
          error: undefined,
        });
      } else {
        // Theme providers are always available
        set(updateProviderStatusAtom, providerId, {
          isAvailable: true,
          isLoading: false,
          lastChecked: new Date(),
          error: undefined,
        });
      }
    } catch (error) {
      console.error(
        `Failed to check availability for provider ${providerId}:`,
        error,
      );
      set(updateProviderStatusAtom, providerId, {
        isAvailable: false,
        isLoading: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Derived atoms for each provider type
export const lyricsProvidersAtom = atom((get) => {
  const registry = get(providerRegistry);
  if (!registry) return [];
  return Array.from(registry.values())
    .filter(
      (
        entry,
      ): entry is ProviderRegistryEntry & { config: LyricsProviderConfig } =>
        entry.config.type === "lyrics",
    )
    .sort((a, b) => a.userPreferences.priority - b.userPreferences.priority);
});

export const artworkProvidersAtom = atom((get) => {
  const registry = get(providerRegistry);
  if (!registry) return [];
  return Array.from(registry.values())
    .filter(
      (
        entry,
      ): entry is ProviderRegistryEntry & { config: ArtworkProviderConfig } =>
        entry.config.type === "artwork",
    )
    .sort((a, b) => a.userPreferences.priority - b.userPreferences.priority);
});

export const playerSourcesAtom = atom((get) => {
  const registry = get(providerRegistry);
  if (!registry) return [];
  return Array.from(registry.values())
    .filter(
      (
        entry,
      ): entry is ProviderRegistryEntry & { config: PlayerSourceConfig } =>
        entry.config.type === "player-source",
    )
    .sort((a, b) => a.userPreferences.priority - b.userPreferences.priority);
});

export const themesAtom = atom((get) => {
  const registry = get(providerRegistry);
  if (!registry) return [];
  return Array.from(registry.values())
    .filter(
      (entry): entry is ProviderRegistryEntry & { config: ThemeConfig } =>
        entry.config.type === "theme",
    )
    .sort((a, b) => a.userPreferences.priority - b.userPreferences.priority);
});

// Helper atoms for enabled providers only
export const enabledLyricsProvidersAtom = atom((get) => {
  return get(lyricsProvidersAtom).filter(
    (entry) => entry.userPreferences.isEnabled,
  );
});

export const enabledArtworkProvidersAtom = atom((get) => {
  return get(artworkProvidersAtom).filter(
    (entry) => entry.userPreferences.isEnabled,
  );
});

export const selectedPlayerSourceAtom = atom((get) => {
  return (
    get(playerSourcesAtom).find((entry) => entry.userPreferences.isEnabled) ||
    null
  );
});

export const selectedThemeAtom = atom((get) => {
  return (
    get(themesAtom).find((entry) => entry.userPreferences.isEnabled) || null
  );
});

// Legacy compatibility atoms - simplified versions that delegate to new system
export const playerIdAtom = atom(
  (get) => {
    const selectedSource = get(selectedPlayerSourceAtom);
    return selectedSource?.config.id || "local";
  },
  (get, set, newPlayerId: string) => {
    // Update registry to enable the selected player source
    const sources = get(playerSourcesAtom);
    sources.forEach((source) => {
      set(updateProviderPreferencesAtom, source.config.id, {
        isEnabled: source.config.id === newPlayerId,
      });
    });
  },
);

export const lyricsProviderIdsAtom = atom(
  (get) => get(lyricsProvidersAtom).map((entry) => entry.config.id),
  (_get, set, newProviderIds: string[]) => {
    // Update priorities based on new order
    newProviderIds.forEach((id, index) => {
      set(updateProviderPreferencesAtom, id, { priority: index + 1 });
    });
  },
);

export const artworkProviderIdsAtom = atom(
  (get) => get(artworkProvidersAtom).map((entry) => entry.config.id),
  (_get, set, newProviderIds: string[]) => {
    // Update priorities based on new order
    newProviderIds.forEach((id, index) => {
      set(updateProviderPreferencesAtom, id, { priority: index + 1 });
    });
  },
);

export const selectedLyricsProviderIdAtom = atom((get) => {
  const enabled = get(enabledLyricsProvidersAtom);
  return enabled[0]?.config.id || null;
});

export const selectedArtworkProviderIdAtom = atom((get) => {
  const enabled = get(enabledArtworkProvidersAtom);
  return enabled[0]?.config.id || null;
});

// Player instance cache
const playerInstanceCache = atom<Map<string, Player>>(new Map());

export const getPlayerInstanceAtom = atom(
  null,
  (get, _set, playerId: string) => {
    return get(playerInstanceCache).get(playerId) || null;
  },
);

export const setPlayerInstanceAtom = atom(
  null,
  (
    get,
    set,
    { playerId, instance }: { playerId: string; instance: Player },
  ) => {
    const cache = new Map(get(playerInstanceCache));
    cache.set(playerId, instance);
    set(playerInstanceCache, cache);
  },
);

// Settings UI atoms
export const isSettingsOpenAtom = atom(false);

export const toggleSettingsAtom = atom(null, (get, set) => {
  set(isSettingsOpenAtom, !get(isSettingsOpenAtom));
});

// Keep old AppSettings interface for localStorage compatibility temporarily
export const defaultSettings: AppSettings = {
  playerId: "local",
  lyricsProviderIds: ["lrclib", "local-server", "simulated"],
  artworkProviderIds: ["itunes"],
  enabledLyricsProviders: new Set(["lrclib"]),
  enabledArtworkProviders: new Set(["itunes"]),
};

export const settingsAtom = atomWithStorage<AppSettings>(
  "LIVE_LYRICS_SETTINGS",
  defaultSettings,
  {
    getItem: (key: string, initialValue: AppSettings): AppSettings => {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) return initialValue;

        const parsed = JSON.parse(storedValue);
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

export const updateSettingsAtom = atom(
  null,
  (_get, set, newSettings: Partial<AppSettings>) => {
    set(settingsAtom, (current) => ({ ...current, ...newSettings }));
  },
);
