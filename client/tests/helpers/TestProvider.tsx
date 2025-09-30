import React from "react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBootstrap } from "@/hooks/useBootstrap";
import {
  appStateAtom,
  type ProviderRegistryEntry,
} from "@/atoms/settingsAtoms";
import { createTestRegistry } from "./testRegistry";

interface TestProviderProps {
  children: React.ReactNode;
  testRegistry?: Map<string, ProviderRegistryEntry>;
}

// Create a test QueryClient that doesn't retry
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Test provider that automatically handles bootstrap and loading states
 * Use this instead of manually wrapping components with JotaiProvider + TestWrapper
 *
 * @example
 * ```typescript
 * import { TestProvider } from "./TestProvider";
 * import { createTestRegistry } from "./testRegistry";
 *
 * // Basic usage with default test registry
 * <TestProvider>
 *   <YourComponent />
 * </TestProvider>
 *
 * // With custom registry modifications
 * const customRegistry = createTestRegistry();
 * customRegistry.get("lrclib")!.status.isAvailable = false;
 *
 * <TestProvider testRegistry={customRegistry}>
 *   <YourComponent />
 * </TestProvider>
 * ```
 */
export const TestProvider: React.FC<TestProviderProps> = ({
  children,
  testRegistry,
}) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <BootstrapWrapper testRegistry={testRegistry}>
          {children}
        </BootstrapWrapper>
      </JotaiProvider>
    </QueryClientProvider>
  );
};

const BootstrapWrapper: React.FC<TestProviderProps> = ({
  children,
  testRegistry,
}) => {
  const registry = testRegistry || createTestRegistry();
  useBootstrap(registry);
  const appState = useAtomValue(appStateAtom);

  // Show loading state until bootstrap is complete
  if (appState.isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (appState.error) {
    return <div data-testid="error">{appState.error}</div>;
  }

  return <>{children}</>;
};
