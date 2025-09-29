import type { MusicMode, LyricsProvider, ArtworkProvider } from "@/types";

/**
 * Centralized provider configuration with lazy loading
 * This eliminates duplication between settings atoms and sync hooks
 */
export const PROVIDER_CONFIGS = {
  musicModes: {
    local: {
      id: "local",
      name: "Local",
      description: "Local player",
      load: async (): Promise<MusicMode> => {
        const { LocalMusicMode } = await import("@/modes/localMusicMode");
        return LocalMusicMode.getInstance();
      },
    },
    remote: {
      id: "remote",
      name: "Server",
      description: "Connect to Apple Music via local server",
      load: async (): Promise<MusicMode> => {
        const { RemoteMusicMode } = await import("@/modes/remoteMusicMode");
        return new RemoteMusicMode();
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
    "local-server": {
      id: "local-server",
      name: "Local Server",
      description: "Lyrics from your local server",
      load: async (): Promise<LyricsProvider> => {
        const { LocalServerLyricsProvider } = await import(
          "@/providers/localServerLyricsProvider"
        );
        return new LocalServerLyricsProvider();
      },
    },
    simulated: {
      id: "simulated",
      name: "Simulated",
      description: "Hardcoded demo lyrics for classic songs",
      load: async (): Promise<LyricsProvider> => {
        const { SimulatedLyricsProvider } = await import(
          "@/providers/simulatedLyricsProvider"
        );
        return new SimulatedLyricsProvider();
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
 * Helper functions to load providers by ID
 */
export const loadMusicMode = async (modeId: string): Promise<MusicMode> => {
  const config =
    PROVIDER_CONFIGS.musicModes[
      modeId as keyof typeof PROVIDER_CONFIGS.musicModes
    ];
  if (!config) {
    throw new Error(`Unknown music mode: ${modeId}`);
  }
  return config.load();
};

export const loadLyricsProvider = async (
  providerId: string,
): Promise<LyricsProvider> => {
  const config =
    PROVIDER_CONFIGS.lyricsProviders[
      providerId as keyof typeof PROVIDER_CONFIGS.lyricsProviders
    ];
  if (!config) {
    throw new Error(`Unknown lyrics provider: ${providerId}`);
  }
  return config.load();
};

export const loadArtworkProvider = async (
  providerId: string,
): Promise<ArtworkProvider> => {
  const config =
    PROVIDER_CONFIGS.artworkProviders[
      providerId as keyof typeof PROVIDER_CONFIGS.artworkProviders
    ];
  if (!config) {
    throw new Error(`Unknown artwork provider: ${providerId}`);
  }
  return config.load();
};

/**
 * Helper functions to get provider metadata without loading
 */
export const getMusicModeConfigs = () => {
  return Object.values(PROVIDER_CONFIGS.musicModes).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ load, ...config }) => config,
  );
};

export const getLyricsProviderConfigs = () => {
  return Object.values(PROVIDER_CONFIGS.lyricsProviders).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ load, ...config }) => config,
  );
};

export const getArtworkProviderConfigs = () => {
  return Object.values(PROVIDER_CONFIGS.artworkProviders).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ load, ...config }) => config,
  );
};
