import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import type { UseQueryResult } from "@tanstack/react-query";
import LyricsScreen from "@/components/Player/LyricsScreen";

// Mock the child components
vi.mock("@/components/LyricsVisualizer/LyricsProvider", () => ({
  default: () => <div data-testid="lyrics-provider">Lyrics Provider</div>,
}));

// Mock player atoms
vi.mock("@/atoms/playerAtoms", () => ({
  songNameAtom: { toString: () => "songNameAtom" },
  artistAtom: { toString: () => "artistAtom" },
  albumAtom: { toString: () => "albumAtom" },
  durationAtom: { toString: () => "durationAtom" },
  currentTimeAtom: { toString: () => "currentTimeAtom" },
  isPlayingAtom: { toString: () => "isPlayingAtom" },
}));

// Mock the useArtwork hook
vi.mock("@/hooks/useSongSync", () => ({
  useArtwork: vi.fn(),
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
import { useArtwork } from "@/hooks/useSongSync";

// Helper to create proper UseQueryResult mocks
const createMockQueryResult = (
  overrides: Partial<UseQueryResult<string[], Error>>,
): UseQueryResult<string[], Error> =>
  ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    isPending: false,
    status: "pending" as const,
    fetchStatus: "idle" as const,
    error: null,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    isPlaceholderData: false,
    isRefetching: false,
    isStale: false,
    refetch: vi.fn(),
    ...overrides,
  }) as UseQueryResult<string[], Error>;

describe("LyricsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      const atomString = atom.toString();
      switch (atomString) {
        case "songNameAtom":
          return "Bohemian Rhapsody";
        case "artistAtom":
          return "Queen";
        case "albumAtom":
          return "A Night at the Opera";
        case "durationAtom":
          return 355;
        case "currentTimeAtom":
          return 0;
        case "isPlayingAtom":
          return false;
        default:
          return undefined;
      }
    });

    // Mock useArtwork to return artwork URLs
    vi.mocked(useArtwork).mockReturnValue(
      createMockQueryResult({
        data: [
          "https://example.com/artwork1.jpg",
          "https://example.com/artwork2.jpg",
        ],
        isLoading: false,
        isSuccess: true,
        status: "success",
      }),
    );
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
      const atomString = atom.toString();
      switch (atomString) {
        case "songNameAtom":
          return "";
        case "artistAtom":
          return "";
        case "albumAtom":
          return "";
        case "durationAtom":
          return 0;
        case "currentTimeAtom":
          return 0;
        case "isPlayingAtom":
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
    vi.mocked(useArtwork).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: true,
        status: "pending",
      }),
    );

    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-background")).toBeInTheDocument();
  });

  it("handles no artwork available", () => {
    vi.mocked(useArtwork).mockReturnValue(
      createMockQueryResult({
        data: [],
        isLoading: false,
        isSuccess: true,
        status: "success",
      }),
    );

    render(
      <JotaiProvider>
        <LyricsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-background")).toBeInTheDocument();
  });
});
