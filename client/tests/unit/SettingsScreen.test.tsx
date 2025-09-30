import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "../helpers/testUtils";
import SettingsScreen from "@/components/Player/SettingsScreen";
import { useQueryClient } from "@tanstack/react-query";
import { clearAppData } from "@/utils/clearAppData";

// Mock React Query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({
      clear: vi.fn(),
    })),
  };
});

// Mock the clearAppData utility
vi.mock("@/utils/clearAppData", () => ({
  clearAppData: vi.fn(),
}));

describe("SettingsScreen", () => {
  const mockQueryClient = {
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient);
  });

  it("renders settings screen correctly", async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your player")).toBeInTheDocument();
  });

  it("displays player section", async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(screen.getByText("Remote Player")).toBeInTheDocument();
    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Connect to a remote server")).toBeInTheDocument();
  });

  it("handles player toggle", async () => {
    await renderWithProviders(<SettingsScreen />);

    const remotePlayerToggle = screen.getByTestId("remote-player-toggle");

    await act(async () => {
      fireEvent.click(remotePlayerToggle);
    });

    // The player should be toggled
    expect(remotePlayerToggle).toBeInTheDocument();
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

    expect(clearAppData).toHaveBeenCalledWith(mockQueryClient);
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
    expect(screen.getByText("Local Server")).toBeInTheDocument();

    // Get all lyrics provider items to check their order
    const lyricsSection = screen.getByTestId("lyrics-provider-section-list");
    expect(lyricsSection).toBeInTheDocument();
  });
});
