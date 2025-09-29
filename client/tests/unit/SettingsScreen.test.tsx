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
  availableMusicPlayersAtom,
  availableLyricsProvidersAtom,
  availableArtworkProvidersAtom,
  lyricsProvidersWithStatusAtom,
  artworkProvidersWithStatusAtom,
  musicPlayersWithStatusAtom,
} from "@/atoms/settingsAtoms";

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

describe("SettingsScreen", () => {
  const mockSetPlayerId = vi.fn();
  const mockSetLyricsProviderId = vi.fn();
  const mockSetArtworkProviderId = vi.fn();

  const mockMusicPlayers = [
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

  const mockMusicPlayersWithStatus = mockMusicPlayers.map((player) => ({
    ...player,
    isAvailable: true,
  }));
  const mockLyricsProvidersWithStatus = mockLyricsProviders.map((provider) => ({
    ...provider,
    isAvailable: true,
  }));
  const mockArtworkProvidersWithStatus = mockArtworkProviders.map(
    (provider) => ({ ...provider, isAvailable: true }),
  );

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case playerIdAtom:
          return "local";
        case lyricsProviderIdAtom:
          return "lrclib";
        case artworkProviderIdAtom:
          return "itunes";
        case availableMusicPlayersAtom:
          return mockMusicPlayers;
        case availableLyricsProvidersAtom:
          return mockLyricsProviders;
        case availableArtworkProvidersAtom:
          return mockArtworkProviders;
        case musicPlayersWithStatusAtom:
          return mockMusicPlayersWithStatus;
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
    expect(screen.getByText("Configure your music player")).toBeInTheDocument();
  });

  it("displays music player section", async () => {
    await renderComponent();
    expect(screen.getByText("Music Player")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("Local player")).toBeInTheDocument();
  });

  it("handles player toggle", async () => {
    await renderComponent();
    const playerToggle = screen.getByRole("switch");
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
});
