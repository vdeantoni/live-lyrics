import React from "react";
import { render, type RenderOptions, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TestProvider } from "./TestProvider";
import { type ProviderRegistryEntry } from "@/atoms/settingsAtoms";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  testRegistry?: Map<string, ProviderRegistryEntry>;
  /**
   * Whether to automatically wait for bootstrap to complete
   * @default true
   */
  waitForBootstrap?: boolean;
}

interface LightweightRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Whether to include QueryClient for components that need it
   * @default true
   */
  withQueryClient?: boolean;
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
 * ⚡ LIGHTWEIGHT: Simple render with minimal providers
 * Perfect for unit testing individual components without full app bootstrap
 *
 * @param ui - The component to render
 * @param options - Lightweight render options
 *
 * @example
 * ```typescript
 * // Just Jotai + QueryClient - super fast, no bootstrap
 * renderLightweight(<MyComponent />);
 *
 * // Skip QueryClient for components that don't need it
 * renderLightweight(<SimpleComponent />, { withQueryClient: false });
 * ```
 */
export const renderLightweight = (
  ui: React.ReactElement,
  options: LightweightRenderOptions = {},
) => {
  const { withQueryClient = true, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (withQueryClient) {
      const queryClient = createTestQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>{children}</JotaiProvider>
        </QueryClientProvider>
      );
    }

    return <JotaiProvider>{children}</JotaiProvider>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * 🔧 UNIT TEST: Lightweight render with specific atom mocks
 * For components that need specific atom values but no bootstrap
 *
 * @param ui - The component to render
 * @param atomMocks - Object mapping atoms to their mock values
 * @param options - Additional render options
 *
 * @example
 * ```typescript
 * import { songInfoAtom, playerStateAtom } from '@/atoms/playerAtoms';
 *
 * renderWithAtomMocks(<PlayerControls />, {
 *   [songInfoAtom]: { name: "Test Song", artist: "Test Artist", duration: 120 },
 *   [playerStateAtom]: { isPlaying: false, currentTime: 0 }
 * });
 * ```
 */
export const renderWithAtomMocks = (
  ui: React.ReactElement,
  atomMocks: Record<string, unknown>,
  options: LightweightRenderOptions = {},
) => {
  // TODO: Implement proper atom mocking with Jotai
  // For now, fall back to lightweight render
  return renderLightweight(ui, options);
};

/**
 * 🚀 FULL INTEGRATION: Full provider registry with bootstrap
 * Use for integration tests and components that need complete app state
 *
 * @param ui - The component to render
 * @param options - Render options including optional testRegistry
 *
 * @example
 * ```typescript
 * // Simple usage (waits for bootstrap automatically)
 * await renderWithProviders(<MyComponent />);
 * expect(screen.getByText("Hello")).toBeInTheDocument();
 *
 * // With custom test registry
 * const customRegistry = createTestRegistry();
 * // Modify the registry by setting custom provider states
 * customRegistry.get("lrclib")!.status.isAvailable = false;
 * await renderWithProviders(<MyComponent />, { testRegistry: customRegistry });
 *
 * // Skip bootstrap waiting (useful for testing loading states)
 * await renderWithProviders(<MyComponent />, { waitForBootstrap: false });
 * expect(screen.getByTestId("loading")).toBeInTheDocument();
 * ```
 */
export const renderWithProviders = async (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const { testRegistry, waitForBootstrap = true, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProvider testRegistry={testRegistry}>{children}</TestProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  // Wait for bootstrap to complete by default
  if (waitForBootstrap) {
    await waitFor(() => {
      expect(result.queryByTestId("loading")).not.toBeInTheDocument();
    });
  }

  return result;
};

/**
 * Simple render function that just wraps with TestProvider but doesn't wait
 * Useful when you need more control over the bootstrap process
 *
 * @example
 * ```typescript
 * // Test loading states manually
 * const { getByTestId } = renderWithProvidersOnly(<MyComponent />);
 * expect(getByTestId("loading")).toBeInTheDocument();
 *
 * // Or with custom registry
 * const customRegistry = createTestRegistry();
 * const { getByTestId } = renderWithProvidersOnly(<MyComponent />, {
 *   testRegistry: customRegistry
 * });
 * ```
 */
export const renderWithProvidersOnly = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const { testRegistry, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProvider testRegistry={testRegistry}>{children}</TestProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
