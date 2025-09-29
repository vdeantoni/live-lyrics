import { describe, it, expect } from "vitest";
import { musicModeRegistry } from "@/registries/musicModeRegistry";
import { lyricsProviderRegistry } from "@/registries/lyricsProviderRegistry";
import { artworkProviderRegistry } from "@/registries/artworkProviderRegistry";

// Import to ensure providers are registered
import "@/registries/registerProviders";

describe("Provider Registries", () => {
  it("should have music modes registered", () => {
    const modes = musicModeRegistry.getAll();
    expect(modes.length).toBeGreaterThan(0);

    const localMode = musicModeRegistry.get("local");
    const remoteMode = musicModeRegistry.get("remote");

    expect(localMode).toBeTruthy();
    expect(remoteMode).toBeTruthy();
    expect(localMode?.getId()).toBe("local");
    expect(remoteMode?.getId()).toBe("remote");
  });

  it("should have lyrics providers registered", () => {
    const providers = lyricsProviderRegistry.getAll();
    expect(providers.length).toBeGreaterThan(0);

    const lrclibProvider = lyricsProviderRegistry.get("lrclib");
    const simulatedProvider = lyricsProviderRegistry.get("simulated");

    expect(lrclibProvider).toBeTruthy();
    expect(simulatedProvider).toBeTruthy();
    expect(lrclibProvider?.getId()).toBe("lrclib");
    expect(simulatedProvider?.getId()).toBe("simulated");
  });

  it("should have artwork providers registered", () => {
    const providers = artworkProviderRegistry.getAll();
    expect(providers.length).toBeGreaterThan(0);

    const itunesProvider = artworkProviderRegistry.get("itunes");

    expect(itunesProvider).toBeTruthy();
    expect(itunesProvider?.getId()).toBe("itunes");
  });
});
