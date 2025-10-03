import React from "react";
import { expect } from "vitest";
import { render, type RenderOptions, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider, useSetAtom } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TestProvider } from "./TestProvider";
import type { LyricsProvider, ArtworkProvider, Player } from "@/types";
import type { ProviderConfig } from "@/types/appState";
import { createTestProviderConfigs } from "./testRegistryFactory";
import type { Atom } from "jotai";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  customProviders?: {
    lyricsProviders?: ProviderConfig<LyricsProvider>[];
    artworkProviders?: ProviderConfig<ArtworkProvider>[];
    players?: ProviderConfig<Player>[];
  };
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

interface AtomMockRenderOptions extends Omit<RenderOptions, "wrapper"> {
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
        gcTime: 0, // Updated from cacheTime
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Create default test providers for Jotai atoms
 * These are ProviderConfig objects that work with providerRegistryAPI.replaceAll()
 */
export const createJotaiTestProviders = () => {
  return createTestProviderConfigs();
};

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
 * @param atomMocks - Map of atoms to their mock values
 * @param options - Additional render options
 *
 * @example
 * ```typescript
 * import { songInfoAtom } from '@/atoms/playerAtoms';
 *
 * renderWithAtomMocks(<PlayerControls />, {
 *   [songInfoAtom]: {
 *     name: "Test Song",
 *     artist: "Test Artist",
 *     duration: 120,
 *     currentTime: 30,
 *     isPlaying: false,
 *   }
 * });
 * ```
 */
export const renderWithAtomMocks = (
  ui: React.ReactElement,
  atomMocks: Map<Atom<unknown>, unknown>,
  options: AtomMockRenderOptions = {},
) => {
  const { withQueryClient = true, ...renderOptions } = options;

  // Component to set a single atom value
  const AtomSetter: React.FC<{ atom: Atom<unknown>; value: unknown }> = ({
    atom,
    value,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setAtom = useSetAtom(atom as any);
    React.useEffect(() => {
      setAtom(value as never);
    }, [setAtom, value]);
    return null;
  };

  // Component to hydrate all atoms with mock values
  const AtomHydrator: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    // Convert Map to array for stable iteration
    const atomEntries = React.useMemo(
      () => Array.from(atomMocks.entries()),
      [],
    );

    return (
      <>
        {atomEntries.map(([atom, value], index) => (
          <AtomSetter key={index} atom={atom} value={value} />
        ))}
        {children}
      </>
    );
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (withQueryClient) {
      const queryClient = createTestQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>
            <AtomHydrator>{children}</AtomHydrator>
          </JotaiProvider>
        </QueryClientProvider>
      );
    }

    return (
      <JotaiProvider>
        <AtomHydrator>{children}</AtomHydrator>
      </JotaiProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * 🚀 FULL INTEGRATION: Full provider setup with Jotai atoms and bootstrap
 * Use for integration tests and components that need complete app state
 *
 * @param ui - The component to render
 * @param options - Render options including optional custom providers
 *
 * @example
 * ```typescript
 * // Simple usage (waits for bootstrap automatically)
 * await renderWithProviders(<MyComponent />);
 * expect(screen.getByText("Hello")).toBeInTheDocument();
 *
 * // With custom providers
 * const customProviders = createJotaiTestProviders();
 * // Modify providers as needed
 * await renderWithProviders(<MyComponent />, { customProviders });
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
  const {
    customProviders,
    waitForBootstrap = true,
    ...renderOptions
  } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProvider customProviders={customProviders}>{children}</TestProvider>
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
 * // Or with custom providers
 * const customProviders = createJotaiTestProviders();
 * const { getByTestId } = renderWithProvidersOnly(<MyComponent />, {
 *   customProviders
 * });
 * ```
 */
export const renderWithProvidersOnly = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const { customProviders, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProvider customProviders={customProviders}>{children}</TestProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
