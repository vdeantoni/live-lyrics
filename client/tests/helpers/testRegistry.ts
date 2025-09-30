import type { ProviderRegistryEntry } from "@/atoms/settingsAtoms";

/**
 * Factory function to create a test provider registry with consistent test data
 * This ensures all tests use the same mock data structure
 */
export const createTestRegistry = (): Map<string, ProviderRegistryEntry> => {
  const registry = new Map<string, ProviderRegistryEntry>();

  // Lyrics providers
  const lyricsProviders = [
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
      description: "Local server with LrcLib fallback",
      priority: 2,
      isEnabled: true,
      isAvailable: true,
    },
    {
      id: "simulated",
      name: "Simulated",
      description: "Hardcoded demo lyrics",
      priority: 3,
      isEnabled: false,
      isAvailable: true,
    },
  ];

  lyricsProviders.forEach((provider) => {
    registry.set(provider.id, {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "lyrics" as const,
        load: async () => ({ isAvailable: () => Promise.resolve(true) }),
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
  const artworkProviders = [
    {
      id: "itunes",
      name: "iTunes",
      description: "iTunes Search API",
      priority: 1,
      isEnabled: true,
      isAvailable: true,
    },
  ];

  artworkProviders.forEach((provider) => {
    registry.set(provider.id, {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "artwork" as const,
        load: async () => ({ isAvailable: () => Promise.resolve(true) }),
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
  const playerSources = [
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
  ];

  playerSources.forEach((provider) => {
    registry.set(provider.id, {
      config: {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        type: "player-source" as const,
        load: async () => ({ isAvailable: () => Promise.resolve(true) }),
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
