import React from "react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useEventSync } from "@/adapters/react";
import { coreAppStateAtom } from "@/atoms/appState";
import { providerService } from "@/core/services/ProviderService";
import { settingsService } from "@/core/services/SettingsService";
import { createTestProviderConfigs } from "./testRegistryFactory";
import type { LyricsProvider, ArtworkProvider, Player } from "@/types";
import type { ProviderConfig } from "@/types/appState";

interface TestProviderProps {
  children: React.ReactNode;
  customProviders?: {
    lyricsProviders?: ProviderConfig<LyricsProvider>[];
    artworkProviders?: ProviderConfig<ArtworkProvider>[];
    players?: ProviderConfig<Player>[];
  };
}

/**
 * Test provider that sets up Jotai atoms directly for testing
 * Uses direct service calls to replace providers and clear settings
 *
 * @example
 * ```typescript
 * import { TestProvider } from "./TestProvider";
 * import { createTestProviderConfigs } from "./testRegistryFactory";
 *
 * // Basic usage with default test providers
 * <TestProvider>
 *   <YourComponent />
 * </TestProvider>
 *
 * // With custom providers
 * const customProviders = createTestProviderConfigs();
 * <TestProvider customProviders={customProviders}>
 *   <YourComponent />
 * </TestProvider>
 * ```
 */
export const TestProvider: React.FC<TestProviderProps> = ({
  children,
  customProviders,
}) => {
  return (
    <JotaiProvider>
      <JotaiTestSetup customProviders={customProviders}>
        <BootstrapWrapper>{children}</BootstrapWrapper>
      </JotaiTestSetup>
    </JotaiProvider>
  );
};

const JotaiTestSetup: React.FC<TestProviderProps> = ({
  children,
  customProviders,
}) => {
  // ✅ Use useEffect for side effects (not useMemo)
  React.useEffect(() => {
    const providers = customProviders || createTestProviderConfigs();

    // Build the provider registry structure
    const newProviders = {
      players: providers.players || [],
      lyrics: providers.lyricsProviders || [],
      artwork: providers.artworkProviders || [],
    };

    // Replace providers and clear settings using direct service calls
    providerService.replaceProviders(newProviders);
    settingsService.clearAllSettings();
  }, [customProviders]);

  return <>{children}</>;
};

const BootstrapWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the simplified bootstrap hook without passing registry
  useBootstrap();
  // Set up event synchronization for settings changes
  useEventSync();
  const appState = useAtomValue(coreAppStateAtom);

  // Show loading state until bootstrap is complete
  if (appState.isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (appState.error) {
    return <div data-testid="error">{appState.error}</div>;
  }

  return <>{children}</>;
};
