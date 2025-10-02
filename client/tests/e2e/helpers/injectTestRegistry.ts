import type { Page } from "@playwright/test";

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
  await page.addInitScript(() => {
    // Enhanced error handling and debugging - always log during tests
    const debugLog = (message: string, data?: unknown) => {
      console.log(`[TestRegistry] ${message}`, data || "");
    };

    // Wait for the Jotai atoms and provider API to be available
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

                debugLog("providerRegistryAPI was found!");

                // Create singleton-like test player state (shared across provider loads)
                const testPlayerState = {
                  currentTime: 0,
                  isPlaying: false,
                  startTime: 0,
                };

                // Create mock providers with the same interface as unit tests
                const createTestLyricsProvider = (
                  providerId: string,
                  providerName: string,
                ) => ({
                  getId: () => providerId,
                  getName: () => providerName,
                  getDescription: () => `${providerName} test provider`,
                  isAvailable: () => Promise.resolve(true),
                  isFetching: () => Promise.resolve(false),
                  supportsLyrics: async (song: {
                    name: string;
                    artist: string;
                    album?: string;
                  }) => {
                    // Support Bohemian Rhapsody only for testing
                    return (
                      song.name === "Bohemian Rhapsody" &&
                      song.artist === "Queen"
                    );
                  },
                  getLyrics: async (song: {
                    name: string;
                    artist: string;
                    album?: string;
                  }) => {
                    debugLog(`${providerName} getLyrics called with:`, song);
                    // Return lyrics for "Bohemian Rhapsody" by "Queen" (exact match)
                    if (
                      song.name === "Bohemian Rhapsody" &&
                      song.artist === "Queen"
                    ) {
                      debugLog(
                        `${providerName} returning Bohemian Rhapsody lyrics`,
                      );
                      // Return LRC formatted string (as expected by the LyricsProvider interface)
                      return `[00:00.00]Is this the real life?
[00:15.00]Is this just fantasy?
[00:30.00]Caught in a landslide
[00:45.00]No escape from reality
[01:00.00]Open your eyes
[01:15.00]Look up to the skies and see
[01:30.00]I'm just a poor boy, I need no sympathy
[01:45.00]Because I'm easy come, easy go
[02:00.00]Little high, little low
[02:15.00]Any way the wind blows, doesn't really matter to me
[02:30.00]To me`;
                    }
                    debugLog(`${providerName} no lyrics found for song:`, {
                      name: song.name,
                      artist: song.artist,
                    });
                    return null;
                  },
                });

                const createTestArtworkProvider = (
                  providerId: string,
                  providerName: string,
                ) => ({
                  getId: () => providerId,
                  getName: () => providerName,
                  getDescription: () => `${providerName} test provider`,
                  isAvailable: () => Promise.resolve(true),
                  isFetching: () => Promise.resolve(false),
                  getArtwork: async () => {
                    debugLog(
                      `${providerName} getArtwork called - returning empty array`,
                    );
                    return [];
                  },
                });

                const createTestPlayerProvider = (
                  providerId: string,
                  providerName: string,
                ) => {
                  return {
                    getId: () => providerId,
                    getName: () => providerName,
                    getDescription: () => `${providerName} test player`,
                    isAvailable: () => Promise.resolve(true),
                    getSong: async () => {
                      // Simulate time progression when playing (using shared state)
                      if (testPlayerState.isPlaying) {
                        const now = Date.now();
                        testPlayerState.currentTime = Math.min(
                          (now - testPlayerState.startTime) / 1000,
                          355,
                        ); // Cap at song duration
                      }

                      const song = {
                        name: "Bohemian Rhapsody",
                        artist: "Queen",
                        album: "A Night at the Opera",
                        duration: 355,
                        currentTime: testPlayerState.currentTime,
                        isPlaying: testPlayerState.isPlaying,
                      };
                      debugLog(`${providerName} getSong returning:`, song);
                      return song;
                    },
                    play: async () => {
                      debugLog(`${providerName} play() called`);
                      testPlayerState.isPlaying = true;
                      testPlayerState.startTime =
                        Date.now() - testPlayerState.currentTime * 1000; // Resume from current position
                    },
                    pause: async () => {
                      debugLog(`${providerName} pause() called`);
                      testPlayerState.isPlaying = false;
                    },
                    seek: async (time: number) => {
                      debugLog(`${providerName} seek(${time}) called`);
                      testPlayerState.currentTime = Math.max(
                        0,
                        Math.min(time, 355),
                      ); // Clamp to song duration
                      if (testPlayerState.isPlaying) {
                        testPlayerState.startTime = Date.now() - time * 1000;
                      }
                    },
                  };
                };

                // Create test providers (simplified set for E2E tests)
                const lyricsProviders = [
                  {
                    id: "lrclib",
                    name: "Test LrcLib",
                    description:
                      "Test lyrics provider (Bohemian Rhapsody only)",
                    load: async () => {
                      debugLog("Loading Test LrcLib provider");
                      return createTestLyricsProvider("lrclib", "Test LrcLib");
                    },
                  },
                ];

                const artworkProviders = [
                  {
                    id: "itunes",
                    name: "Test iTunes",
                    description: "Test artwork provider (no artwork)",
                    load: async () => {
                      debugLog("Loading Test iTunes provider");
                      return createTestArtworkProvider("itunes", "Test iTunes");
                    },
                  },
                ];

                const players = [
                  {
                    id: "local",
                    name: "Local",
                    description: "Local test player",
                    load: async () => {
                      debugLog("Loading Local test player");
                      return createTestPlayerProvider("local", "Local");
                    },
                  },
                ];

                // Replace all providers using the simplified Jotai-based API
                debugLog("Replacing all providers via providerRegistryAPI");
                providerRegistryAPI.replaceAll({
                  players,
                  lyricsProviders,
                  artworkProviders,
                });

                // CRITICAL: Clear any persisted settings to ensure clean test state
                // The new unified system automatically clears user overrides in replaceAll(),
                // but we also clear localStorage for extra safety
                try {
                  debugLog(
                    "Clearing persisted app state for clean test environment",
                  );

                  // Clear the new unified provider settings
                  localStorage.removeItem("LIVE_LYRICS_APP_PROVIDER_SETTINGS");

                  // Also clear any legacy settings that might interfere
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

                  debugLog(
                    "App state cleared - test providers will use natural availability",
                  );
                } catch (settingsError) {
                  debugLog(
                    "Warning: Could not clear app state:",
                    settingsError,
                  );
                }

                debugLog("Test registry setup completed successfully");
                resolve();
              } catch (error) {
                debugLog("Error loading provider API:", error);
                // If we haven't reached max attempts, try again
                if (attempts < maxAttempts) {
                  setTimeout(checkForAPI, 100);
                } else {
                  debugLog("Max attempts reached, failing");
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
      // Set up a fallback indicator for tests to detect the failure
      (window as Record<string, unknown>).__TEST_REGISTRY_FAILED__ = true;
    });
  });
};

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
}

