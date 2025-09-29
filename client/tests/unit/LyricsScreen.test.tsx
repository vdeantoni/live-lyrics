import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import LyricsScreen from "@/components/Player/LyricsScreen";
import {
  songNameAtom,
  artistAtom,
  albumAtom,
  durationAtom,
  currentTimeAtom,
  isPlayingAtom,
  artworkUrlsAtom,
} from "@/atoms/playerAtoms";

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
        case songNameAtom:
          return "Bohemian Rhapsody";
        case artistAtom:
          return "Queen";
        case albumAtom:
          return "A Night at the Opera";
        case durationAtom:
          return 355;
        case currentTimeAtom:
          return 0;
        case isPlayingAtom:
          return false;
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

  it("renders lyrics screen correctly", () => {
    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-background")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-provider")).toBeInTheDocument();
  });

  it("renders when no song is playing", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case songNameAtom:
          return "";
        case artistAtom:
          return "";
        case albumAtom:
          return "";
        case durationAtom:
          return 0;
        case currentTimeAtom:
          return 0;
        case isPlayingAtom:
          return false;
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
  });

  it("handles loading artwork state", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case songNameAtom:
          return "Bohemian Rhapsody";
        case artistAtom:
          return "Queen";
        case albumAtom:
          return "A Night at the Opera";
        case durationAtom:
          return 355;
        case currentTimeAtom:
          return 0;
        case isPlayingAtom:
          return false;
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
    expect(screen.getByTestId("lyrics-background")).toBeInTheDocument();
  });

  it("handles no artwork available", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case songNameAtom:
          return "Bohemian Rhapsody";
        case artistAtom:
          return "Queen";
        case albumAtom:
          return "A Night at the Opera";
        case durationAtom:
          return 355;
        case currentTimeAtom:
          return 0;
        case isPlayingAtom:
          return false;
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
    expect(screen.getByTestId("lyrics-background")).toBeInTheDocument();
  });
});
