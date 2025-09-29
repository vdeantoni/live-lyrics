import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MusicPlayer from "@/components/Player/MusicPlayer";
import MainScreen from "@/components/Player/MainScreen";
import PlayerControls from "@/components/Player/PlayerControls";
import SettingsScreen from "@/components/Player/SettingsScreen";

// Mock components that might have CSS issues
vi.mock("@/hooks/useSongSync", () => ({
  useSongSync: vi.fn(() => ({
    musicMode: {
      getId: () => "test",
      getName: () => "Test Mode",
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

// Mock jotai hooks at module level
import {
  songInfoAtom,
  currentTimeAtom,
  durationAtom,
  isPlayingAtom,
  rawLrcContentAtom,
  artworkUrlsAtom,
} from "@/atoms/playerAtoms";
import {
  isSettingsOpenAtom,
  availableMusicModesAtom,
  availableLyricsProvidersAtom,
  availableArtworkProvidersAtom,
  lyricsProvidersWithStatusAtom,
  artworkProvidersWithStatusAtom,
  musicModesWithStatusAtom,
} from "@/atoms/settingsAtoms";

vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn((atom) => {
      switch (atom) {
        case songInfoAtom:
          return {
            name: "Test Song",
            artist: "Test Artist",
            album: "Test Album",
            currentTime: 0,
            duration: 100,
            playerState: "paused",
          };
        case currentTimeAtom:
          return 0;
        case durationAtom:
          return 100;
        case isPlayingAtom:
          return false;
        case rawLrcContentAtom:
          return null;
        case artworkUrlsAtom:
          return [];
        case isSettingsOpenAtom:
          return false;
        case availableMusicModesAtom:
          return [
            { id: "local", name: "Local", description: "Simulated player" },
            { id: "remote", name: "Server", description: "Apple Music server" },
          ];
        case availableLyricsProvidersAtom:
          return [
            {
              id: "lrclib",
              name: "LrcLib",
              description: "Community lyrics database",
            },
          ];
        case availableArtworkProvidersAtom:
          return [
            { id: "itunes", name: "iTunes", description: "iTunes Search API" },
          ];
        case musicModesWithStatusAtom:
          return [
            {
              id: "local",
              name: "Local",
              description: "Simulated player",
              isAvailable: true,
            },
            {
              id: "remote",
              name: "Server",
              description: "Apple Music server",
              isAvailable: true,
            },
          ];
        case lyricsProvidersWithStatusAtom:
          return [
            {
              id: "lrclib",
              name: "LrcLib",
              description: "Community lyrics database",
              isAvailable: true,
            },
          ];
        case artworkProvidersWithStatusAtom:
          return [
            {
              id: "itunes",
              name: "iTunes",
              description: "iTunes Search API",
              isAvailable: true,
            },
          ];
        default:
          return undefined;
      }
    }),
    useSetAtom: vi.fn(() => vi.fn()),
  };
});

describe("Music Player Components", () => {
  const renderWithProvider = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>{component}</JotaiProvider>
      </QueryClientProvider>,
    );
  };

  it("should render MusicPlayer component", () => {
    renderWithProvider(<MusicPlayer />);
    expect(screen.getByTestId("music-player")).toBeInTheDocument();
  });

  it("should render MainScreen with settings button", () => {
    renderWithProvider(<MainScreen />);
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
  });

  it("should render PlayerControls component", () => {
    renderWithProvider(<PlayerControls />);
    expect(screen.getByTestId("player-controls")).toBeInTheDocument();
    expect(screen.getByTestId("play-pause-button")).toBeInTheDocument();
    expect(screen.getByTestId("progress-slider")).toBeInTheDocument();
  });

  it("should render SettingsScreen component", () => {
    renderWithProvider(<SettingsScreen />);
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    // Close button is now in MainScreen, not SettingsScreen
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your music player")).toBeInTheDocument();
  });
});
