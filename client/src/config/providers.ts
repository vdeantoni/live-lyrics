import type { Player, LyricsProvider, ArtworkProvider } from "@/types";
import { getDefaultStore } from "jotai";
import { appProvidersAtom } from "@/atoms/appState";

/**
 * Built-in provider configurations (for reference and initialization)
 */
export const BUILTIN_PROVIDER_CONFIGS = {
  players: {
    local: {
      id: "local",
      name: "Local",
      description: "Local player",
      load: async (): Promise<Player> => {
        const { LocalPlayer } = await import("@/players/localPlayer");
        return LocalPlayer.getInstance();
      },
    },
    remote: {
      id: "remote",
      name: "Server",
      description: "Remote player",
      load: async (): Promise<Player> => {
        const { RemotePlayer } = await import("@/players/remotePlayer");
        return new RemotePlayer();
      },
    },
  },
  lyricsProviders: {
    lrclib: {
      id: "lrclib",
      name: "LrcLib",
      description:
        "Community-driven lyrics database with synchronized lyrics support",
      load: async (): Promise<LyricsProvider> => {
        const { LrclibLyricsProvider } = await import(
          "@/providers/lrclibLyricsProvider"
        );
        return new LrclibLyricsProvider();
      },
    },
  },
  artworkProviders: {
    itunes: {
      id: "itunes",
      name: "iTunes",
      description: "Album artwork from iTunes Search API",
      load: async (): Promise<ArtworkProvider> => {
        const { ITunesArtworkProvider } = await import(
          "@/providers/itunesArtworkProvider"
        );
        return new ITunesArtworkProvider();
      },
    },
  },
} as const;

/**
 * Helper functions to load providers by ID (works with new array-based atoms)
 */
export const loadPlayer = async (playerId: string): Promise<Player> => {
  const store = getDefaultStore();
  const providers = store.get(appProvidersAtom);
  const config = providers.players.find((p) => p.id === playerId);

  if (!config) {
    throw new Error(`Unknown player: ${playerId}`);
  }
  return config.load();
};

export const loadLyricsProvider = async (
  providerId: string,
): Promise<LyricsProvider> => {
  const store = getDefaultStore();
  const providers = store.get(appProvidersAtom);
  const config = providers.lyrics.find((p) => p.id === providerId);

  if (!config) {
    throw new Error(`Unknown lyrics provider: ${providerId}`);
  }
  return config.load();
};

export const loadArtworkProvider = async (
  providerId: string,
): Promise<ArtworkProvider> => {
  const store = getDefaultStore();
  const providers = store.get(appProvidersAtom);
  const config = providers.artwork.find((p) => p.id === providerId);

  if (!config) {
    throw new Error(`Unknown artwork provider: ${providerId}`);
  }
  return config.load();
};

/**
 * Helper functions to get provider metadata without loading (uses new array-based atoms)
 */
export const getPlayerConfigs = () => {
  const store = getDefaultStore();
  const providers = store.get(appProvidersAtom);
  return providers.players;
};

export const getLyricsProviderConfigs = () => {
  const store = getDefaultStore();
  const providers = store.get(appProvidersAtom);
  return providers.lyrics;
};

export const getArtworkProviderConfigs = () => {
  const store = getDefaultStore();
  const providers = store.get(appProvidersAtom);
  return providers.artwork;
};
