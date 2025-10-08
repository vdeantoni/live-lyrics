import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { loadPlayer } from "@/config/providers";
import type { Player, Song } from "@/types";
import type { LyricsData } from "@/types";

// Mock the config/providers module
vi.mock("@/config/providers", async () => {
  const actual =
    await vi.importActual<typeof import("@/config/providers")>(
      "@/config/providers",
    );
  return {
    ...actual,
    loadPlayer: vi.fn(),
  };
});

// Mock Jotai atoms
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  };
});

describe("useKeyboardShortcuts", () => {
  let mockPlayer: Player;
  let mockToggleSettings: ReturnType<typeof vi.fn>;
  let mockToggleSearch: ReturnType<typeof vi.fn>;
  let mockTogglePlaylists: ReturnType<typeof vi.fn>;
  let mockOpenAddToPlaylistDialog: ReturnType<typeof vi.fn>;

  const createMockPlayer = (): Player => ({
    getId: vi.fn().mockReturnValue("mock-player"),
    getName: vi.fn().mockReturnValue("Mock Player"),
    getDescription: vi.fn().mockReturnValue("A mock player for testing"),
    isAvailable: vi.fn().mockResolvedValue(true),
    getSong: vi.fn().mockResolvedValue({} as Song),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    seek: vi.fn().mockResolvedValue(undefined),
    next: vi.fn().mockResolvedValue(undefined),
    previous: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    getQueue: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue({ playOnAdd: false }),
    setSettings: vi.fn().mockResolvedValue(undefined),
    setQueue: vi.fn().mockResolvedValue(undefined),
    clearHistory: vi.fn().mockResolvedValue(undefined),
  });

  const mockPlayerState = {
    name: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    currentTime: 30,
    duration: 180,
    isPlaying: false,
  };

  const mockLyricsData: LyricsData = {
    tags: {},
    enhanced: false,
    lines: [
      { time: 0, text: "Line 1", words: [] },
      { time: 10, text: "Line 2", words: [] },
      { time: 20, text: "Line 3", words: [] },
      { time: 30, text: "Line 4", words: [] },
      { time: 40, text: "Line 5", words: [] },
    ],
  };

  const setupPlayerWithSong = (overrides = {}) => {
    Object.assign(mockPlayerState, {
      name: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      currentTime: 30,
      duration: 180,
      isPlaying: false,
      ...overrides,
    });
  };

  beforeEach(async () => {
    mockPlayer = createMockPlayer();
    mockToggleSettings = vi.fn();
    mockToggleSearch = vi.fn();
    mockTogglePlaylists = vi.fn();
    mockOpenAddToPlaylistDialog = vi.fn();

    // Reset player state to defaults
    setupPlayerWithSong();

    vi.mocked(loadPlayer).mockResolvedValue(mockPlayer);

    const { useAtomValue, useSetAtom } = await import("jotai");

    // Import actual atoms for proper mocking
    const {
      selectedPlayerAtom,
      toggleSettingsAtom,
      toggleSearchAtom,
      togglePlaylistsAtom,
      openAddToPlaylistDialogAtom,
    } = await import("@/atoms/appState");

    const { lyricsDataAtom, playerStateAtom } = await import(
      "@/atoms/playerAtoms"
    );

    // Create a map of atoms to their mock values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const atomMap = new Map<any, any>([
      [selectedPlayerAtom, { config: { id: "local" } }],
      [lyricsDataAtom, mockLyricsData],
      [playerStateAtom, mockPlayerState],
      [toggleSettingsAtom, mockToggleSettings],
      [toggleSearchAtom, mockToggleSearch],
      [togglePlaylistsAtom, mockTogglePlaylists],
      [openAddToPlaylistDialogAtom, mockOpenAddToPlaylistDialog],
    ]);

    // Mock useAtomValue to use the atom map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAtomValue).mockImplementation((atom: any) => {
      return atomMap.get(atom);
    });

    // Mock useSetAtom to use the atom map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useSetAtom).mockImplementation((atom: any) => {
      return atomMap.get(atom) || vi.fn();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Play/Pause (Space)", () => {
    it("should call pause when space is pressed and song is playing", async () => {
      mockPlayerState.isPlaying = true;
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.pause).toHaveBeenCalled();
      });
    });

    it("should call play when space is pressed and song is paused", async () => {
      mockPlayerState.isPlaying = false;
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.play).toHaveBeenCalled();
      });
    });

    it("should not trigger space when modifier key is pressed", async () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: " ",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockPlayer.play).not.toHaveBeenCalled();
      expect(mockPlayer.pause).not.toHaveBeenCalled();
    });
  });

  describe("Seek (Arrow Keys)", () => {
    it("should seek backward 5 seconds on left arrow", async () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(25); // 30 - 5
      });
    });

    it("should seek backward 15 seconds on shift+left arrow", async () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(15); // 30 - 15
      });
    });

    it("should not seek below 0 seconds", async () => {
      mockPlayerState.currentTime = 3;
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(0); // Max(0, 3 - 5)
      });
    });

    it("should seek forward 5 seconds on right arrow", async () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(35); // 30 + 5
      });
    });

    it("should seek forward 15 seconds on shift+right arrow", async () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(45); // 30 + 15
      });
    });

    it("should not seek beyond duration", async () => {
      mockPlayerState.currentTime = 175;
      mockPlayerState.duration = 180;
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(180); // Min(180, 175 + 5)
      });
    });
  });

  describe("Lyrics Navigation (Arrow Up/Down)", () => {
    it("should seek to previous lyrics line on up arrow", async () => {
      mockPlayerState.currentTime = 30; // Currently on line at time 30
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(20); // Previous line
      });
    });

    it("should seek to next lyrics line on down arrow", async () => {
      mockPlayerState.currentTime = 30; // Currently on line at time 30
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(40); // Next line
      });
    });

    it("should stay on first line when pressing up at start", async () => {
      mockPlayerState.currentTime = 5; // Before or at first line
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(0); // First line
      });
    });

    it("should stay on last line when pressing down at end", async () => {
      mockPlayerState.currentTime = 40; // On last line
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(40); // Last line
      });
    });

    it("should not trigger on up arrow with modifier keys", async () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockPlayer.seek).not.toHaveBeenCalled();
    });
  });

  describe("UI Toggles (C/S/P/A)", () => {
    it("should toggle settings on C key", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", { key: "c", bubbles: true });
      window.dispatchEvent(event);

      expect(mockToggleSettings).toHaveBeenCalled();
    });

    it("should toggle search on S key", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", { key: "s", bubbles: true });
      window.dispatchEvent(event);

      expect(mockToggleSearch).toHaveBeenCalled();
    });

    it("should toggle playlists on P key", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", { key: "p", bubbles: true });
      window.dispatchEvent(event);

      expect(mockTogglePlaylists).toHaveBeenCalled();
    });

    it("should open add-to-playlist dialog on A key when song is playing", () => {
      mockPlayerState.name = "Test Song";
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", { key: "a", bubbles: true });
      window.dispatchEvent(event);

      expect(mockOpenAddToPlaylistDialog).toHaveBeenCalledWith(mockPlayerState);
    });

    it("should not open add-to-playlist dialog when no song is playing", () => {
      mockPlayerState.name = "";
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", { key: "a", bubbles: true });
      window.dispatchEvent(event);

      expect(mockOpenAddToPlaylistDialog).not.toHaveBeenCalled();
    });

    it("should handle uppercase keys (C, S, P, A)", () => {
      renderHook(() => useKeyboardShortcuts());

      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "C", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "S", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "P", bubbles: true }),
      );

      expect(mockToggleSettings).toHaveBeenCalled();
      expect(mockToggleSearch).toHaveBeenCalled();
      expect(mockTogglePlaylists).toHaveBeenCalled();
    });
  });

  describe("Modifier Key Blocking", () => {
    it("should block C key with Cmd modifier (Cmd+C for copy)", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "c",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockToggleSettings).not.toHaveBeenCalled();
    });

    it("should block S key with Cmd modifier (Cmd+S for save)", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockToggleSearch).not.toHaveBeenCalled();
    });

    it("should block P key with Cmd modifier (Cmd+P for print)", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "p",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockTogglePlaylists).not.toHaveBeenCalled();
    });

    it("should block A key with Cmd modifier (Cmd+A for select all)", () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "a",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockOpenAddToPlaylistDialog).not.toHaveBeenCalled();
    });

    it("should block shortcuts with Ctrl modifier", () => {
      renderHook(() => useKeyboardShortcuts());

      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "c",
          ctrlKey: true,
          bubbles: true,
        }),
      );

      expect(mockToggleSettings).not.toHaveBeenCalled();
    });

    it("should block shortcuts with Alt modifier", () => {
      renderHook(() => useKeyboardShortcuts());

      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "s",
          altKey: true,
          bubbles: true,
        }),
      );

      expect(mockToggleSearch).not.toHaveBeenCalled();
    });
  });

  describe("Input Field Detection", () => {
    it("should not trigger shortcuts when typing in input field", () => {
      renderHook(() => useKeyboardShortcuts());

      const input = document.createElement("input");
      document.body.appendChild(input);

      const event = new KeyboardEvent("keydown", {
        key: "c",
        bubbles: true,
      });
      Object.defineProperty(event, "target", {
        value: input,
        enumerable: true,
      });

      window.dispatchEvent(event);

      expect(mockToggleSettings).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it("should not trigger shortcuts when typing in textarea", () => {
      renderHook(() => useKeyboardShortcuts());

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      const event = new KeyboardEvent("keydown", {
        key: "s",
        bubbles: true,
      });
      Object.defineProperty(event, "target", {
        value: textarea,
        enumerable: true,
      });

      window.dispatchEvent(event);

      expect(mockToggleSearch).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it("should not trigger shortcuts when using select element", () => {
      renderHook(() => useKeyboardShortcuts());

      const select = document.createElement("select");
      document.body.appendChild(select);

      const event = new KeyboardEvent("keydown", {
        key: "p",
        bubbles: true,
      });
      Object.defineProperty(event, "target", {
        value: select,
        enumerable: true,
      });

      window.dispatchEvent(event);

      expect(mockTogglePlaylists).not.toHaveBeenCalled();

      document.body.removeChild(select);
    });
  });

  describe("Error Handling", () => {
    it("should handle loadPlayer failure gracefully", async () => {
      vi.mocked(loadPlayer).mockRejectedValue(new Error("Player not found"));
      const { logService } = await import("@/core/services/LogService");
      const logErrorSpy = vi
        .spyOn(logService, "error")
        .mockImplementation(() => {});

      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(logErrorSpy).toHaveBeenCalledWith(
          "Failed to load player",
          "useKeyboardShortcuts",
          expect.objectContaining({
            playerId: "local",
            error: expect.any(Error),
          }),
        );
      });

      logErrorSpy.mockRestore();
    });

    it("should handle player.play() failure gracefully", async () => {
      const { logService } = await import("@/core/services/LogService");
      const logErrorSpy = vi
        .spyOn(logService, "error")
        .mockImplementation(() => {});

      mockPlayer.play = vi.fn().mockRejectedValue(new Error("Playback failed"));

      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should log error instead of throwing
      expect(logErrorSpy).toHaveBeenCalledWith(
        "Playback control failed",
        "useKeyboardShortcuts",
        expect.objectContaining({
          error: expect.any(Error),
        }),
      );

      logErrorSpy.mockRestore();
    });

    it("should handle missing player gracefully", async () => {
      const { useAtomValue } = await import("jotai");
      vi.mocked(useAtomValue).mockImplementation((atom: unknown) => {
        const atomStr = String(atom);
        if (atomStr.includes("selectedPlayer")) return null; // No player
        if (atomStr.includes("playerState")) return mockPlayerState;
        return undefined;
      });

      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockPlayer.play).not.toHaveBeenCalled();
    });

    it("should handle missing lyrics data for arrow up/down", async () => {
      const { useAtomValue } = await import("jotai");
      vi.mocked(useAtomValue).mockImplementation((atom: unknown) => {
        const atomStr = String(atom);
        if (atomStr.includes("selectedPlayer")) {
          return { config: { id: "local" } };
        }
        if (atomStr.includes("lyricsData")) return null; // No lyrics
        if (atomStr.includes("playerState")) return mockPlayerState;
        return undefined;
      });

      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockPlayer.seek).not.toHaveBeenCalled();
    });
  });

  describe("Event Listener Cleanup", () => {
    it("should remove event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useKeyboardShortcuts());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it("should not handle events after unmount", async () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts());

      unmount();

      const event = new KeyboardEvent("keydown", {
        key: "c",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockToggleSettings).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should find correct line index at exact timestamp", async () => {
      mockPlayerState.currentTime = 20; // Exactly on line 3
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(30); // Next line (time 30)
      });
    });

    it("should find correct line index between timestamps", async () => {
      mockPlayerState.currentTime = 25; // Between line 3 (20) and line 4 (30)
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await vi.waitFor(() => {
        expect(mockPlayer.seek).toHaveBeenCalledWith(10); // Current line at time 25 is line at time 20, previous is time 10
      });
    });

    it("should handle empty lyrics data", async () => {
      const { useAtomValue } = await import("jotai");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(useAtomValue).mockImplementation((atom: any) => {
        const atomStr = String(atom);
        if (atomStr.includes("selectedPlayer")) {
          return { config: { id: "local" } };
        }
        if (atomStr.includes("lyricsData"))
          return { tags: {}, enhanced: false, lines: [] };
        if (atomStr.includes("playerState")) return mockPlayerState;
        return undefined;
      });

      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      });
      window.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockPlayer.seek).not.toHaveBeenCalled();
    });

    it("should handle case-insensitive keys", async () => {
      renderHook(() => useKeyboardShortcuts());

      // Test both uppercase and lowercase
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "C", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "c", bubbles: true }),
      );

      expect(mockToggleSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe("Multiple Shortcuts in Sequence", () => {
    it("should handle multiple shortcuts fired in sequence", async () => {
      renderHook(() => useKeyboardShortcuts());

      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "c", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "s", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "p", bubbles: true }),
      );

      expect(mockToggleSettings).toHaveBeenCalled();
      expect(mockToggleSearch).toHaveBeenCalled();
      expect(mockTogglePlaylists).toHaveBeenCalled();
    });
  });
});
