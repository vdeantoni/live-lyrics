import type { ProviderRegistryEntry } from "@/atoms/settingsAtoms";

/**
 * Factory function to create a test provider registry with consistent test data
 * This ensures all tests use the same mock data structure
 *
 * @returns Map containing mock providers for lyrics, artwork, and player sources
 *
 * @example
 * ```typescript
 * import { createTestRegistry } from "./testRegistry";
 * import { renderWithProviders } from "./testUtils";
 *
 * // Basic usage - creates registry with default mock data
 * const testRegistry = createTestRegistry();
 * // Contains: LrcLib, Local Server, Simulated (lyrics)
 * // Contains: iTunes (artwork)
 * // Contains: Local, Remote (player sources)
 *
 * // Modify registry for specific test scenarios
 * const customRegistry = createTestRegistry();
 * customRegistry.get("lrclib")!.status.isAvailable = false;
 * customRegistry.get("lrclib")!.userPreferences.isEnabled = false;
 *
 * await renderWithProviders(<MyComponent />, { testRegistry: customRegistry });
 * ```
 *
 * @example
 * ```typescript
 * // Testing bootstrap directly with proper imports
 * import { render, screen, waitFor } from "@testing-library/react";
 * import { Provider as JotaiProvider, useAtomValue } from "jotai";
 * import { useBootstrap } from "@/hooks/useBootstrap";
 * import { appStateAtom } from "@/atoms/settingsAtoms";
 * import { createTestRegistry } from "./testRegistry";
 *
 * const TestComponent = () => {
 *   const testRegistry = createTestRegistry();
 *   useBootstrap(testRegistry);
 *   const appState = useAtomValue(appStateAtom);
 *
 *   return (
 *     <div>
 *       {appState.isLoading && <div data-testid="loading">Loading</div>}
 *       {appState.isReady && <div data-testid="ready">Ready</div>}
 *     </div>
 *   );
 * };
 *
 * render(
 *   <JotaiProvider>
 *     <TestComponent />
 *   </JotaiProvider>
 * );
 *
 * await waitFor(() => {
 *   expect(screen.getByTestId("ready")).toBeInTheDocument();
 * });
 * ```
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
      description: "Local server",
      priority: 2,
      isEnabled: true,
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
