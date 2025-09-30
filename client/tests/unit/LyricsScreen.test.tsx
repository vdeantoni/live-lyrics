import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import LyricsScreen from "@/components/Player/LyricsScreen";
import { playerStateAtom, artworkUrlsAtom } from "@/atoms/playerAtoms";

// Mock the child components
vi.mock("@/components/LyricsVisualizer/LyricsProvider", () => ({
  default: () => <div data-testid="lyrics-provider">Lyrics Provider</div>,
}));

// Mock the useArtworkSync hook
vi.mock("@/hooks/useArtworkSync", () => ({
  useArtworkSync: vi.fn(),
}));

// Mock jotai hooks
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn(),
  };
});

import { useAtomValue } from "jotai";
import { useArtworkSync } from "@/hooks/useArtworkSync";

describe("LyricsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case playerStateAtom:
          return {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            duration: 355,
            currentTime: 0,
            isPlaying: false,
          };
        case artworkUrlsAtom:
          return [
            "https://example.com/artwork1.jpg",
            "https://example.com/artwork2.jpg",
          ];
        default:
          return undefined;
      }
    });

    // Mock useArtworkSync hook
    vi.mocked(useArtworkSync).mockReturnValue(undefined);
  });

  it("renders lyrics screen correctly", async () => {
    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-provider")).toBeInTheDocument();

    // Background should eventually appear when artwork loads
    // Note: In practice this is async, but for this test we'll just check the structure
    // The background will be conditionally rendered based on currentArtworkUrl state
  });

  it("renders when no song is playing", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case playerStateAtom:
          return {
            name: "",
            artist: "",
            album: "",
            duration: 0,
            currentTime: 0,
            isPlaying: false,
          };
        case artworkUrlsAtom:
          return []; // No artwork
        default:
          return undefined;
      }
    });

    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-provider")).toBeInTheDocument();
    // Background should not exist when no artwork
    expect(screen.queryByTestId("lyrics-background")).not.toBeInTheDocument();
  });

  it("handles loading artwork state", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case playerStateAtom:
          return {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            duration: 355,
            currentTime: 0,
            isPlaying: false,
          };
        case artworkUrlsAtom:
          return []; // No artwork yet
        default:
          return undefined;
      }
    });

    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    // Background should not exist when no artwork available
    expect(screen.queryByTestId("lyrics-background")).not.toBeInTheDocument();
  });

  it("handles no artwork available", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case playerStateAtom:
          return {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            duration: 355,
            currentTime: 0,
            isPlaying: false,
          };
        case artworkUrlsAtom:
          return []; // Empty array
        default:
          return undefined;
      }
    });

    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    // Background should not exist when no artwork
    expect(screen.queryByTestId("lyrics-background")).not.toBeInTheDocument();
  });
});
