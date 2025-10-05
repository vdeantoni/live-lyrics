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
import type { Playlist, PlaylistSong, Song } from "@/types";
import { BUILTIN_PROVIDER_CONFIGS } from "@/config/providers";
import { DEFAULT_PLAYLISTS } from "@/config/playlists";
import { isSongEqual } from "@/lib/utils";

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

/**
 * Factory function to create provider settings atoms with Map<->localStorage serialization
 */
const createProviderSettingsAtom = (storageKey: string, settingsType: string) =>
  atomWithStorage<Map<string, UserProviderOverride>>(storageKey, new Map(), {
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
        console.error(`Failed to save ${settingsType} settings:`, error);
      }
    },
    removeItem: (key) => localStorage.removeItem(key),
  });

const playersSettingsAtom = createProviderSettingsAtom(
  "LIVE_LYRICS_PLAYER_SETTINGS",
  "player",
);

const lyricsSettingsAtom = createProviderSettingsAtom(
  "LIVE_LYRICS_LYRICS_SETTINGS",
  "lyrics",
);

const artworkSettingsAtom = createProviderSettingsAtom(
  "LIVE_LYRICS_ARTWORK_SETTINGS",
  "artwork",
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
    get,
    set,
    providerType: keyof AppProviderSettings,
    providerId: string,
    override: Partial<UserProviderOverride>,
  ) => {
    // Read the specific settings atom directly for type safety
    const settingsAtomMap = {
      players: playersSettingsAtom,
      lyrics: lyricsSettingsAtom,
      artwork: artworkSettingsAtom,
    };

    const targetAtom = settingsAtomMap[providerType];
    const typeSettings = new Map(get(targetAtom));
    const existingOverride = typeSettings.get(providerId) || {};

    // Merge with existing override
    const newOverride = { ...existingOverride, ...override };

    // If the override is now empty (all undefined), remove it entirely
    if (Object.values(newOverride).every((v) => v === undefined)) {
      typeSettings.delete(providerId);
    } else {
      typeSettings.set(providerId, newOverride);
    }

    set(targetAtom, typeSettings);
  },
);

/**
 * Remove all user overrides for a provider
 */
export const removeProviderSettingAtom = atom(
  null,
  (get, set, providerType: keyof AppProviderSettings, providerId: string) => {
    // Read the specific settings atom directly for type safety
    const settingsAtomMap = {
      players: playersSettingsAtom,
      lyrics: lyricsSettingsAtom,
      artwork: artworkSettingsAtom,
    };

    const targetAtom = settingsAtomMap[providerType];
    const typeSettings = new Map(get(targetAtom));
    typeSettings.delete(providerId);

    set(targetAtom, typeSettings);
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
  (get, set, providerType: keyof AppProviderSettings, providerId: string) => {
    // Read the specific settings atom directly for type safety
    const settingsAtomMap = {
      players: playersSettingsAtom,
      lyrics: lyricsSettingsAtom,
      artwork: artworkSettingsAtom,
    };

    const targetAtom = settingsAtomMap[providerType];
    const settings = get(targetAtom);
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
  const isSettingsOpen = get(settingsOpenAtom);
  const isSearchOpen = get(searchOpenAtom);
  const isPlaylistsOpen = get(playlistsOpenAtom);

  // Close search if open (mutual exclusivity)
  if (isSearchOpen) {
    set(searchOpenAtom, false);
  }

  // Close playlists if open (mutual exclusivity)
  if (isPlaylistsOpen) {
    set(playlistsOpenAtom, false);
  }

  // Toggle settings
  set(settingsOpenAtom, !isSettingsOpen);
});

// 8. Search UI State
export const searchOpenAtom = atom(false);
export const toggleSearchAtom = atom(null, (get, set) => {
  const isSearchOpen = get(searchOpenAtom);
  const isSettingsOpen = get(settingsOpenAtom);
  const isPlaylistsOpen = get(playlistsOpenAtom);

  // Close settings if open (mutual exclusivity)
  if (isSettingsOpen) {
    set(settingsOpenAtom, false);
  }

  // Close playlists if open (mutual exclusivity)
  if (isPlaylistsOpen) {
    set(playlistsOpenAtom, false);
  }

  // Toggle search
  set(searchOpenAtom, !isSearchOpen);
});

// 9. Playlists State
// Pre-installed with default playlists, lazy loads on first access
export const playlistsAtom = atomWithStorage<Playlist[]>(
  "LIVE_LYRICS_PLAYLISTS",
  DEFAULT_PLAYLISTS,
);

export const playlistsOpenAtom = atom(false);
export const selectedSongForPlaylistAtom = atom<Song | null>(null);
export const addToPlaylistDialogOpenAtom = atom(false);

export const togglePlaylistsAtom = atom(null, (get, set) => {
  const isPlaylistsOpen = get(playlistsOpenAtom);
  const isSettingsOpen = get(settingsOpenAtom);
  const isSearchOpen = get(searchOpenAtom);

  // Close settings if open (mutual exclusivity)
  if (isSettingsOpen) {
    set(settingsOpenAtom, false);
  }

  // Close search if open (mutual exclusivity)
  if (isSearchOpen) {
    set(searchOpenAtom, false);
  }

  // Toggle playlists
  set(playlistsOpenAtom, !isPlaylistsOpen);
});

// Playlist CRUD action atoms
export const createPlaylistAtom = atom(
  null,
  (get, set, name: string, description?: string) => {
    const playlists = get(playlistsAtom);
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(playlistsAtom, [...playlists, newPlaylist]);
    return newPlaylist;
  },
);

export const updatePlaylistAtom = atom(
  null,
  (
    get,
    set,
    playlistId: string,
    updates: Partial<Omit<Playlist, "id" | "createdAt">>,
  ) => {
    const playlists = get(playlistsAtom);
    set(
      playlistsAtom,
      playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, ...updates, updatedAt: Date.now() }
          : playlist,
      ),
    );
  },
);

