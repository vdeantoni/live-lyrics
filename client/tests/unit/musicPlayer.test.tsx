import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderLightweight } from "../helpers/testUtils";
import Player from "@/components/Player/Player";
import MainScreen from "@/components/Player/MainScreen";
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

// Mock keyboard shortcuts hook
vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock the complex LyricsProvider component that was causing atom issues
vi.mock("@/components/LyricsVisualizer/LyricsProvider", () => ({
  default: () => (
    <div data-testid="lyrics-provider">Mocked Lyrics Provider</div>
  ),
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

// Mock specific atoms that need special values
vi.mock("@/atoms/settingsAtoms", async () => {
  const actual = await vi.importActual("@/atoms/settingsAtoms");
  return {
    ...actual,
    isSettingsOpenAtom: { init: false }, // Mock atom that returns false
  };
});

// Mock atoms with simple values for remaining components
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn((atom) => {
      // Handle the specific isSettingsOpenAtom
      if (atom && atom.init === false) {
        return false;
      }

      // Default object for all other atoms
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

  it("should render MainScreen with settings button", () => {
    renderLightweight(<MainScreen />);
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
  });

  it("should render PlayerControls component", () => {
    renderLightweight(<PlayerControls />);
    expect(screen.getByTestId("player-controls")).toBeInTheDocument();
    expect(screen.getByTestId("play-pause-button")).toBeInTheDocument();
    expect(screen.getByTestId("progress-slider")).toBeInTheDocument();
  });

  it("should render SettingsScreen component", () => {
    // SettingsScreen needs QueryClient, so use the full renderLightweight
    renderLightweight(<SettingsScreen />);
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your player")).toBeInTheDocument();
  });
});
