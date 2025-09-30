import type { ProviderRegistryEntry } from "@/atoms/settingsAtoms";

/**
 * Configuration for creating test registries
 */
export interface TestRegistryConfig {
  /** Configuration for lyrics providers */
  lyricsProviders?: Array<{
    id: string;
    name: string;
    description: string;
    priority: number;
    isEnabled: boolean;
    isAvailable: boolean;
  }>;
  /** Configuration for artwork providers */
  artworkProviders?: Array<{
    id: string;
    name: string;
    description: string;
    priority: number;
    isEnabled: boolean;
    isAvailable: boolean;
  }>;
  /** Configuration for player sources */
  playerSources?: Array<{
    id: string;
    name: string;
    description: string;
    priority: number;
    isEnabled: boolean;
    isAvailable: boolean;
  }>;
}

/**
 * Default test registry configuration
 * This defines the standard test behavior for all tests
 */
export const DEFAULT_TEST_CONFIG: TestRegistryConfig = {
  lyricsProviders: [
    {
      id: "lrclib",
      name: "LrcLib",
      description: "Community lyrics database",
      priority: 1,
      isEnabled: true,
      isAvailable: true,
    },
    {
      id: "local-server",
      name: "Local Server",
      description: "Local server",
      priority: 2,
      isEnabled: true,
      isAvailable: true,
    },
  ],
  artworkProviders: [
    {
      id: "itunes",
      name: "iTunes",
      description: "iTunes Search API",
      priority: 1,
      isEnabled: true,
      isAvailable: true,
    },
  ],
  playerSources: [
    {
      id: "local",
      name: "Local",
      description: "Local player",
      priority: 1,
      isEnabled: true,
      isAvailable: true,
    },
    {
      id: "remote",
      name: "Server",
      description: "Connect to a remote server",
      priority: 2,
      isEnabled: false,
      isAvailable: true,
    },
  ],
};

/**
 * Mock lyrics data for Bohemian Rhapsody
 * Centralized constant used across all test files
 */
export const BOHEMIAN_RHAPSODY_LYRICS = {
  syncType: "LINE_SYNCED" as const,
  lines: [
    { startTimeMs: 0, words: "Is this the real life?" },
    { startTimeMs: 15000, words: "Is this just fantasy?" },
    { startTimeMs: 30000, words: "Caught in a landslide" },
    { startTimeMs: 45000, words: "No escape from reality" },
    { startTimeMs: 60000, words: "Open your eyes" },
    { startTimeMs: 75000, words: "Look up to the skies and see" },
    { startTimeMs: 90000, words: "I'm just a poor boy, I need no sympathy" },
    { startTimeMs: 105000, words: "Because I'm easy come, easy go" },
    { startTimeMs: 120000, words: "Little high, little low" },
    {
      startTimeMs: 135000,
      words: "Any way the wind blows, doesn't really matter to me",
    },
    { startTimeMs: 150000, words: "To me" },
  ],
};

/**
 * Mock lyrics provider function that only supports Bohemian Rhapsody
 */
export const createMockLyricsProvider = (
  providerId: string,
  providerName: string,
) => ({
  getId: () => providerId,
  getName: () => providerName,
  isAvailable: () => Promise.resolve(true),
  getLyrics: async (song: { name: string; artist: string; album?: string }) => {
    // Only return lyrics for "Bohemian Rhapsody" by "Queen"
    if (
      song.name.toLowerCase().includes("bohemian rhapsody") &&
      song.artist.toLowerCase().includes("queen")
    ) {
      return BOHEMIAN_RHAPSODY_LYRICS;
    }
    // Return null for all other songs (no lyrics found)
    return null;
  },
});

/**
 * Mock artwork provider function that returns empty results
 */
export const createMockArtworkProvider = (
  providerId: string,
  providerName: string,
) => ({
  getId: () => providerId,
  getName: () => providerName,
  isAvailable: () => Promise.resolve(true),
  getArtwork: async () => {
    // Return empty array - no artwork available
    return [];
  },
});

/**
 * Mock player provider function
 */
export const createMockPlayerProvider = (
  providerId: string,
  providerName: string,
) => ({
  getId: () => providerId,
  getName: () => providerName,
  isAvailable: () => Promise.resolve(true),
  // Player methods would go here in real implementation
});

/**
 * Create a test registry for unit/integration tests
 * Uses actual functions that can be called
 */
export const createTestRegistry = (
  customConfig: Partial<TestRegistryConfig> = {},
): Map<string, ProviderRegistryEntry> => {
  const config = { ...DEFAULT_TEST_CONFIG, ...customConfig };
  const registry = new Map<string, ProviderRegistryEntry>();

  // Lyrics providers
  config.lyricsProviders?.forEach((provider) => {
    registry.set(provider.id, {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "lyrics" as const,
        load: async () => createMockLyricsProvider(provider.id, provider.name),
      },
      status: {
        isAvailable: provider.isAvailable,
        isLoading: false,
        lastChecked: new Date(),
      },
      userPreferences: {
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    });
  });

  // Artwork providers
  config.artworkProviders?.forEach((provider) => {
    registry.set(provider.id, {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "artwork" as const,
        load: async () => createMockArtworkProvider(provider.id, provider.name),
      },
      status: {
        isAvailable: provider.isAvailable,
        isLoading: false,
        lastChecked: new Date(),
      },
      userPreferences: {
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    });
  });

  // Player sources
  config.playerSources?.forEach((provider) => {
    registry.set(provider.id, {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "player-source" as const,
        load: async () => createMockPlayerProvider(provider.id, provider.name),
      },
      status: {
        isAvailable: provider.isAvailable,
        isLoading: false,
        lastChecked: new Date(),
      },
      userPreferences: {
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    });
  });

  return registry;
};

/**
 * Create serializable registry data for E2E tests
 * Returns plain objects that can be JSON.stringify'd
 */
export const createSerializableTestRegistry = (
  customConfig: Partial<TestRegistryConfig> = {},
) => {
  const config = { ...DEFAULT_TEST_CONFIG, ...customConfig };
  const registryData: Record<string, unknown> = {};

  // Lyrics providers
  config.lyricsProviders?.forEach((provider) => {
    registryData[provider.id] = {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "lyrics" as const,
        // Store provider details for E2E reconstruction
        _testProviderType: "lyrics",
      },
      status: {
        isAvailable: provider.isAvailable,
        isLoading: false,
        lastChecked: new Date(),
      },
      userPreferences: {
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    };
  });

  // Artwork providers
  config.artworkProviders?.forEach((provider) => {
    registryData[provider.id] = {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "artwork" as const,
        _testProviderType: "artwork",
      },
      status: {
        isAvailable: provider.isAvailable,
        isLoading: false,
        lastChecked: new Date(),
      },
      userPreferences: {
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    };
  });

  // Player sources
  config.playerSources?.forEach((provider) => {
    registryData[provider.id] = {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "player-source" as const,
        _testProviderType: "player-source",
      },
      status: {
        isAvailable: provider.isAvailable,
        isLoading: false,
        lastChecked: new Date(),
      },
      userPreferences: {
        isEnabled: provider.isEnabled,
        priority: provider.priority,
      },
    };
  });

  return registryData;
};
