import type { Page } from "@playwright/test";

/**
 * Custom provider configuration for error handling tests
 */
interface CustomProviderConfig {
  id: string;
  name: string;
  description: string;
  priority?: number;
  isEnabled: boolean;
  isAvailable: boolean;
  lyricsFormat?: LyricsFormat; // Optional: specify lyrics format for testing
}

interface CustomTestRegistryConfig {
  lyricsProviders?: CustomProviderConfig[];
  artworkProviders?: CustomProviderConfig[];
  players?: CustomProviderConfig[];
}

/**
 * Lyrics format types for testing different scenarios
 */
export type LyricsFormat = "enhanced" | "normal" | "plain";

/**
 * Get lyrics content based on format type
 */
const getLyricsForFormat = (format: LyricsFormat): string => {
  // Enhanced LRC with word-level timing
  const enhancedLrc = `[00:00.00]<00:00.00>Test <00:00.30>line <00:00.50>one <00:00.80>with <00:01.20>words
[00:02.00]<00:02.00>Test <00:02.30>line <00:02.50>two <00:02.90>here
[00:04.00]<00:04.00>Test <00:04.40>line <00:04.60>three <00:04.80>now
[00:06.00]<00:06.00>Test <00:06.40>line <00:06.90>four <00:07.20>today
[00:08.00]<00:08.00>Test <00:08.40>line <00:08.70>five
[00:10.00]<00:10.00>Test <00:10.30>line <00:10.50>six <00:10.70>more <00:10.90>words <00:11.30>here`;

  // Normal LRC with line-level timing only
  const normalLrc = `[00:00.00]Test line one with words
[00:02.00]Test line two here
[00:04.00]Test line three now
[00:06.00]Test line four today
[00:08.00]Test line five
[00:10.00]Test line six more words here`;

  // Plain text with no timing
  const plainText = `Test line one with words
Test line two here
Test line three now
Test line four today
Test line five
Test line six more words here`;

  switch (format) {
    case "enhanced":
      return enhancedLrc;
    case "normal":
      return normalLrc;
    case "plain":
      return plainText;
  }
};

/**
 * Default test registry configuration
 */
const getDefaultConfig = (): CustomTestRegistryConfig => ({
  lyricsProviders: [
    {
      id: "lrclib",
      name: "Test LrcLib",
      description: "Test lyrics provider (Bohemian Rhapsody only)",
      isEnabled: true,
      isAvailable: true,
    },
  ],
  artworkProviders: [
    {
      id: "itunes",
      name: "Test iTunes",
      description: "Test artwork provider (no artwork)",
      isEnabled: true,
      isAvailable: true,
    },
  ],
  players: [
    {
      id: "local",
      name: "Local",
      description: "Local test player",
      isEnabled: true,
      isAvailable: true,
    },
  ],
});

/**
 * Core implementation of provider registry injection
 * This is shared between both injectTestRegistry and injectCustomTestRegistry
 */
