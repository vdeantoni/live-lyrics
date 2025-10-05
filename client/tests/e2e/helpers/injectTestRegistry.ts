import type { Page } from "@playwright/test";
import type { Song } from "@/types";

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
    {
      id: "unsplash",
      name: "Test Unsplash",
      description: "Test random images provider (no artwork)",
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

    /**
     * Get lyrics content based on format type
     * This function must be defined inside the injected script
     */
    const getLyricsForFormat = (format: string): string => {
      // Enhanced LRC with word-level timing for Bohemian Rhapsody
      const enhancedLrc = `[00:00.00]<00:00.00>Is <00:00.20>this <00:00.40>the <00:00.60>real <00:00.90>life?
[00:06.00]<00:06.00>Is <00:06.20>this <00:06.40>just <00:06.70>fantasy?
[00:12.00]<00:12.00>Caught <00:12.30>in <00:12.50>a <00:12.70>landslide
[00:16.00]<00:16.00>No <00:16.30>escape <00:16.70>from <00:17.00>reality
[00:22.00]<00:22.00>Open <00:22.30>your <00:22.60>eyes
[00:26.00]<00:26.00>Look <00:26.30>up <00:26.50>to <00:26.70>the <00:27.00>skies <00:27.40>and <00:27.70>see
[00:32.00]<00:32.00>I'm <00:32.30>just <00:32.60>a <00:32.80>poor <00:33.10>boy
[00:36.00]<00:36.00>I <00:36.20>need <00:36.50>no <00:36.80>sympathy
[00:42.00]<00:42.00>Because <00:42.40>I'm <00:42.70>easy <00:43.00>come, <00:43.40>easy <00:43.70>go
[01:30.00]<01:30.00>Mama, <01:30.50>just <01:30.80>killed <01:31.20>a <01:31.40>man
[02:30.00]<02:30.00>To <02:30.50>me`;

      // Normal LRC with line-level timing only
      const normalLrc = `[00:00.00]Is this the real life?
[00:06.00]Is this just fantasy?
[00:12.00]Caught in a landslide
[00:16.00]No escape from reality
[00:22.00]Open your eyes
[00:26.00]Look up to the skies and see
[00:32.00]I'm just a poor boy
[00:36.00]I need no sympathy
[00:42.00]Because I'm easy come, easy go
[01:30.00]Mama, just killed a man
[02:30.00]To me`;

      // Plain text with no timing
      const plainText = `Is this the real life?
Is this just fantasy?
Caught in a landslide
No escape from reality
Open your eyes
Look up to the skies and see
I'm just a poor boy
I need no sympathy
Because I'm easy come, easy go
Mama, just killed a man
To me`;

      switch (format) {
        case "enhanced":
          return enhancedLrc;
        case "normal":
          return normalLrc;
        case "plain":
          return plainText;
        default:
          return enhancedLrc;
      }
    };

    // Shared player state (singleton-like) with queue system
    const testPlayerState: {
      currentTime: number;
      isPlaying: boolean;
      startTime: number;
      currentSong: {
        name: string;
        artist: string;
        album: string;
        duration: number;
        currentTime: number;
        isPlaying: boolean;
      } | null;
      queue: Array<{
        name: string;
        artist: string;
        album: string;
        duration: number;
        currentTime: number;
        isPlaying: boolean;
      }>;
      history: Array<{
        name: string;
        artist: string;
        album: string;
        duration: number;
        currentTime: number;
        isPlaying: boolean;
      }>;
      settings: {
        playOnAdd: boolean;
      };
    } = {
      currentTime: 0,
      isPlaying: false,
      startTime: 0,
      // Queue-based state
      currentSong: {
        name: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 355,
        currentTime: 0,
        isPlaying: false,
      },
      queue: [],
      history: [],
      settings: {
        playOnAdd: false,
      },
    };

    // Factory: Create lyrics provider with configurable availability
    const createLyricsProvider = (providerConfig: CustomProviderConfig) => ({
      getId: () => providerConfig.id,
      getName: () => providerConfig.name,
      getDescription: () => providerConfig.description,
      isAvailable: () => Promise.resolve(providerConfig.isAvailable),
      isFetching: () => Promise.resolve(false),
      search: async (query: string) => {
        if (!providerConfig.isAvailable) return [];
        debugLog(`${providerConfig.name} search for: "${query}"`);

        // Mock search results based on query
        const searchResults: Array<{
          id: string;
          trackName: string;
          artistName: string;
          albumName: string;
          duration: number;
        }> = [];

        // Return different mock songs based on search query
        if (query.toLowerCase().includes("hotel")) {
          searchResults.push({
            id: "mock-hotel-california",
            trackName: "Hotel California",
            artistName: "Eagles",
            albumName: "Hotel California",
            duration: 391,
          });
        }

        if (query.toLowerCase().includes("imagine")) {
          searchResults.push({
            id: "mock-imagine",
            trackName: "Imagine",
            artistName: "John Lennon",
            albumName: "Imagine",
            duration: 183,
          });
        }

        if (query.toLowerCase().includes("stairway")) {
          searchResults.push({
            id: "mock-stairway",
            trackName: "Stairway to Heaven",
            artistName: "Led Zeppelin",
            albumName: "Led Zeppelin IV",
            duration: 482,
          });
        }

        debugLog(
          `${providerConfig.name} found ${searchResults.length} results`,
        );
        return searchResults;
      },
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

    // Factory: Create player with configurable availability and queue system
    const createPlayerProvider = (providerConfig: CustomProviderConfig) => ({
      getId: () => providerConfig.id,
      getName: () => providerConfig.name,
      getDescription: () => providerConfig.description,
      isAvailable: () => Promise.resolve(providerConfig.isAvailable),
      getSong: async () => {
        if (!providerConfig.isAvailable) return null;

        // Handle null current song
        if (!testPlayerState.currentSong) {
          return {
            name: "",
            artist: "",
            album: "",
            duration: 0,
            currentTime: 0,
            isPlaying: false,
          };
        }

        // Simulate time progression when playing
        if (testPlayerState.isPlaying) {
          const now = Date.now();
          testPlayerState.currentTime = Math.min(
            (now - testPlayerState.startTime) / 1000,
            testPlayerState.currentSong.duration,
          );
        }

        const song = {
          ...testPlayerState.currentSong,
          currentTime: testPlayerState.currentTime,
          isPlaying: testPlayerState.isPlaying,
        };
        debugLog(`${providerConfig.name} getSong returning:`, song);
        return song;
      },
      play: async () => {
        if (!testPlayerState.currentSong) return;
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
        if (!testPlayerState.currentSong) return;
        debugLog(`${providerConfig.name} seek(${time}) called`);
        testPlayerState.currentTime = Math.max(
          0,
          Math.min(time, testPlayerState.currentSong.duration),
        );
        if (testPlayerState.isPlaying) {
          testPlayerState.startTime = Date.now() - time * 1000;
        }
      },
      next: async () => {
        debugLog(`${providerConfig.name} next() called`);
        if (!testPlayerState.currentSong) {
          if (testPlayerState.queue.length > 0) {
            testPlayerState.currentSong = testPlayerState.queue.shift()!;
            testPlayerState.currentTime = 0;
            testPlayerState.startTime = Date.now();
          }
          return;
        }

        if (testPlayerState.queue.length > 0) {
          testPlayerState.history.push(testPlayerState.currentSong);
          testPlayerState.currentSong = testPlayerState.queue.shift()!;
          testPlayerState.currentTime = 0;
          testPlayerState.startTime = Date.now();
        } else {
          testPlayerState.history.push(testPlayerState.currentSong);
          testPlayerState.currentSong = null;
          testPlayerState.currentTime = 0;
          testPlayerState.isPlaying = false;
        }
      },
      previous: async () => {
        debugLog(`${providerConfig.name} previous() called`);
        if (testPlayerState.currentTime > 3) {
          testPlayerState.currentTime = 0;
          testPlayerState.startTime = Date.now();
          return;
        }

        if (testPlayerState.history.length > 0) {
          if (testPlayerState.currentSong) {
            testPlayerState.queue.unshift(testPlayerState.currentSong);
          }
          testPlayerState.currentSong = testPlayerState.history.pop()!;
          testPlayerState.currentTime = 0;
          testPlayerState.startTime = Date.now();
        } else if (testPlayerState.currentSong) {
          testPlayerState.currentTime = 0;
          testPlayerState.startTime = Date.now();
        }
      },
      add: async (
        ...songs: Array<{
          name: string;
          artist: string;
          album: string;
          duration: number;
          currentTime: number;
          isPlaying: boolean;
        }>
      ) => {
        debugLog(
          `${providerConfig.name} add() called with ${songs.length} songs`,
        );
        if (songs.length === 0) return;

        testPlayerState.queue.unshift(...songs);

        if (!testPlayerState.currentSong && testPlayerState.queue.length > 0) {
          testPlayerState.currentSong = testPlayerState.queue.shift()!;
          testPlayerState.currentTime = 0;
          testPlayerState.startTime = Date.now();
        }

        if (testPlayerState.settings.playOnAdd && testPlayerState.currentSong) {
          testPlayerState.isPlaying = true;
          testPlayerState.startTime =
            Date.now() - testPlayerState.currentTime * 1000;
        }
      },
      getQueue: async () => {
        return [...testPlayerState.queue];
      },
      getHistory: async () => {
        return [...testPlayerState.history];
      },
      clear: async () => {
        debugLog(`${providerConfig.name} clear() called`);
        testPlayerState.queue = [];
        testPlayerState.currentSong = null;
        testPlayerState.currentTime = 0;
        testPlayerState.isPlaying = false;
      },
      getSettings: async () => {
        return { ...testPlayerState.settings };
      },
      setSettings: async (settings: { playOnAdd?: boolean }) => {
        debugLog(`${providerConfig.name} setSettings() called`, settings);
        testPlayerState.settings = { ...testPlayerState.settings, ...settings };
      },
      setQueue: async (songs: Song[]) => {
        debugLog(`${providerConfig.name} setQueue() called`, songs.length);
        testPlayerState.queue = [...songs];
      },
      clearHistory: async () => {
        debugLog(`${providerConfig.name} clearHistory() called`);
        testPlayerState.history = [];
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
              `[LOAD] Loading ${providerConfig.name} provider (id: ${providerConfig.id}, available: ${providerConfig.isAvailable})`,
            );
            const provider = createLyricsProvider(providerConfig);
            debugLog(
              `[LOAD] Created mock provider ${providerConfig.name}, isAvailable will return: ${providerConfig.isAvailable}`,
            );
            return provider;
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const providerRegistryAPI = (window as any)[
                  "providerRegistryAPI"
                ];
                if (!providerRegistryAPI) {
                  throw new Error("providerRegistryAPI is undefined");
                }

                debugLog("providerRegistryAPI found, setting up test registry");

                // Build and register providers
                const { lyricsProviders, artworkProviders, players } =
                  buildProviderConfigs();

                debugLog("Replacing all providers via providerRegistryAPI");
                debugLog(
                  `Registry config: ${lyricsProviders.length} lyrics, ${artworkProviders.length} artwork, ${players.length} players`,
                );
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
                  lyricsProviders: lyricsProviders, // Respect empty array for testing no-lyrics scenario
                  artworkProviders: artworkProviders, // Respect empty array for testing no-artwork scenario
                });

                // Verify replacement succeeded
                const verifyProviders =
                  providerRegistryAPI.getAll.lyricsProviders();
                debugLog(
                  `After replaceAll: ${verifyProviders.length} lyrics providers registered`,
                );
                verifyProviders.forEach((p: { name: string; id: string }) => {
                  debugLog(`  - ${p.name} (${p.id})`);
                });

                // Set up provider settings based on config
                try {
                  debugLog(
                    "Clearing persisted app state for clean test environment",
                  );

                  // Clear the new split provider settings atoms (current architecture)
                  localStorage.removeItem("LIVE_LYRICS_PLAYER_SETTINGS");
                  localStorage.removeItem("LIVE_LYRICS_LYRICS_SETTINGS");
                  localStorage.removeItem("LIVE_LYRICS_ARTWORK_SETTINGS");

                  // Clear legacy settings
                  const legacySettingsKeys = [
                    "LIVE_LYRICS_APP_PROVIDER_SETTINGS", // Old unified settings
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

                  // Set provider settings in the new split atom format
                  // Each provider type has its own localStorage key with Map<string, UserProviderOverride> structure
                  // Note: Providers are enabled by default, we only need to set disabled=true or custom priority
                  if (
                    config.lyricsProviders &&
                    config.lyricsProviders.length > 0
                  ) {
                    const lyricsSettings: Record<
                      string,
                      { disabled?: boolean; priority?: number }
                    > = {};
                    config.lyricsProviders.forEach((provider, index) => {
                      // Only store settings if provider is disabled or has custom priority
                      if (!provider.isEnabled) {
                        lyricsSettings[provider.id] = { disabled: true };
                      } else if (index !== 0) {
                        // Set priority for non-first providers (first provider gets default priority 1)
                        lyricsSettings[provider.id] = { priority: index + 1 };
                      }
                    });
                    if (Object.keys(lyricsSettings).length > 0) {
                      localStorage.setItem(
                        "LIVE_LYRICS_LYRICS_SETTINGS",
                        JSON.stringify(lyricsSettings),
                      );
                      debugLog("Set lyrics provider settings", lyricsSettings);
                    }
                  }

                  if (
                    config.artworkProviders &&
                    config.artworkProviders.length > 0
                  ) {
                    const artworkSettings: Record<
                      string,
                      { disabled?: boolean; priority?: number }
                    > = {};
                    config.artworkProviders.forEach((provider, index) => {
                      if (!provider.isEnabled) {
                        artworkSettings[provider.id] = { disabled: true };
                      } else if (index !== 0) {
                        artworkSettings[provider.id] = { priority: index + 1 };
                      }
                    });
                    if (Object.keys(artworkSettings).length > 0) {
                      localStorage.setItem(
                        "LIVE_LYRICS_ARTWORK_SETTINGS",
                        JSON.stringify(artworkSettings),
                      );
                      debugLog(
                        "Set artwork provider settings",
                        artworkSettings,
                      );
                    }
                  }

                  if (config.players && config.players.length > 0) {
                    const playerSettings: Record<
                      string,
                      { disabled?: boolean; priority?: number }
                    > = {};
                    config.players.forEach((provider, index) => {
                      if (!provider.isEnabled) {
                        playerSettings[provider.id] = { disabled: true };
                      } else if (index !== 0) {
                        playerSettings[provider.id] = { priority: index + 1 };
                      }
                    });
                    if (Object.keys(playerSettings).length > 0) {
                      localStorage.setItem(
                        "LIVE_LYRICS_PLAYER_SETTINGS",
                        JSON.stringify(playerSettings),
                      );
                      debugLog("Set player provider settings", playerSettings);
                    }
                  }

                  debugLog(
                    "App state cleared - providers use default enabled state unless explicitly configured",
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
