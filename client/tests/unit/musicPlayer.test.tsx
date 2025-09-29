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
    songData: {
      name: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      currentTime: 60,
      isPlaying: true,
    },
    musicMode: {
      getId: () => "test",
      getName: () => "Test Mode",
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
    },
  })),
  useLyrics: vi.fn(() => ({
    data: null,
    isLoading: false,
    isSuccess: true,
  })),
  useArtwork: vi.fn(() => ({
    data: [],
    isLoading: false,
    isSuccess: true,
  })),
}));

// Mock keyboard shortcuts hook
vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Import to ensure providers are registered
import "@/registries/registerProviders";

// Mock jotai hooks at module level
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn((atom) => {
      // Return sensible defaults for all atoms to prevent NaN in CSS calc()
      if (atom.toString().includes("currentTime")) return 0;
      if (atom.toString().includes("duration")) return 100;
      if (atom.toString().includes("isPlaying")) return false;
      if (atom.toString().includes("songName")) return "Test Song";
      if (atom.toString().includes("artist")) return "Test Artist";
      if (atom.toString().includes("album")) return "Test Album";
      if (atom.toString().includes("isSettingsOpen")) return false;
      return undefined;
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