const injectProviderRegistry = async (
  page: Page,
  config: CustomTestRegistryConfig,
) => {
  await page.addInitScript((configStr: string) => {
    const config = JSON.parse(configStr) as CustomTestRegistryConfig;

    const debugLog = (message: string, data?: unknown) => {
      console.log(`[TestRegistry] ${message}`, data || "");
    };

    // Shared player state (singleton-like)
    const testPlayerState = {
      currentTime: 0,
      isPlaying: false,
      startTime: 0,
    };

    // Factory: Create lyrics provider with configurable availability
    const createLyricsProvider = (providerConfig: CustomProviderConfig) => ({
      getId: () => providerConfig.id,
      getName: () => providerConfig.name,
      getDescription: () => providerConfig.description,
      isAvailable: () => Promise.resolve(providerConfig.isAvailable),
      isFetching: () => Promise.resolve(false),
      supportsLyrics: async (song: {
        name: string;
        artist: string;
        album?: string;
      }) => {
        if (!providerConfig.isAvailable) return false;
        return song.name === "Bohemian Rhapsody" && song.artist === "Queen";
      },
      getLyrics: async (song: {
        name: string;
        artist: string;
        album?: string;
      }) => {
        if (!providerConfig.isAvailable) return null;
        if (song.name === "Bohemian Rhapsody" && song.artist === "Queen") {
          debugLog(`${providerConfig.name} returning Bohemian Rhapsody lyrics`);
          // Use format from window global (set by injectTestRegistryWithLyricsFormat)
          const format =
            (window as Window & { __TEST_LYRICS_FORMAT__?: string })
              .__TEST_LYRICS_FORMAT__ || "enhanced";
          return getLyricsForFormat(format);
        }
        debugLog(`${providerConfig.name} no lyrics found for song:`, {
          name: song.name,
          artist: song.artist,
        });
        return null;
      },
    });

    // Factory: Create artwork provider with configurable availability
    const createArtworkProvider = (providerConfig: CustomProviderConfig) => ({
      getId: () => providerConfig.id,
      getName: () => providerConfig.name,
      getDescription: () => providerConfig.description,
      isAvailable: () => Promise.resolve(providerConfig.isAvailable),
      isFetching: () => Promise.resolve(false),
      getArtwork: async () => {
        if (!providerConfig.isAvailable) return [];
        debugLog(
          `${providerConfig.name} getArtwork called - returning empty array`,
        );
        return [];
      },
    });

    // Factory: Create player with configurable availability
    const createPlayerProvider = (providerConfig: CustomProviderConfig) => ({
      getId: () => providerConfig.id,
      getName: () => providerConfig.name,
      getDescription: () => providerConfig.description,
      isAvailable: () => Promise.resolve(providerConfig.isAvailable),
      getSong: async () => {
        if (!providerConfig.isAvailable) return null;

        // Simulate time progression when playing
        if (testPlayerState.isPlaying) {
          const now = Date.now();
          testPlayerState.currentTime = Math.min(
            (now - testPlayerState.startTime) / 1000,
            355,
          );
        }

        const song = {
          name: "Bohemian Rhapsody",
          artist: "Queen",
          album: "A Night at the Opera",
          duration: 355,
          currentTime: testPlayerState.currentTime,
          isPlaying: testPlayerState.isPlaying,
        };
        debugLog(`${providerConfig.name} getSong returning:`, song);
        return song;
      },
      play: async () => {
        debugLog(`${providerConfig.name} play() called`);
        testPlayerState.isPlaying = true;
        testPlayerState.startTime =
          Date.now() - testPlayerState.currentTime * 1000;
      },
      pause: async () => {
        debugLog(`${providerConfig.name} pause() called`);
        testPlayerState.isPlaying = false;
      },
      seek: async (time: number) => {
        debugLog(`${providerConfig.name} seek(${time}) called`);
        testPlayerState.currentTime = Math.max(0, Math.min(time, 355));
        if (testPlayerState.isPlaying) {
          testPlayerState.startTime = Date.now() - time * 1000;
        }
      },
    });

    // Build provider configurations from input config
    const buildProviderConfigs = () => {
      const lyricsProviders =
        config.lyricsProviders?.map((providerConfig) => ({
          id: providerConfig.id,
          name: providerConfig.name,
          description: providerConfig.description,
          load: async () => {
            debugLog(
              `Loading ${providerConfig.name} provider (available: ${providerConfig.isAvailable})`,
            );
            return createLyricsProvider(providerConfig);
          },
        })) || [];

      const artworkProviders =
        config.artworkProviders?.map((providerConfig) => ({
          id: providerConfig.id,
          name: providerConfig.name,
          description: providerConfig.description,
          load: async () => {
            debugLog(
              `Loading ${providerConfig.name} provider (available: ${providerConfig.isAvailable})`,
            );
            return createArtworkProvider(providerConfig);
          },
        })) || [];

      const players =
        config.players?.map((providerConfig) => ({
          id: providerConfig.id,
          name: providerConfig.name,
          description: providerConfig.description,
          load: async () => {
            debugLog(
              `Loading ${providerConfig.name} player (available: ${providerConfig.isAvailable})`,
            );
            return createPlayerProvider(providerConfig);
          },
        })) || [];

      return { lyricsProviders, artworkProviders, players };
    };

    // Wait for the provider API to be available
    const waitForProviderAPI = () => {
      return new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const checkForAPI = () => {
          attempts++;
          debugLog(
            `Attempting to load provider API (attempt ${attempts}/${maxAttempts})`,
          );

          if (typeof window !== "undefined") {
            Promise.resolve().then(async () => {
              try {
                const providerRegistryAPI = window["providerRegistryAPI"];
                if (!providerRegistryAPI) {
                  throw new Error("providerRegistryAPI is undefined");
                }

                debugLog("providerRegistryAPI found, setting up test registry");

                // Build and register providers
                const { lyricsProviders, artworkProviders, players } =
                  buildProviderConfigs();

                debugLog("Replacing all providers via providerRegistryAPI");
                providerRegistryAPI.replaceAll({
                  players:
                    players.length > 0
                      ? players
                      : [
                          {
                            id: "local",
                            name: "Local",
                            description: "Local test player",
                            load: async () =>
                              createPlayerProvider({
                                id: "local",
                                name: "Local",
                                description: "Local test player",
                                isEnabled: true,
                                isAvailable: true,
                              }),
                          },
                        ],
                  lyricsProviders:
                    lyricsProviders.length > 0
                      ? lyricsProviders
                      : [
                          {
                            id: "lrclib",
                            name: "Test LrcLib",
                            description: "Test lyrics provider",
                            load: async () =>
                              createLyricsProvider({
                                id: "lrclib",
                                name: "Test LrcLib",
                                description: "Test lyrics provider",
                                isEnabled: true,
                                isAvailable: true,
                              }),
                          },
                        ],
                  artworkProviders:
                    artworkProviders.length > 0
                      ? artworkProviders
                      : [
                          {
                            id: "itunes",
                            name: "Test iTunes",
                            description: "Test artwork provider",
                            load: async () =>
                              createArtworkProvider({
                                id: "itunes",
                                name: "Test iTunes",
                                description: "Test artwork provider",
                                isEnabled: true,
                                isAvailable: true,
                              }),
                          },
                        ],
                });

                // Set up provider settings based on config
                try {
                  debugLog(
                    "Clearing persisted app state for clean test environment",
                  );

                  // Clear the unified provider settings
                  localStorage.removeItem("LIVE_LYRICS_APP_PROVIDER_SETTINGS");

                  // Clear legacy settings
                  const legacySettingsKeys = [
                    "LIVE_LYRICS_PROVIDER_OVERRIDES",
                    "LIVE_LYRICS_SETTINGS",
                    "enabledLyricsProviders",
                    "enabledArtworkProviders",
                    "enabledPlayers",
                    "lyricsProviderOrder",
                    "artworkProviderOrder",
                  ];

                  legacySettingsKeys.forEach((key) => {
                    localStorage.removeItem(key);
                  });

                  // Set custom settings if provided
                  if (
                    config.lyricsProviders ||
                    config.artworkProviders ||
                    config.players
                  ) {
                    const settings = {
                      enabledLyricsProviders:
                        config.lyricsProviders
                          ?.filter((p) => p.isEnabled)
                          .map((p) => p.id) || [],
                      enabledArtworkProviders:
                        config.artworkProviders
                          ?.filter((p) => p.isEnabled)
                          .map((p) => p.id) || [],
                      lyricsProviderOrder:
                        config.lyricsProviders?.map((p) => p.id) || [],
                      artworkProviderOrder:
                        config.artworkProviders?.map((p) => p.id) || [],
                    };

                    debugLog("Setting custom provider settings", settings);
                    localStorage.setItem(
                      "LIVE_LYRICS_APP_PROVIDER_SETTINGS",
                      JSON.stringify(settings),
                    );
                  }

                  debugLog(
                    "App state cleared - test providers will use natural availability",
                  );
                } catch (settingsError) {
                  debugLog(
                    "Warning: Could not clear/set app state:",
                    settingsError,
                  );
                }

                debugLog("Test registry setup completed successfully");
                resolve();
              } catch (error) {
                debugLog("Error loading provider API:", error);
                if (attempts < maxAttempts) {
                  setTimeout(checkForAPI, 100);
                } else {
                  reject(
                    new Error(
                      `Failed to load provider API after ${maxAttempts} attempts: ${error}`,
                    ),
                  );
                }
              }
            });
          } else {
            if (attempts < maxAttempts) {
              setTimeout(checkForAPI, 100);
            } else {
              reject(
                new Error("Window object not available after max attempts"),
              );
            }
          }
        };

        checkForAPI();
      });
    };

    // Execute the injection with error handling
    waitForProviderAPI().catch((error) => {
      console.error("[TestRegistry] Failed to inject test registry:", error);
      (window as unknown as Record<string, unknown>).__TEST_REGISTRY_FAILED__ =
        true;
    });
  }, JSON.stringify(config));
};

