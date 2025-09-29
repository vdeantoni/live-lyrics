import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  AppSettings,
  MusicMode,
  LyricsProvider,
  ArtworkProvider,
} from "@/types";
import { musicModeRegistry } from "@/registries/musicModeRegistry";
import { lyricsProviderRegistry } from "@/registries/lyricsProviderRegistry";
import { artworkProviderRegistry } from "@/registries/artworkProviderRegistry";

// Import to ensure providers are registered
import "@/registries/registerProviders";

/**
 * Default application settings
 */
export const defaultSettings: AppSettings = {
  modeId: "local",
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
export const modeIdAtom = atom(
  (get) => get(settingsAtom).modeId,
  (get, set, newModeId: string) => {
    const currentSettings = get(settingsAtom);
    set(settingsAtom, { ...currentSettings, modeId: newModeId });
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
 * Derived atoms for actual provider instances
 */
export const currentMusicModeAtom = atom<MusicMode | null>((get) => {
  const modeId = get(modeIdAtom);
  return musicModeRegistry.get(modeId);
});

export const currentLyricsProviderAtom = atom<LyricsProvider | null>((get) => {
  const providerId = get(lyricsProviderIdAtom);
  return lyricsProviderRegistry.get(providerId);
});

export const currentArtworkProviderAtom = atom<ArtworkProvider | null>(
  (get) => {
    const providerId = get(artworkProviderIdAtom);
    return artworkProviderRegistry.get(providerId);
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