interface CustomTestRegistryConfig {
  lyricsProviders?: CustomProviderConfig[];
  artworkProviders?: CustomProviderConfig[];
  players?: CustomProviderConfig[];
}

/**
 * Inject a custom test registry with configurable provider availability and enabled states
 * This is useful for testing error scenarios and provider fallback behavior
 */
export const injectCustomTestRegistry = async (
  page: Page,
  config: CustomTestRegistryConfig,
) => {
  await page.addInitScript((configStr: string) => {
    const config = JSON.parse(configStr) as CustomTestRegistryConfig;

    const debugLog = (message: string, data?: unknown) => {
      console.log(`[CustomTestRegistry] ${message}`, data || "");
    };

    const waitForProviderAPI = () => {
      return new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const checkForAPI = () => {
          attempts++;

          if (typeof window !== "undefined") {
            Promise.resolve().then(async () => {
              try {
                const providerRegistryAPI = window["providerRegistryAPI"];
                if (!providerRegistryAPI) {
                  throw new Error("providerRegistryAPI is undefined");
                }

                debugLog(
                  "providerRegistryAPI found, setting up custom registry",
                );

                // Create singleton-like test player state
                const testPlayerState = {
                  currentTime: 0,
                  isPlaying: false,
                  startTime: 0,
                };

                // Helper to create lyrics provider with custom availability
                const createCustomLyricsProvider = (
                  providerConfig: CustomProviderConfig,
                ) => ({
                  getId: () => providerConfig.id,
                  getName: () => providerConfig.name,
                  getDescription: () => providerConfig.description,
                  isAvailable: () =>
                    Promise.resolve(providerConfig.isAvailable),
                  isFetching: () => Promise.resolve(false),
                  supportsLyrics: async (song: {
                    name: string;
                    artist: string;
                    album?: string;
                  }) => {
                    if (!providerConfig.isAvailable) return false;
                    return (
                      song.name === "Bohemian Rhapsody" &&
                      song.artist === "Queen"
                    );
                  },
                  getLyrics: async (song: {
                    name: string;
                    artist: string;
                    album?: string;
                  }) => {
                    if (!providerConfig.isAvailable) return null;
                    if (
                      song.name === "Bohemian Rhapsody" &&
                      song.artist === "Queen"
                    ) {
                      return `[00:00.00]Is this the real life?
[00:15.00]Is this just fantasy?
[00:30.00]Caught in a landslide
[00:45.00]No escape from reality
[01:00.00]Open your eyes
[01:15.00]Look up to the skies and see
[01:30.00]I'm just a poor boy, I need no sympathy
[01:45.00]Because I'm easy come, easy go
[02:00.00]Little high, little low
[02:15.00]Any way the wind blows, doesn't really matter to me
[02:30.00]To me`;
                    }
                    return null;
                  },
                });

                // Helper to create artwork provider with custom availability
                const createCustomArtworkProvider = (
                  providerConfig: CustomProviderConfig,
                ) => ({
                  getId: () => providerConfig.id,
                  getName: () => providerConfig.name,
                  getDescription: () => providerConfig.description,
                  isAvailable: () =>
                    Promise.resolve(providerConfig.isAvailable),
                  isFetching: () => Promise.resolve(false),
                  getArtwork: async () => {
                    if (!providerConfig.isAvailable) return [];
                    return [];
                  },
                });

                // Helper to create player with custom availability
                const createCustomPlayerProvider = (
                  providerConfig: CustomProviderConfig,
                ) => ({
                  getId: () => providerConfig.id,
                  getName: () => providerConfig.name,
                  getDescription: () => providerConfig.description,
                  isAvailable: () =>
                    Promise.resolve(providerConfig.isAvailable),
                  getSong: async () => {
                    if (!providerConfig.isAvailable) return null;

                    if (testPlayerState.isPlaying) {
                      const now = Date.now();
                      testPlayerState.currentTime = Math.min(
                        (now - testPlayerState.startTime) / 1000,
                        355,
                      );
                    }

                    return {
                      name: "Bohemian Rhapsody",
                      artist: "Queen",
                      album: "A Night at the Opera",
                      duration: 355,
                      currentTime: testPlayerState.currentTime,
                      isPlaying: testPlayerState.isPlaying,
                    };
                  },
                  play: async () => {
                    testPlayerState.isPlaying = true;
                    testPlayerState.startTime =
                      Date.now() - testPlayerState.currentTime * 1000;
                  },
                  pause: async () => {
                    testPlayerState.isPlaying = false;
                  },
                  seek: async (time: number) => {
                    testPlayerState.currentTime = Math.max(
                      0,
                      Math.min(time, 355),
                    );
                    if (testPlayerState.isPlaying) {
                      testPlayerState.startTime = Date.now() - time * 1000;
                    }
                  },
                });

                // Build provider arrays from config
                const lyricsProviders =
                  config.lyricsProviders?.map((providerConfig) => ({
                    id: providerConfig.id,
                    name: providerConfig.name,
                    description: providerConfig.description,
                    load: async () => {
                      debugLog(
                        `Loading custom ${providerConfig.name} provider (available: ${providerConfig.isAvailable})`,
                      );
                      return createCustomLyricsProvider(providerConfig);
                    },
                  })) || [];

                const artworkProviders =
                  config.artworkProviders?.map((providerConfig) => ({
                    id: providerConfig.id,
                    name: providerConfig.name,
                    description: providerConfig.description,
                    load: async () => {
                      debugLog(
                        `Loading custom ${providerConfig.name} provider (available: ${providerConfig.isAvailable})`,
                      );
                      return createCustomArtworkProvider(providerConfig);
                    },
                  })) || [];

                const players =
                  config.players?.map((providerConfig) => ({
                    id: providerConfig.id,
                    name: providerConfig.name,
                    description: providerConfig.description,
                    load: async () => {
                      debugLog(
                        `Loading custom ${providerConfig.name} player (available: ${providerConfig.isAvailable})`,
                      );
                      return createCustomPlayerProvider(providerConfig);
                    },
                  })) || [];

                // Replace all providers
                debugLog("Replacing providers with custom configuration");
                providerRegistryAPI.replaceAll({
                  players:
                    players.length > 0
                      ? players
                      : [
                          {
                            id: "local",
                            name: "Local",
                            description: "Local test player",
                            load: async () => {
                              return createCustomPlayerProvider({
                                id: "local",
                                name: "Local",
                                description: "Local test player",
                                isEnabled: true,
                                isAvailable: true,
                              });
                            },
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
                            load: async () => {
                              return createCustomLyricsProvider({
                                id: "lrclib",
                                name: "Test LrcLib",
                                description: "Test lyrics provider",
                                isEnabled: true,
                                isAvailable: true,
                              });
                            },
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
                            load: async () => {
                              return createCustomArtworkProvider({
                                id: "itunes",
                                name: "Test iTunes",
                                description: "Test artwork provider",
                                isEnabled: true,
                                isAvailable: true,
                              });
                            },
                          },
                        ],
                });

                // Set up provider settings based on config
                try {
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
                } catch (settingsError) {
                  debugLog(
                    "Warning: Could not set custom settings:",
                    settingsError,
                  );
                }

                debugLog("Custom test registry setup completed");
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

    waitForProviderAPI().catch((error) => {
      console.error(
        "[CustomTestRegistry] Failed to inject custom test registry:",
        error,
      );
      (window as Record<string, unknown>).__TEST_REGISTRY_FAILED__ = true;
    });
  }, JSON.stringify(config));
};
