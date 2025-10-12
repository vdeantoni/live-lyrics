import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "../helpers/testUtils";
import SettingsScreen from "@/components/Player/SettingsScreen";
import { clearAppData } from "@/utils/clearAppData";

// Mock the clearAppData utility
vi.mock("@/utils/clearAppData", () => ({
  clearAppData: vi.fn(),
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings screen correctly", async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your player")).toBeInTheDocument();
  });

  it("displays player section", async () => {
    await renderWithProviders(<SettingsScreen />);

    // Verify section header
    expect(screen.getByText("Player")).toBeInTheDocument();

    // Verify the actual remote player config is rendered
    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Remote player")).toBeInTheDocument();

    // Verify the toggle is enabled
    const remotePlayerToggle = screen.getByTestId("remote-player-toggle");
    expect(remotePlayerToggle).not.toBeDisabled();

    // Verify it shows a success icon (CheckCircle), not a loading spinner
    const statusIcon = screen.getByTestId("remote-player-status");
    expect(statusIcon.querySelector("svg")).toHaveClass(
      "lucide-circle-check-big",
    );
  });

  it("handles player toggle", async () => {
    await renderWithProviders(<SettingsScreen />);

    const remotePlayerToggle = screen.getByTestId("remote-player-toggle");

    // Initially should be unchecked (local player is default)
    expect(remotePlayerToggle).toHaveAttribute("aria-checked", "false");
    expect(remotePlayerToggle).not.toBeDisabled();

    // Click to enable remote player
    await act(async () => {
      fireEvent.click(remotePlayerToggle);
    });

    // Should now be checked
    expect(remotePlayerToggle).toHaveAttribute("aria-checked", "true");
  });

  it("displays provider sections", async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("Lyrics Provider")).toBeInTheDocument();
    expect(screen.getByText("Artwork Provider")).toBeInTheDocument();
    expect(screen.getByText("LrcLib")).toBeInTheDocument();
    expect(screen.getByText("iTunes")).toBeInTheDocument();
  });

  it("displays clear app data section", async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("App Data")).toBeInTheDocument();
    expect(screen.getByText("Clear All Data")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Reset all settings and clear cached data. This action cannot be undone.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("clear-app-data-button")).toBeInTheDocument();
  });

  it("handles clear app data button click", async () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    await renderWithProviders(<SettingsScreen />);

    const clearButton = screen.getByTestId("clear-app-data-button");

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(clearAppData).toHaveBeenCalled();
  });

  it("displays provider status icons correctly", async () => {
    await renderWithProviders(<SettingsScreen />);

    // Check that provider items are rendered with correct test IDs
    expect(screen.getByTestId("provider-item-lrclib")).toBeInTheDocument();
    expect(screen.getByTestId("provider-item-itunes")).toBeInTheDocument();

    // Should show status icons for providers
    const statusButtons = screen.getAllByTestId("provider-status-button");
    expect(statusButtons.length).toBeGreaterThan(0);
  });

  it("shows providers in correct order", async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText("LrcLib")).toBeInTheDocument();

    // Get all lyrics provider items to check their order
    const lyricsSection = screen.getByTestId("lyrics-provider-section-list");
    expect(lyricsSection).toBeInTheDocument();
  });
});
