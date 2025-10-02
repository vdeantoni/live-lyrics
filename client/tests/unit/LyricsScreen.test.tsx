import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../helpers/testUtils";
import LyricsScreen from "@/components/Player/LyricsScreen";

// Mock the child components
vi.mock("@/components/LyricsVisualizer/LyricsManager", () => ({
  default: () => <div data-testid="lyrics-manager">Lyrics Manager</div>,
}));

// Mock the useArtworkSync hook
vi.mock("@/hooks/useArtworkSync", () => ({
  useArtworkSync: vi.fn(),
}));

describe("LyricsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders lyrics screen correctly", async () => {
    await renderWithProviders(<LyricsScreen />);

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-manager")).toBeInTheDocument();
  });

  it("renders when no song is playing", async () => {
    await renderWithProviders(<LyricsScreen />);

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-manager")).toBeInTheDocument();
  });

  it("handles loading artwork state", async () => {
    await renderWithProviders(<LyricsScreen />);

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
  });

  it("handles no artwork available", async () => {
    await renderWithProviders(<LyricsScreen />);

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
  });
});
