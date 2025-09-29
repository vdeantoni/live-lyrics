import { musicModeRegistry } from "@/registries/musicModeRegistry";
import { lyricsProviderRegistry } from "@/registries/lyricsProviderRegistry";
import { artworkProviderRegistry } from "@/registries/artworkProviderRegistry";

import { LocalMusicMode } from "@/modes/localMusicMode";
import { RemoteMusicMode } from "@/modes/remoteMusicMode";

import { LrclibLyricsProvider } from "@/providers/lrclibLyricsProvider";
import { LocalServerLyricsProvider } from "@/providers/localServerLyricsProvider";
import { SimulatedLyricsProvider } from "@/providers/simulatedLyricsProvider";

import { ITunesArtworkProvider } from "@/providers/itunesArtworkProvider";

/**
 * Register all available music modes
 */
musicModeRegistry.register({
  id: "local",
  name: "Local",
  description: "Simulated player for testing and development",
  factory: () => LocalMusicMode.getInstance(),
});

musicModeRegistry.register({
  id: "remote",
  name: "Server",
  description: "Connect to Apple Music via local server",
  factory: () => new RemoteMusicMode(),
});

/**
 * Register all available lyrics providers
 */
lyricsProviderRegistry.register({
  id: "lrclib",
  name: "LrcLib",
  description:
    "Community-driven lyrics database with synchronized lyrics support",
  factory: () => new LrclibLyricsProvider(),
});

lyricsProviderRegistry.register({
  id: "local-server",
  name: "Local Server",
  description: "Lyrics from your local server",
  factory: () => new LocalServerLyricsProvider(),
});

lyricsProviderRegistry.register({
  id: "simulated",
  name: "Simulated",
  description: "Hardcoded demo lyrics for classic songs",
  factory: () => new SimulatedLyricsProvider(),
});

/**
 * Register all available artwork providers
 */
artworkProviderRegistry.register({
  id: "itunes",
  name: "iTunes",
  description: "Album artwork from iTunes Search API",
  factory: () => new ITunesArtworkProvider(),
});
