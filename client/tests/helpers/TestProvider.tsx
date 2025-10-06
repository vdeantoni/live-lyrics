import React from "react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useBootstrap } from "@/hooks/useBootstrap";
import { coreAppStateAtom } from "@/atoms/appState";
import { providerAPI } from "@/api/providerAPI";
import { createJotaiTestProviders } from "./testUtils";
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
 * Uses providerAPI.replaceAll approach
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
    const providers = customProviders || createJotaiTestProviders();
    providerAPI.replaceAll(providers);
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
