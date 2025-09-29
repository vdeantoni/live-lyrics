import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  AppSettings,
  Player,
  LyricsProvider,
  ArtworkProvider,
} from "@/types";
import {
  getMusicPlayerConfigs,
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
  lyricsProviderId: "lrclib",
  artworkProviderId: "itunes",
};

/**
 * Persistent settings atom (stored in localStorage)
 */
export const settingsAtom = atomWithStorage<AppSettings>(
  "live-lyrics-settings",
  defaultSettings,
);

/**
 * Individual setting atoms (derived from main settings)
 */
export const playerIdAtom = atom(
  (get) => get(settingsAtom).playerId,
  (get, set, newPlayerId: string) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, { ...currentSettings, playerId: newPlayerId });
  },
);

export const lyricsProviderIdAtom = atom(
  (get) => get(settingsAtom).lyricsProviderId,
  (get, set, newProviderId: string) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, { ...currentSettings, lyricsProviderId: newProviderId });
  },
);

export const artworkProviderIdAtom = atom(
  (get) => get(settingsAtom).artworkProviderId,
  (get, set, newProviderId: string) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, { ...currentSettings, artworkProviderId: newProviderId });
  },
);

/**
 * Configuration atoms - provide metadata without instantiating providers
 */
export const availableMusicPlayersAtom = atom(() => getMusicPlayerConfigs());
export const availableLyricsProvidersAtom = atom(() =>
  getLyricsProviderConfigs(),
);
export const availableArtworkProvidersAtom = atom(() =>
  getArtworkProviderConfigs(),
);

/**
 * Async atoms for checking provider availability (for UI status)
 */
export const lyricsProvidersWithStatusAtom = atom(async (get) => {
  const configs = get(availableLyricsProvidersAtom);
  const statusPromises = configs.map(async (config) => {
    try {
      const provider = await loadLyricsProvider(config.id);
      const isAvailable = await provider.isAvailable();
      return { ...config, isAvailable };
    } catch (error) {
      console.error(`Failed to check availability for ${config.id}:`, error);
      return { ...config, isAvailable: false };
    }
  });

  return Promise.all(statusPromises);
});

export const artworkProvidersWithStatusAtom = atom(async (get) => {
  const configs = get(availableArtworkProvidersAtom);
  const statusPromises = configs.map(async (config) => {
    try {
      const provider = await loadArtworkProvider(config.id);
      const isAvailable = await provider.isAvailable();
      return { ...config, isAvailable };
    } catch (error) {
      console.error(`Failed to check availability for ${config.id}:`, error);
      return { ...config, isAvailable: false };
    }
  });

  return Promise.all(statusPromises);
});

export const musicPlayersWithStatusAtom = atom(async (get) => {
  const configs = get(availableMusicPlayersAtom);
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
 */
const musicPlayerInstancesAtom = atom<Map<string, Player>>(new Map());

export const currentMusicPlayerAtom = atom(
  async (get): Promise<Player | null> => {
    const playerId = get(playerIdAtom);
    const instances = get(musicPlayerInstancesAtom);

    // Return cached instance if available
    if (instances.has(playerId)) {
      return instances.get(playerId)!;
    }

    try {
      const provider = await loadPlayer(playerId);
      instances.set(playerId, provider);
      return provider;
    } catch (error) {
      console.error(`Failed to load music player "${playerId}":`, error);
      return null;
    }
  },
  (get, set, instance: Player | null) => {
    if (instance) {
      const instances = new Map(get(musicPlayerInstancesAtom));
      instances.set(instance.getId(), instance);
      set(musicPlayerInstancesAtom, instances);
    }
  },
);

const lyricsProviderInstancesAtom = atom<Map<string, LyricsProvider>>(
  new Map(),
);

export const currentLyricsProviderAtom = atom(
  async (get): Promise<LyricsProvider | null> => {
    const providerId = get(lyricsProviderIdAtom);
    const instances = get(lyricsProviderInstancesAtom);

    // Return cached instance if available
    if (instances.has(providerId)) {
      return instances.get(providerId)!;
    }

    try {
      const provider = await loadLyricsProvider(providerId);
      instances.set(providerId, provider);
      return provider;
    } catch (error) {
      console.error(`Failed to load lyrics provider "${providerId}":`, error);
      return null;
    }
  },
  (get, set, instance: LyricsProvider | null) => {
    if (instance) {
      const instances = new Map(get(lyricsProviderInstancesAtom));
      instances.set(instance.getId(), instance);
      set(lyricsProviderInstancesAtom, instances);
    }
  },
);

const artworkProviderInstancesAtom = atom<Map<string, ArtworkProvider>>(
  new Map(),
);

export const currentArtworkProviderAtom = atom(
  async (get): Promise<ArtworkProvider | null> => {
    const providerId = get(artworkProviderIdAtom);
    const instances = get(artworkProviderInstancesAtom);

    // Return cached instance if available
    if (instances.has(providerId)) {
      return instances.get(providerId)!;
    }

    try {
      const provider = await loadArtworkProvider(providerId);
      instances.set(providerId, provider);
      return provider;
    } catch (error) {
      console.error(`Failed to load artwork provider "${providerId}":`, error);
      return null;
    }
  },
  (get, set, instance: ArtworkProvider | null) => {
    if (instance) {
      const instances = new Map(get(artworkProviderInstancesAtom));
      instances.set(instance.getId(), instance);
      set(artworkProviderInstancesAtom, instances);
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
