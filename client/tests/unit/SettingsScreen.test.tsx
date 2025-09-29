import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import SettingsScreen from "@/components/Player/SettingsScreen";
import { act } from "react";

// Import actual atoms
import {
  modeIdAtom,
  lyricsProviderIdAtom,
  artworkProviderIdAtom,
} from "@/atoms/settingsAtoms";

// Mock the registries
vi.mock("@/registries/lyricsProviderRegistry", () => ({
  lyricsProviderRegistry: {
    register: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(() => [
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
    has: vi.fn(),
    getAvailable: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/registries/artworkProviderRegistry", () => ({
  artworkProviderRegistry: {
    register: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(() => [
      {
        id: "itunes",
        name: "iTunes",
        description: "iTunes Search API",
        factory: () => ({ isAvailable: () => Promise.resolve(true) }),
      },
    ]),
    has: vi.fn(),
    getAvailable: vi.fn(() => Promise.resolve([])),
  },
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      switch (atom) {
        case modeIdAtom:
          return "local";
        case lyricsProviderIdAtom:
          return "lrclib";
        case artworkProviderIdAtom:
          return "itunes";
        default:
          return undefined;
      }
    });

    vi.mocked(useSetAtom).mockImplementation((atom) => {
      switch (atom) {
        case modeIdAtom:
          return mockSetModeId;
        case lyricsProviderIdAtom:
          return mockSetLyricsProviderId;
        case artworkProviderIdAtom:
          return mockSetArtworkProviderId;
        default:
          return vi.fn();
      }
    });
  });

  const renderComponent = async () => {
    let result;
    await act(async () => {
      result = render(
        <JotaiProvider>
          <SettingsScreen />
        </JotaiProvider>,
      );
      // Wait for provider availability checks
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return result;
  };

  it("renders settings screen correctly", async () => {
    await renderComponent();
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your music player")).toBeInTheDocument();
  });

  it("displays music mode section", async () => {
    await renderComponent();
    expect(screen.getByText("Music Mode")).toBeInTheDocument();
    expect(screen.getByText("Local Mode")).toBeInTheDocument();
    expect(
      screen.getByText("Use simulated player for testing"),
    ).toBeInTheDocument();
  });

  it("handles mode toggle", async () => {
    await renderComponent();
    const modeToggle = screen.getByRole("switch");
    await act(async () => {
      fireEvent.click(modeToggle);
    });
    expect(mockSetModeId).toHaveBeenCalledWith("remote");
  });

  it("displays provider sections", async () => {
    await renderComponent();

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
