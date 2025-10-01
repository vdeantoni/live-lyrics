import React from "react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBootstrap } from "@/hooks/useBootstrap";
import { coreAppStateAtom } from "@/atoms/appState";
import { providerRegistryAPI } from "@/api/providerAPI";
import { createJotaiTestProviders } from "./testUtils";
import type { LyricsProvider, ArtworkProvider, Player } from "@/types";
import type { ProviderConfig } from "@/config/providers";

interface TestProviderProps {
  children: React.ReactNode;
  customProviders?: {
    lyricsProviders?: ProviderConfig<LyricsProvider>[];
    artworkProviders?: ProviderConfig<ArtworkProvider>[];
    players?: ProviderConfig<Player>[];
  };
}

// Create a test QueryClient that doesn't retry
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Updated from cacheTime
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Test provider that sets up Jotai atoms directly for testing
 * Uses the new providerRegistryAPI.replaceAll approach
 *
 * @example
 * ```typescript
 * import { TestProvider } from "./TestProvider";
 * import { createJotaiTestProviders } from "./testUtils";
 *
 * // Basic usage with default test providers
 * <TestProvider>
 *   <YourComponent />
 * </TestProvider>
 *
 * // With custom providers
 * const customProviders = createJotaiTestProviders();
 * <TestProvider customProviders={customProviders}>
 *   <YourComponent />
 * </TestProvider>
 * ```
 */
export const TestProvider: React.FC<TestProviderProps> = ({
  children,
  customProviders,
}) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <JotaiTestSetup customProviders={customProviders}>
          <BootstrapWrapper>{children}</BootstrapWrapper>
        </JotaiTestSetup>
      </JotaiProvider>
    </QueryClientProvider>
  );
};

const JotaiTestSetup: React.FC<TestProviderProps> = ({
  children,
  customProviders,
}) => {
  // Set up test providers synchronously on first render
  React.useMemo(() => {
    const providers = customProviders || createJotaiTestProviders();
    providerRegistryAPI.replaceAll(providers);
  }, [customProviders]);

  return <>{children}</>;
};

const BootstrapWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the simplified bootstrap hook without passing registry
  useBootstrap();
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
