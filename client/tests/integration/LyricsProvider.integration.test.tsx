import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import {
  songInfoAtom,
  playerStateAtom,
  rawLrcContentAtom,
} from "@/atoms/playerAtoms";

// Mock Liricle first
const mockLiricleInstance = {
  parse: vi.fn(),
  on: vi.fn(),
  load: vi.fn(),
  sync: vi.fn(),
};

vi.mock("liricle", () => ({
  default: vi.fn().mockImplementation(() => mockLiricleInstance),
}));

// Mock the hooks and atoms
vi.mock("@/hooks/useLyricsSync", () => ({
  useLyricsSync: vi.fn(),
}));

vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  };
});

// Mock child components
vi.mock("@/components/LyricsVisualizer/LyricsContent", () => ({
  default: () => <div data-testid="lyrics-content">Lyrics loaded</div>,
}));

vi.mock("@/components/LyricsVisualizer/NoLyricsFound", () => ({
  default: () => <div data-testid="no-lyrics">No lyrics found</div>,
}));

import LyricsProvider from "@/components/LyricsVisualizer/LyricsProvider";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { useAtomValue, useSetAtom } from "jotai";

describe("LyricsProvider Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock instance
    mockLiricleInstance.on.mockClear();
    mockLiricleInstance.load.mockClear();
    mockLiricleInstance.sync.mockClear();

    // Mock useSetAtom to return mock functions
    vi.mocked(useSetAtom).mockImplementation(() => {
      return vi.fn();
    });

    // Mock useLyricsSync hook
    vi.mocked(useLyricsSync).mockReturnValue(undefined);
  });

  it("displays lyrics when successfully loaded", async () => {
    // Set up rawLrcContent with mock LRC data
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case songInfoAtom:
          return {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            currentTime: 0,
            duration: 355,
            isPlaying: false,
          };
        case playerStateAtom:
          return {
            currentTime: 0,
            duration: 355,
            isPlaying: false,
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
          };
        case rawLrcContentAtom:
          return "[00:00.00]Is this the real life?\n[00:05.00]Is this just fantasy?";
        default:
          return undefined;
      }
    });

    const mockParsedLyrics = {
      lines: [
        {
          startTime: 0,
          words: [{ text: "Is this the real life?", startTime: 0 }],
        },
        {
          startTime: 5,
          words: [{ text: "Is this just fantasy?", startTime: 5 }],
        },
      ],
    };

    // Mock the liricle instance methods
    mockLiricleInstance.on.mockImplementation(
      (event: string, callback: (data: unknown) => void) => {
        if (event === "load") {
          // Simulate calling the load callback immediately
          setTimeout(() => callback(mockParsedLyrics), 0);
        }
      },
    );

    render(
      <Provider>
        <LyricsProvider />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("lyrics-content")).toBeInTheDocument();
      expect(screen.getByText("Lyrics loaded")).toBeInTheDocument();
    });

    expect(useLyricsSync).toHaveBeenCalled();
  });

  it("displays no lyrics found when data is null", async () => {
    // Set up rawLrcContent as empty
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case songInfoAtom:
          return {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            currentTime: 0,
            duration: 355,
            isPlaying: false,
          };
        case playerStateAtom:
          return {
            currentTime: 0,
            duration: 355,
            isPlaying: false,
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
          };
        case rawLrcContentAtom:
          return ""; // Empty lyrics content
        default:
          return undefined;
      }
    });

    render(
      <Provider>
        <LyricsProvider />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("no-lyrics")).toBeInTheDocument();
    });

    expect(useLyricsSync).toHaveBeenCalled();
  });

  it("handles loading state", () => {
    // Set up rawLrcContent as null (loading state)
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case songInfoAtom:
          return {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
            currentTime: 0,
            duration: 355,
            isPlaying: false,
          };
        case playerStateAtom:
          return {
            currentTime: 0,
            duration: 355,
            isPlaying: false,
            name: "Bohemian Rhapsody",
            artist: "Queen",
            album: "A Night at the Opera",
          };
        case rawLrcContentAtom:
          return null; // Loading state
        default:
          return undefined;
      }
    });

    render(
      <Provider>
        <LyricsProvider />
      </Provider>,
    );

    expect(screen.getByText("Loading lyrics...")).toBeInTheDocument();
    expect(useLyricsSync).toHaveBeenCalled();
  });
});
