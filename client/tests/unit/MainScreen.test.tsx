import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../helpers/testUtils";
import MainScreen from "@/components/Player/MainScreen";

// Mock the child components
vi.mock("@/components/Player/LyricsScreen", () => ({
  default: () => <div data-testid="lyrics-screen">Lyrics Screen</div>,
}));

vi.mock("@/components/Player/SettingsScreen", () => ({
  default: () => <div data-testid="settings-screen">Settings Screen</div>,
}));

vi.mock("@/components/Player/LoadingScreen", () => ({
  default: () => <div data-testid="loading-screen">Loading Screen</div>,
}));

describe("MainScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders lyrics screen when settings are closed and app is loaded", async () => {
    await renderWithProviders(<MainScreen />);

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
  });

  it("renders settings screen when settings are open", async () => {
    await renderWithProviders(<MainScreen />);

    // Click to open settings
    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    // Wait for settings screen to appear (AnimatePresence needs time)
    const settingsScreen = await screen.findByTestId("settings-screen");

    // Both screens are rendered now - lyrics stays in place, settings slides over
    expect(settingsScreen).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("close-settings-button")).toBeInTheDocument();
  });

  it("handles settings button click", async () => {
    await renderWithProviders(<MainScreen />);

    const settingsButton = screen.getByTestId("settings-button");

    // Initially settings should be closed
    expect(screen.queryByTestId("settings-screen")).not.toBeInTheDocument();

    // Click to open settings
    fireEvent.click(settingsButton);

    // Wait for settings screen to appear (AnimatePresence needs time)
    const settingsScreen = await screen.findByTestId("settings-screen");
    expect(settingsScreen).toBeInTheDocument();
  });

  it("has proper accessibility labels", async () => {
    await renderWithProviders(<MainScreen />);

    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
  });
});
