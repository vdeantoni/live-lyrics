import { atom } from "jotai";
import type {
  CoreAppState,
  AppProviders,
  UserProviderOverride,
  ProviderConfig,
  EffectiveProvider,
} from "@/types/appState";
import type { Playlist, Song } from "@/types";
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

// 3. User Provider Settings (reactive state only)
// SettingsService handles all localStorage persistence
// Split into separate atoms to prevent cross-contamination between provider types

/**
 * Settings atoms are plain atoms - persistence is handled by SettingsService
 * useEventSync syncs localStorage → atoms when settings.changed events are emitted
 */
export const playersSettingsAtom = atom<Map<string, UserProviderOverride>>(
  new Map(),
);

export const lyricsSettingsAtom = atom<Map<string, UserProviderOverride>>(
  new Map(),
);

export const artworkSettingsAtom = atom<Map<string, UserProviderOverride>>(
  new Map(),
);

// 4. Helper Atom for Core App State Updates

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

// 6. Settings UI State
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

// 9. Playlists State (reactive state only)
// PlaylistService handles all localStorage persistence
export const playlistsAtom = atom<Playlist[]>([]);

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

// Playlist dialog helper atoms
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
