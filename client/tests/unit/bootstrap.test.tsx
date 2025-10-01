import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../helpers/testUtils";
import { useAtomValue } from "jotai";
import { coreAppStateAtom } from "@/atoms/appState";

// Simple test component that reads app state
const TestBootstrapComponent = () => {
  const appState = useAtomValue(coreAppStateAtom);

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
    // Use regular renderWithProviders which waits for bootstrap completion
    await renderWithProviders(<TestBootstrapComponent />);

    // The component should exist and not throw errors
    const appState = screen.getByTestId("app-state");
    expect(appState).toBeInTheDocument();

    // Since we're using test registry, bootstrap should complete and show ready state
    expect(screen.getByTestId("ready")).toBeInTheDocument();
  });
});
