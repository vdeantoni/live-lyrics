import type { Song } from "@/lib/api";

/**
 * Application settings interface
 */
export interface AppSettings {
  /** ID of the selected music mode */
  modeId: string;
  /** ID of the selected lyrics provider */
  lyricsProviderId: string;
  /** ID of the selected artwork provider */
  artworkProviderId: string;
}

/**
 * Interface for music modes (local simulation vs remote server)
 */
export interface MusicMode {
  /** Unique identifier for this mode */
  getId(): string;
  /** Human-readable name */
  getName(): string;
  /** Description of what this mode does */
  getDescription(): string;
  /** Check if this mode is currently available */
  isAvailable(): Promise<boolean>;
  /** Get current song information and playback state */
  getSong(): Promise<Song>;
  /** Start or resume playback */
  play(): Promise<void>;
  /** Pause playback */
  pause(): Promise<void>;
  /** Seek to a specific time position */
  seek(time: number): Promise<void>;
}

/**
 * Interface for lyrics providers
 */
export interface LyricsProvider {
  /** Get unique identifier for this provider */
  getId(): string;
  /** Get human-readable name */
  getName(): string;
  /** Get description of this provider */
  getDescription(): string;
  /** Get lyrics for a specific song */
  getLyrics(song: Song): Promise<string | null>;
  /** Check if this provider supports the given song */
  supportsLyrics(song: Song): Promise<boolean>;
  /** Check if this provider is currently available */
  isAvailable(): Promise<boolean>;
}

/**
 * Interface for artwork providers
 */
export interface ArtworkProvider {
  /** Get unique identifier for this provider */
  getId(): string;
  /** Get human-readable name */
  getName(): string;
  /** Get description of this provider */
  getDescription(): string;
  /** Get artwork URLs for a specific song */
  getArtwork(song: Song): Promise<string[]>;
  /** Check if this provider is currently available */
  isAvailable(): Promise<boolean>;
}

/**
 * Registry entry for music modes
 */
export interface MusicModeRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: () => MusicMode;
}

/**
 * Registry entry for lyrics providers
 */
export interface LyricsProviderRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: () => LyricsProvider;
}

/**
 * Registry entry for artwork providers
 */
export interface ArtworkProviderRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: () => ArtworkProvider;
}
