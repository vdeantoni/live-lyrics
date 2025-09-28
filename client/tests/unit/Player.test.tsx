import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "jotai";

// Mock the atoms first
vi.mock("@/atoms/playerAtoms", () => ({
  currentTimeAtom: { toString: () => "currentTimeAtom" },
  durationAtom: { toString: () => "durationAtom" },
  isPlayingAtom: { toString: () => "isPlayingAtom" },
  songNameAtom: { toString: () => "songNameAtom" },
  artistAtom: { toString: () => "artistAtom" },
  playAtom: { toString: () => "playAtom" },
  pauseAtom: { toString: () => "pauseAtom" },
  seekAtom: { toString: () => "seekAtom" },
  isDraggingAtom: { toString: () => "isDraggingAtom" },
}));

// Mock jotai hooks
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  };
});

// Mock the AnimatedSongName component
vi.mock("@/components/LyricsVisualizer/AnimatedSongName", () => ({
  default: ({ songName }: { songName: string }) => (
    <div data-testid="animated-song-name">{songName} -</div>
  ),
}));

import Player from "@/components/LyricsVisualizer/Player";
import { useAtomValue, useSetAtom } from "jotai";

describe("Player", () => {
  const mockPlay = vi.fn();
  const mockPause = vi.fn();
  const mockSeek = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      const atomString = atom.toString();
      switch (atomString) {
        case "currentTimeAtom":
          return 120;
        case "durationAtom":
          return 300;
        case "isPlayingAtom":
          return false;
        case "songNameAtom":
          return "Bohemian Rhapsody";
        case "artistAtom":
          return "Queen";
        case "isDraggingAtom":
          return false;
        default:
          return undefined;
      }
    });

    vi.mocked(useSetAtom).mockImplementation((atom) => {
      const atomString = atom.toString();
      switch (atomString) {
        case "playAtom":
          return mockPlay;
        case "pauseAtom":
          return mockPause;
        case "seekAtom":
          return mockSeek;
        default:
          return vi.fn();
      }
    });
  });

  it("renders song information correctly", () => {
    render(
      <Provider>
        <Player />
      </Provider>,
    );

    expect(screen.getByTestId("animated-song-name")).toHaveTextContent(
      "Bohemian Rhapsody -",
    );
    expect(screen.getByText("2:00")).toBeInTheDocument(); // current time
    expect(screen.getByText("5:00")).toBeInTheDocument(); // duration
  });

  it("shows play button when not playing", () => {
    render(
      <Provider>
        <Player />
      </Provider>,
    );

    const playButton = screen.getByRole("button", { name: "Play" });
    expect(playButton).toBeInTheDocument();
  });

  it("shows pause button when playing", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      const atomString = atom.toString();
      if (atomString === "isPlayingAtom") return true;
      switch (atomString) {
        case "currentTimeAtom":
          return 120;
        case "durationAtom":
          return 300;
        case "songNameAtom":
          return "Bohemian Rhapsody";
        case "artistAtom":
          return "Queen";
        case "isDraggingAtom":
          return false;
        default:
          return undefined;
      }
    });

    render(
      <Provider>
        <Player />
      </Provider>,
    );

    const pauseButton = screen.getByRole("button", { name: "Pause" });
    expect(pauseButton).toBeInTheDocument();
  });

  it("calls play function when play button is clicked", () => {
    render(
      <Provider>
        <Player />
      </Provider>,
    );

    const playButton = screen.getByRole("button", { name: "Play" });
    fireEvent.click(playButton);

    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("calls pause function when pause button is clicked", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      const atomString = atom.toString();
      if (atomString === "isPlayingAtom") return true;
      switch (atomString) {
        case "currentTimeAtom":
          return 120;
        case "durationAtom":
          return 300;
        case "songNameAtom":
          return "Bohemian Rhapsody";
        case "artistAtom":
          return "Queen";
        case "isDraggingAtom":
          return false;
        default:
          return undefined;
      }
    });

    render(
      <Provider>
        <Player />
      </Provider>,
    );

    const pauseButton = screen.getByRole("button", { name: "Pause" });
    fireEvent.click(pauseButton);

    expect(mockPause).toHaveBeenCalledTimes(1);
  });
});