export const deletePlaylistAtom = atom(null, (get, set, playlistId: string) => {
  const playlists = get(playlistsAtom);
  set(
    playlistsAtom,
    playlists.filter((playlist) => playlist.id !== playlistId),
  );
});

export const addSongToPlaylistAtom = atom(
  null,
  (get, set, playlistId: string, song: Omit<PlaylistSong, "id" | "order">) => {
    const playlists = get(playlistsAtom);
    set(
      playlistsAtom,
      playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          // Check for duplicates based on name + artist + album
          const isDuplicate = playlist.songs.some((s) => isSongEqual(s, song));
          if (isDuplicate) {
            return playlist;
          }

          const newSong: PlaylistSong = {
            ...song,
            id: `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            order: playlist.songs.length,
          };
          return {
            ...playlist,
            songs: [...playlist.songs, newSong],
            updatedAt: Date.now(),
          };
        }
        return playlist;
      }),
    );
  },
);

export const removeSongFromPlaylistAtom = atom(
  null,
  (get, set, playlistId: string, songId: string) => {
    const playlists = get(playlistsAtom);
    set(
      playlistsAtom,
      playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          const updatedSongs = playlist.songs
            .filter((song) => song.id !== songId)
            .map((song, index) => ({ ...song, order: index })); // Re-index orders
          return {
            ...playlist,
            songs: updatedSongs,
            updatedAt: Date.now(),
          };
        }
        return playlist;
      }),
    );
  },
);

export const reorderPlaylistSongsAtom = atom(
  null,
  (get, set, playlistId: string, oldIndex: number, newIndex: number) => {
    const playlists = get(playlistsAtom);
    set(
      playlistsAtom,
      playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          const songs = [...playlist.songs];
          const [movedSong] = songs.splice(oldIndex, 1);
          songs.splice(newIndex, 0, movedSong);
          // Re-index all songs
          const reorderedSongs = songs.map((song, index) => ({
            ...song,
            order: index,
          }));
          return {
            ...playlist,
            songs: reorderedSongs,
            updatedAt: Date.now(),
          };
        }
        return playlist;
      }),
    );
  },
);

export const openAddToPlaylistDialogAtom = atom(
  null,
  (_get, set, song: Song) => {
    set(selectedSongForPlaylistAtom, song);
    set(addToPlaylistDialogOpenAtom, true);
  },
);

export const closeAddToPlaylistDialogAtom = atom(null, (_get, set) => {
  set(addToPlaylistDialogOpenAtom, false);
  set(selectedSongForPlaylistAtom, null);
});
