import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import SettingsScreen from "@/components/Player/SettingsScreen";
import { act } from "react";

// Import actual atoms
import {
  playerIdAtom,
  lyricsProviderIdAtom,
  artworkProviderIdAtom,
  lyricsProviderIdsAtom,
  artworkProviderIdsAtom,
  enabledLyricsProvidersAtom,
  enabledArtworkProvidersAtom,
  availablePlayersAtom,
  availableLyricsProvidersAtom,
  availableArtworkProvidersAtom,
  lyricsProvidersWithStatusAtom,
  artworkProvidersWithStatusAtom,
  playersWithStatusAtom,
  settingsAtom,
  checkLyricsProviderAvailabilityAtom,
  checkArtworkProviderAvailabilityAtom,
} from "@/atoms/settingsAtoms";

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(),
}));

// Mock the clearAppData utility
vi.mock("@/utils/clearAppData", () => ({
  clearAppData: vi.fn(),
}));

// Mock jotai hooks
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  };
});

import { useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { clearAppData } from "@/utils/clearAppData";

describe("SettingsScreen", () => {
  const mockSetPlayerId = vi.fn();
  const mockSetLyricsProviderId = vi.fn();
  const mockSetArtworkProviderId = vi.fn();
  const mockSetSettings = vi.fn();
  const mockCheckLyricsAvailability = vi.fn();
  const mockCheckArtworkAvailability = vi.fn();
  const mockQueryClient = {
    clear: vi.fn(),
  };

  const mockPlayers = [
    { id: "local", name: "Local", description: "Local player" },
    {
      id: "remote",
      name: "Server",
      description: "Remote player",
    },
  ];

  const mockLyricsProviders = [
    { id: "lrclib", name: "LrcLib", description: "Community lyrics database" },
    {
      id: "local-server",
      name: "Local Server",
      description: "Local server with LrcLib fallback",
    },
    {
      id: "simulated",
      name: "Simulated",
      description: "Hardcoded demo lyrics",
    },
  ];

  const mockArtworkProviders = [
    { id: "itunes", name: "iTunes", description: "iTunes Search API" },
  ];

  const mockPlayersWithStatus = mockPlayers.map((player) => ({
    ...player,
    isAvailable: true,
  }));
  const mockLyricsProvidersWithStatus = mockLyricsProviders.map(
    (provider, index) => ({
      ...provider,
      isAvailable: true,
      isEnabled: true,
      priority: index + 1,
      isLoading: false,
    }),
  );
  const mockArtworkProvidersWithStatus = mockArtworkProviders.map(
    (provider, index) => ({
      ...provider,
      isAvailable: true,
      isEnabled: true,
      priority: index + 1,
      isLoading: false,
    }),
  );

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useQueryClient
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient);

    // Setup mock implementations
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case playerIdAtom:
          return "local";
        case lyricsProviderIdAtom:
          return "lrclib";
        case artworkProviderIdAtom:
          return "itunes";
        case lyricsProviderIdsAtom:
          return ["lrclib", "local-server", "simulated"];
        case artworkProviderIdsAtom:
          return ["itunes"];
        case enabledLyricsProvidersAtom:
          return new Set(["lrclib", "local-server"]);
        case enabledArtworkProvidersAtom:
          return new Set(["itunes"]);
        case availablePlayersAtom:
          return mockPlayers;
        case availableLyricsProvidersAtom:
          return mockLyricsProviders;
        case availableArtworkProvidersAtom:
          return mockArtworkProviders;
        case playersWithStatusAtom:
          return mockPlayersWithStatus;
        case lyricsProvidersWithStatusAtom:
          return mockLyricsProvidersWithStatus;
        case artworkProvidersWithStatusAtom:
          return mockArtworkProvidersWithStatus;
        default:
          return undefined;
      }
    });

    vi.mocked(useSetAtom).mockImplementation((atom) => {
      switch (atom) {
        case playerIdAtom:
          return mockSetPlayerId;
        case lyricsProviderIdAtom:
          return mockSetLyricsProviderId;
        case artworkProviderIdAtom:
          return mockSetArtworkProviderId;
        case settingsAtom:
          return mockSetSettings;
        case checkLyricsProviderAvailabilityAtom:
          return mockCheckLyricsAvailability;
        case checkArtworkProviderAvailabilityAtom:
          return mockCheckArtworkAvailability;
        default:
          return vi.fn();
      }
    });
  });

  const renderComponent = async () => {
    let result;
    await act(async () => {
      result = render(
        <JotaiProvider>
          <SettingsScreen />
        </JotaiProvider>,
      );
      // Wait for provider availability checks
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return result;
  };

  it("renders settings screen correctly", async () => {
    await renderComponent();
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your player")).toBeInTheDocument();
  });

  it("displays player section", async () => {
    await renderComponent();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("Local player")).toBeInTheDocument();
  });

  it("handles player toggle", async () => {
    await renderComponent();
    const playerToggle = screen.getByTestId("music-player-toggle");
    await act(async () => {
      fireEvent.click(playerToggle);
    });
    expect(mockSetPlayerId).toHaveBeenCalledWith("remote");
  });

  it("displays provider sections", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Lyrics Provider")).toBeInTheDocument();
      expect(screen.getByText("Artwork Provider")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("LrcLib")).toBeInTheDocument();
      expect(screen.getByText("iTunes")).toBeInTheDocument();
    });
  });

  it("displays clear app data section", async () => {
    await renderComponent();

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

    await renderComponent();

    const clearButton = screen.getByTestId("clear-app-data-button");

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(clearAppData).toHaveBeenCalledWith(mockQueryClient);
    expect(mockSetSettings).toHaveBeenCalled();
  });

  it("triggers availability checks on provider sections mount", async () => {
    await renderComponent();

    // Check that availability check functions are called
    expect(mockCheckLyricsAvailability).toHaveBeenCalledWith("lrclib");
    expect(mockCheckLyricsAvailability).toHaveBeenCalledWith("local-server");
    expect(mockCheckLyricsAvailability).toHaveBeenCalledWith("simulated");
    expect(mockCheckArtworkAvailability).toHaveBeenCalledWith("itunes");
  });

  it("displays provider status icons correctly", async () => {
    await renderComponent();

    // Should show green check circles for available providers
    const statusButtons = screen.getAllByTestId("provider-status-button");
    expect(statusButtons.length).toBeGreaterThan(0);

    // Check that provider items are rendered with correct test IDs
    expect(screen.getByTestId("provider-item-lrclib")).toBeInTheDocument();
    expect(screen.getByTestId("provider-item-itunes")).toBeInTheDocument();
  });
});
