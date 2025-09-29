import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import SettingsScreen from "@/components/Player/SettingsScreen";

// Mock the registries
vi.mock("@/registries/lyricsProviderRegistry", () => ({
  lyricsProviderRegistry: {
    getAll: vi.fn().mockReturnValue([
      {
        id: "lrclib",
        name: "LrcLib",
        description: "Community lyrics database",
        factory: () => ({ isAvailable: () => Promise.resolve(true) }),
      },
      {
        id: "local",
        name: "Local Server",
        description: "Local server with LrcLib fallback",
        factory: () => ({ isAvailable: () => Promise.resolve(false) }),
      },
    ]),
  },
}));

vi.mock("@/registries/artworkProviderRegistry", () => ({
  artworkProviderRegistry: {
    getAll: vi.fn().mockReturnValue([
      {
        id: "itunes",
        name: "iTunes",
        description: "iTunes Search API",
        factory: () => ({ isAvailable: () => Promise.resolve(true) }),
      },
    ]),
  },
}));

// Mock settings atoms
vi.mock("@/atoms/settingsAtoms", () => ({
  modeIdAtom: { toString: () => "modeIdAtom" },
  lyricsProviderIdAtom: { toString: () => "lyricsProviderIdAtom" },
  artworkProviderIdAtom: { toString: () => "artworkProviderIdAtom" },
  toggleSettingsAtom: { toString: () => "toggleSettingsAtom" },
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

import { useAtomValue, useSetAtom } from "jotai";

describe("SettingsScreen", () => {
  const mockSetModeId = vi.fn();
  const mockSetLyricsProviderId = vi.fn();
  const mockSetArtworkProviderId = vi.fn();
  const mockToggleSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      const atomString = atom.toString();
      switch (atomString) {
        case "modeIdAtom":
          return "local";
        case "lyricsProviderIdAtom":
          return "lrclib";
        case "artworkProviderIdAtom":
          return "itunes";
        default:
          return undefined;
      }
    });

    vi.mocked(useSetAtom).mockImplementation((atom) => {
      const atomString = atom.toString();
      switch (atomString) {
        case "modeIdAtom":
          return mockSetModeId;
        case "lyricsProviderIdAtom":
          return mockSetLyricsProviderId;
        case "artworkProviderIdAtom":
          return mockSetArtworkProviderId;
        case "toggleSettingsAtom":
          return mockToggleSettings;
        default:
          return vi.fn();
      }
    });
  });

  it("renders settings screen correctly", () => {
    render(
      <JotaiProvider>
        <SettingsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your music player")).toBeInTheDocument();
    expect(screen.getByTestId("close-settings-button")).toBeInTheDocument();
  });

  it("displays music mode section", () => {
    render(
      <JotaiProvider>
        <SettingsScreen />
      </JotaiProvider>,
    );

    expect(screen.getByText("Music Mode")).toBeInTheDocument();
    expect(screen.getByText("Local Mode")).toBeInTheDocument();
    expect(
      screen.getByText("Use simulated player for testing"),
    ).toBeInTheDocument();
  });

  it("handles close button click", () => {
    render(
      <JotaiProvider>
        <SettingsScreen />
      </JotaiProvider>,
    );

    const closeButton = screen.getByTestId("close-settings-button");
    fireEvent.click(closeButton);

    expect(mockToggleSettings).toHaveBeenCalledTimes(1);
  });

  it("handles mode toggle", () => {
    render(
      <JotaiProvider>
        <SettingsScreen />
      </JotaiProvider>,
    );

    const modeToggle = screen.getByRole("switch");
    fireEvent.click(modeToggle);

    expect(mockSetModeId).toHaveBeenCalledWith("remote");
  });

  it("displays provider sections", async () => {
    render(
      <JotaiProvider>
        <SettingsScreen />
      </JotaiProvider>,
    );

    // Wait for providers to load
    await waitFor(() => {
      expect(screen.getByText("Lyrics Provider")).toBeInTheDocument();
      expect(screen.getByText("Artwork Provider")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("LrcLib")).toBeInTheDocument();
      expect(screen.getByText("iTunes")).toBeInTheDocument();
    });
  });
});
