import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initializeEventHandlers } from "@/core/services/eventHandlers";
import { emit, clearAll } from "@/core/events/bus";
import { providerService } from "@/core/services/ProviderService";
import { settingsService } from "@/core/services/SettingsService";
import type { Player, LyricsProvider, ArtworkProvider } from "@/types";
import type { ProviderConfig } from "@/types/appState";

// Mock the services
vi.mock("@/core/services/ProviderService", () => ({
  providerService: {
    replaceProviders: vi.fn(),
  },
}));

vi.mock("@/core/services/SettingsService", () => ({
  settingsService: {
    clearAllSettings: vi.fn(),
  },
}));

describe("eventHandlers", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear all event listeners before each test
    clearAll();

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAll();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should log when event handlers are initialized", () => {
      initializeEventHandlers();

      expect(consoleLogSpy).toHaveBeenCalledWith("Event handlers initialized");
    });

    it("should only initialize once without duplicate listeners", () => {
      initializeEventHandlers();
      initializeEventHandlers();

      // Emit a test event
      const mockPlayers: ProviderConfig<Player>[] = [];
      emit({
        type: "providers.replaceAll",
        payload: { players: mockPlayers },
      });

      // Should be called twice (once per initialization)
      expect(providerService.replaceProviders).toHaveBeenCalledTimes(2);
    });
  });

  describe("providers.replaceAll event", () => {
    beforeEach(() => {
      initializeEventHandlers();
    });

    it("should replace all providers when all three types are provided", () => {
      const mockPlayers: ProviderConfig<Player>[] = [
        {
          id: "test-player",
          name: "Test Player",
          description: "Test",
          load: async () => ({}) as Player,
        },
      ];

      const mockLyrics: ProviderConfig<LyricsProvider>[] = [
        {
          id: "test-lyrics",
          name: "Test Lyrics",
          description: "Test",
          load: async () => ({}) as LyricsProvider,
        },
      ];

      const mockArtwork: ProviderConfig<ArtworkProvider>[] = [
        {
          id: "test-artwork",
          name: "Test Artwork",
          description: "Test",
          load: async () => ({}) as ArtworkProvider,
        },
      ];

      emit({
        type: "providers.replaceAll",
        payload: {
          players: mockPlayers,
          lyricsProviders: mockLyrics,
          artworkProviders: mockArtwork,
        },
      });

      expect(providerService.replaceProviders).toHaveBeenCalledWith({
        players: mockPlayers,
        lyrics: mockLyrics,
        artwork: mockArtwork,
      });

      expect(settingsService.clearAllSettings).toHaveBeenCalledOnce();
    });

    it("should handle partial provider replacement (only players)", () => {
      const mockPlayers: ProviderConfig<Player>[] = [
        {
          id: "test-player",
          name: "Test Player",
          description: "Test",
          load: async () => ({}) as Player,
        },
      ];

      emit({
        type: "providers.replaceAll",
        payload: { players: mockPlayers },
      });

      expect(providerService.replaceProviders).toHaveBeenCalledWith({
        players: mockPlayers,
        lyrics: [],
        artwork: [],
      });

      expect(settingsService.clearAllSettings).toHaveBeenCalledOnce();
    });

    it("should handle partial provider replacement (only lyrics)", () => {
      const mockLyrics: ProviderConfig<LyricsProvider>[] = [
        {
          id: "test-lyrics",
          name: "Test Lyrics",
          description: "Test",
          load: async () => ({}) as LyricsProvider,
        },
      ];

      emit({
        type: "providers.replaceAll",
        payload: { lyricsProviders: mockLyrics },
      });

      expect(providerService.replaceProviders).toHaveBeenCalledWith({
        players: [],
        lyrics: mockLyrics,
        artwork: [],
      });

      expect(settingsService.clearAllSettings).toHaveBeenCalledOnce();
    });

    it("should handle empty provider arrays", () => {
      emit({
        type: "providers.replaceAll",
        payload: {
          players: [],
          lyricsProviders: [],
          artworkProviders: [],
        },
      });

      expect(providerService.replaceProviders).toHaveBeenCalledWith({
        players: [],
        lyrics: [],
        artwork: [],
      });

      expect(settingsService.clearAllSettings).toHaveBeenCalledOnce();
    });

    it("should handle undefined providers (use empty array)", () => {
      emit({
        type: "providers.replaceAll",
        payload: {},
      });

      expect(providerService.replaceProviders).toHaveBeenCalledWith({
        players: [],
        lyrics: [],
        artwork: [],
      });
    });

    it("should clear settings after replacing providers", () => {
      const callOrder: string[] = [];

      vi.mocked(providerService.replaceProviders).mockImplementation(() => {
        callOrder.push("replaceProviders");
      });

      vi.mocked(settingsService.clearAllSettings).mockImplementation(() => {
        callOrder.push("clearAllSettings");
      });

      emit({
        type: "providers.replaceAll",
        payload: {},
      });

      expect(callOrder).toEqual(["replaceProviders", "clearAllSettings"]);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      initializeEventHandlers();
    });

    it("should catch and log errors from providerService.replaceProviders", () => {
      const error = new Error("Failed to replace providers");
      vi.mocked(providerService.replaceProviders).mockImplementation(() => {
        throw error;
      });

      emit({
        type: "providers.replaceAll",
        payload: {},
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to handle providers.replaceAll event:",
        expect.objectContaining({
          message: "Failed to replace providers",
        }),
      );
    });

    it("should catch and log errors from settingsService.clearAllSettings", () => {
      // Reset providerService mock to not throw
      vi.mocked(providerService.replaceProviders).mockImplementation(() => {});

      const error = new Error("Failed to clear settings");
      vi.mocked(settingsService.clearAllSettings).mockImplementation(() => {
        throw error;
      });

      emit({
        type: "providers.replaceAll",
        payload: {},
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to handle providers.replaceAll event:",
        expect.objectContaining({
          message: "Failed to clear settings",
        }),
      );
    });

    it("should not throw errors to event emitter", () => {
      vi.mocked(providerService.replaceProviders).mockImplementation(() => {
        throw new Error("Test error");
      });

      // Should not throw
      expect(() => {
        emit({
          type: "providers.replaceAll",
          payload: {},
        });
      }).not.toThrow();
    });
  });
});
