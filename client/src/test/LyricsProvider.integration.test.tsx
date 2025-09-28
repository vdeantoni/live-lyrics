import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import type { UseQueryResult } from "@tanstack/react-query";

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
vi.mock("@/hooks/useSongSync", () => ({
  useLyricsFromSource: vi.fn(),
}));

vi.mock("@/atoms/playerAtoms", () => ({
  songNameAtom: { toString: () => "songNameAtom" },
  artistAtom: { toString: () => "artistAtom" },
  albumAtom: { toString: () => "albumAtom" },
  durationAtom: { toString: () => "durationAtom" },
  currentTimeAtom: { toString: () => "currentTimeAtom" },
}));

vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn(),
  };
});

// Mock child components
vi.mock("../components/LyricsVisualizer/LyricsContent", () => ({
  default: ({ lyricsData }: { lyricsData: unknown }) => (
    <div data-testid="lyrics-content">
      {lyricsData ? "Lyrics loaded" : "No lyrics"}
    </div>
  ),
}));

vi.mock("../components/LyricsVisualizer/NoLyricsFound", () => ({
  default: () => <div data-testid="no-lyrics">No lyrics found</div>,
}));

import LyricsProvider from "../components/LyricsVisualizer/LyricsProvider";
import { useLyricsFromSource } from "@/hooks/useSongSync";
import { useAtomValue } from "jotai";

// Helper to create proper UseQueryResult mocks
const createMockQueryResult = (
  overrides: Partial<UseQueryResult<string, Error>>,
): UseQueryResult<string, Error> =>
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
  }) as UseQueryResult<string, Error>;

describe("LyricsProvider Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock instance
    mockLiricleInstance.on.mockClear();
    mockLiricleInstance.load.mockClear();
    mockLiricleInstance.sync.mockClear();

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
        default:
          return undefined;
      }
    });
  });

  it("displays lyrics when successfully loaded", async () => {
    const mockLyrics =
      "[00:00.00] Is this the real life?\\n[00:05.00] Is this just fantasy?";
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

    vi.mocked(useLyricsFromSource).mockReturnValue(
      createMockQueryResult({
        data: mockLyrics,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        status: "success",
        fetchStatus: "idle",
        isFetched: true,
        isFetchedAfterMount: true,
      }),
    );

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

    expect(useLyricsFromSource).toHaveBeenCalledWith({
      name: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 355,
      currentTime: 0,
      isPlaying: false,
    });
  });

  it("displays no lyrics found when data is null", async () => {
    vi.mocked(useLyricsFromSource).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        status: "success",
        fetchStatus: "idle",
        isFetched: true,
        isFetchedAfterMount: true,
      }),
    );

    render(
      <Provider>
        <LyricsProvider />
      </Provider>,
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("no-lyrics")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("handles loading state", () => {
    vi.mocked(useLyricsFromSource).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: true,
        isFetching: false,
        isSuccess: false,
        isPending: true,
        status: "pending",
        fetchStatus: "fetching",
        isInitialLoading: true,
      }),
    );

    render(
      <Provider>
        <LyricsProvider />
      </Provider>,
    );

    expect(screen.getByText("Loading lyrics...")).toBeInTheDocument();
    expect(screen.queryByTestId("no-lyrics")).not.toBeInTheDocument();
  });
});
