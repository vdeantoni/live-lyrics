import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import MainScreen from "@/components/Player/MainScreen";
import { isSettingsOpenAtom, toggleSettingsAtom } from "@/atoms/settingsAtoms";

// Mock the child components
vi.mock("@/components/Player/LyricsScreen", () => ({
  default: () => <div data-testid="lyrics-screen">Lyrics Screen</div>,
}));

vi.mock("@/components/Player/SettingsScreen", () => ({
  default: () => <div data-testid="settings-screen">Settings Screen</div>,
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

describe("MainScreen", () => {
  const mockToggleSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSetAtom).mockImplementation((atom) => {
      if (atom === toggleSettingsAtom) {
        return mockToggleSettings;
      }
      return vi.fn();
    });
  });

  it("renders lyrics screen when settings are closed", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === isSettingsOpenAtom) return false;
      return undefined;
    });

    render(
      <JotaiProvider>
        <MainScreen />
      </JotaiProvider>,
    );

    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-button")).toBeInTheDocument();
  });

  it("renders settings screen when settings are open", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === isSettingsOpenAtom) return true;
      return undefined;
    });

    render(
      <JotaiProvider>
        <MainScreen />
      </JotaiProvider>,
    );

    // Both screens are rendered now - lyrics stays in place, settings slides over
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-screen")).toBeInTheDocument();
    expect(screen.getByTestId("close-settings-button")).toBeInTheDocument();
  });

  it("handles settings button click", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === isSettingsOpenAtom) return false;
      return undefined;
    });

    render(
      <JotaiProvider>
        <MainScreen />
      </JotaiProvider>,
    );

    const settingsButton = screen.getByTestId("settings-button");
    fireEvent.click(settingsButton);

    expect(mockToggleSettings).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility labels", () => {
    vi.mocked(useAtomValue).mockImplementation((atom) => {
      if (atom === isSettingsOpenAtom) return false;
      return undefined;
    });

    render(
      <JotaiProvider>
        <MainScreen />
      </JotaiProvider>,
    );

    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
  });
});
