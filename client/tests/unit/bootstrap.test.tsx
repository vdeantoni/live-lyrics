import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { appStateAtom } from "@/atoms/settingsAtoms";
import { useBootstrap } from "@/hooks/useBootstrap";
import { createTestRegistry } from "../helpers/testRegistry";

// Simple test component that uses bootstrap
const TestBootstrapComponent = () => {
  const testRegistry = createTestRegistry();
  useBootstrap(testRegistry);
  const appState = useAtomValue(appStateAtom);

  return (
    <div data-testid="app-state">
      {appState.isLoading && <div data-testid="loading">Loading...</div>}
      {appState.isReady && <div data-testid="ready">Ready</div>}
      {appState.error && <div data-testid="error">{appState.error}</div>}
    </div>
  );
};

describe("Bootstrap System", () => {
  it("should initialize app state correctly", async () => {
    const { getByTestId } = render(
      <JotaiProvider>
        <TestBootstrapComponent />
      </JotaiProvider>,
    );

    // Should show loading initially or ready after bootstrap
    const appState = getByTestId("app-state");
    expect(appState).toBeTruthy();

    // The component should exist and not throw errors
    expect(appState).toBeInTheDocument();

    // Wait for bootstrap to complete and show ready state
    await waitFor(() => {
      expect(screen.queryByTestId("ready")).toBeInTheDocument();
    });
  });
});