/**
 * Inject a standard test registry into the browser window for E2E tests using Jotai atoms
 * This provides a consistent set of mock providers for E2E testing
 *
 * Test Data Configuration:
 * - Players: Local player only (returns Bohemian Rhapsody)
 * - Lyrics: Test provider that only returns lyrics for Bohemian Rhapsody
 * - Artwork: Test provider that returns no artwork but is available
 */
export const injectTestRegistry = async (page: Page) => {
  await injectProviderRegistry(page, getDefaultConfig());
};

/**
 * Inject a custom test registry with configurable provider availability and enabled states
 * This is useful for testing error scenarios and provider fallback behavior
 */
export const injectCustomTestRegistry = async (
  page: Page,
  config: CustomTestRegistryConfig,
) => {
  await injectProviderRegistry(page, config);
};

/**
 * Inject test registry with a specific lyrics format
 * Useful for visual regression testing of different lyrics display modes
 */
export const injectTestRegistryWithLyricsFormat = async (
  page: Page,
  format: LyricsFormat,
) => {
  await page.addInitScript((formatStr: string) => {
    (
      window as Window & { __TEST_LYRICS_FORMAT__?: string }
    ).__TEST_LYRICS_FORMAT__ = formatStr;
  }, format);

  await injectProviderRegistry(page, getDefaultConfig());
};
