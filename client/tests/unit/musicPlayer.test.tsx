import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderLightweight } from "../helpers/testUtils";
import Player from "@/components/Player/Player";
import PlayerControls from "@/components/Player/PlayerControls";
import SettingsScreen from "@/components/Player/SettingsScreen";

// Mock components that might have CSS issues
vi.mock("@/hooks/useSongSync", () => ({
  useSongSync: vi.fn(() => ({
    players: {
      getId: () => "test",
      getName: () => "Test Player",
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
    },
  })),
}));

vi.mock("@/hooks/useLyricsSync", () => ({
  useLyricsSync: vi.fn(),
}));

vi.mock("@/hooks/useArtworkSync", () => ({
  useArtworkSync: vi.fn(),
}));

vi.mock("@/hooks/usePlayerQueue", () => ({
  usePlayerQueue: vi.fn(() => ({
    queue: [],
    isLoading: false,
    error: null,
    removeAt: vi.fn(),
    reorder: vi.fn(),
    clear: vi.fn(),
    addSongs: vi.fn(),
  })),
}));

vi.mock("@/hooks/usePlayerHistory", () => ({
  usePlayerHistory: vi.fn(() => ({
    history: [],
    isLoading: false,
    error: null,
    clear: vi.fn(),
    replay: vi.fn(),
  })),
}));

// Mock keyboard shortcuts hook
vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock the complex LyricsManager component that was causing atom issues
vi.mock("@/components/LyricsVisualizer/LyricsManager", () => ({
  default: () => <div data-testid="lyrics-manager">Mocked Lyrics Manager</div>,
}));

// Mock SettingsScreen child components to avoid complex provider dependencies
vi.mock("@/components/Settings/PlayerSection", () => ({
  PlayerSection: () => <div data-testid="player-section">Player Section</div>,
}));

vi.mock("@/components/Settings/LyricsProviderSection", () => ({
  LyricsProviderSection: () => (
    <div data-testid="lyrics-provider-section">Lyrics Provider Section</div>
  ),
}));

vi.mock("@/components/Settings/ArtworkProviderSection", () => ({
  ArtworkProviderSection: () => (
    <div data-testid="artwork-provider-section">Artwork Provider Section</div>
  ),
}));

vi.mock("@/components/Settings/ClearAppDataSection", () => ({
  ClearAppDataSection: () => (
    <div data-testid="clear-app-data-section">Clear App Data Section</div>
  ),
}));

// Mock specific atoms - keeping actual implementation from appState
vi.mock("@/atoms/appState", async () => {
  const actual = await vi.importActual("@/atoms/appState");
  return {
    ...actual,
  };
});

// Mock atoms with simple values for remaining components
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    useAtomValue: vi.fn((_atom) => {
      // Default object for all atoms
      return {
        // For appState atoms
        isLoading: false,
        isReady: true,
        error: null,

        // For playerState/songInfo atoms
        name: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        currentTime: 60,
        duration: 240,
        isPlaying: false,

        // Simple defaults for other atoms
        length: 0,
      };
    }),
    useSetAtom: vi.fn(() => vi.fn()),
  };
});

describe("Player Components", () => {
  it("should render Player component", () => {
    renderLightweight(<Player />);
    expect(screen.getByTestId("player")).toBeInTheDocument();
  });

  it("should render PlayerControls with all elements", () => {
    renderLightweight(<PlayerControls />);
    expect(screen.getByTestId("player-controls")).toBeInTheDocument();
    expect(screen.getByTestId("play-pause-button")).toBeInTheDocument();
    expect(screen.getByTestId("progress-slider")).toBeInTheDocument();
    expect(screen.getByTestId("previous-button")).toBeInTheDocument();
    expect(screen.getByTestId("next-button")).toBeInTheDocument();
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
  });

  it("should render SettingsScreen component", () => {
    // SettingsScreen needs QueryClient, so use the full renderLightweight
    renderLightweight(<SettingsScreen />);
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your player")).toBeInTheDocument();
  });
});
