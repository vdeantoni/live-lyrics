import React from "react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
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
  return (
    <JotaiProvider>
      <BootstrapWrapper testRegistry={testRegistry}>
        {children}
      </BootstrapWrapper>
    </JotaiProvider>
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
