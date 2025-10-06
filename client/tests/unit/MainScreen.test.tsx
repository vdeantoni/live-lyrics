import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers/testUtils";
import MainScreen from "@/components/Player/MainScreen";
import { useSetAtom } from "jotai";
import { toggleSearchAtom } from "@/atoms/appState";

// Test helper component that provides a button to toggle search
const MainScreenWithSearchToggle = () => {
  const toggleSearch = useSetAtom(toggleSearchAtom);
  return (
    <>
      <button data-testid="test-search-toggle" onClick={toggleSearch}>
        Toggle Search
      </button>
      <MainScreen />
    </>
  );
};

// Mock the child components
vi.mock("@/components/Player/LyricsScreen", () => ({
  default: () => <div data-testid="lyrics-screen">Lyrics Screen</div>,
}));

vi.mock("@/components/Player/SettingsScreen", () => ({
  default: () => <div data-testid="settings-screen">Settings Screen</div>,
}));

vi.mock("@/components/Player/SearchScreen", () => ({
  default: () => <div data-testid="search-screen">Search Screen</div>,
}));

vi.mock("@/components/Player/LoadingScreen", () => ({
  default: () => <div data-testid="loading-screen">Loading Screen</div>,
}));

vi.mock("@/components/Player/EmptyScreen", () => ({
  default: () => <div data-testid="empty-screen">Empty Screen</div>,
}));

describe("MainScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders lyrics screen or empty screen when app is loaded", async () => {
    await renderWithProviders(<MainScreen />);

    // Should show either lyrics or empty screen (depends on player state timing)
    await waitFor(() => {
      const hasLyricsScreen = screen.queryByTestId("lyrics-screen");
      const hasEmptyScreen = screen.queryByTestId("empty-screen");
      expect(hasLyricsScreen || hasEmptyScreen).toBeTruthy();
    });

    expect(screen.queryByTestId("settings-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
  });

  it("renders settings screen when settings are open", async () => {
    await renderWithProviders(<MainScreen />);

    // Wait for content to load (either screen is fine)
    await waitFor(() => {
      const hasLyricsScreen = screen.queryByTestId("lyrics-screen");
      const hasEmptyScreen = screen.queryByTestId("empty-screen");
      expect(hasLyricsScreen || hasEmptyScreen).toBeTruthy();
    });

    // Click to open settings
    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    // Wait for settings screen to appear (AnimatePresence needs time)
    const settingsScreen = await screen.findByTestId("settings-screen");

    // Settings should be visible
    expect(settingsScreen).toBeInTheDocument();
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("close-overlay-button")).toBeInTheDocument();
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

  it("opens search screen and closes it with the close button", async () => {
    await renderWithProviders(<MainScreenWithSearchToggle />);

    // Initially search should be closed
    expect(screen.queryByTestId("search-screen")).not.toBeInTheDocument();

    // Click test button to open search
    const toggleButton = screen.getByTestId("test-search-toggle");
    fireEvent.click(toggleButton);

    // Wait for search screen to appear
    const searchScreen = await screen.findByTestId("search-screen");
    expect(searchScreen).toBeInTheDocument();

    // Close button should be visible with proper label
    const closeButton = screen.getByTestId("close-overlay-button");
    expect(closeButton).toHaveAttribute("aria-label", "Close search");

    // Click the close button
    fireEvent.click(closeButton);

    // Search screen should disappear
    await waitFor(() => {
      expect(screen.queryByTestId("search-screen")).not.toBeInTheDocument();
    });
  });
});
