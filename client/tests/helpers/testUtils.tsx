import React from "react";
import { render, type RenderOptions, waitFor } from "@testing-library/react";
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

/**
 * Custom render function that automatically wraps components with TestProvider
 * This handles bootstrap initialization and loading states automatically
 *
 * @param ui - The component to render
 * @param options - Render options including optional testRegistry
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
