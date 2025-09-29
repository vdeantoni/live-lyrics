import type { Song } from "@/lib/api";

/**
 * Interface for lyrics providers that can fetch lyrics for songs
 */
export interface LyricsProvider {
  /**
   * Get lyrics for a specific song
   * @param song - The song to get lyrics for
   * @returns Promise with lyrics content or null if not found
   */
  getLyrics(song: Song): Promise<string | null>;

  /**
   * Get the unique identifier for this provider
   */
  getId(): string;

  /**
   * Get a human-readable name for this provider
   */
  getName(): string;

  /**
   * Check if this provider supports the given song
   * @param song - The song to check
   */
  supportsLyrics(song: Song): Promise<boolean>;

  /**
   * Check if this provider is currently available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Configuration for lyrics providers
 */
export interface LyricsProviderConfig {
  type: "remote" | "local" | "lrclib" | "genius";
  name: string;
  options?: Record<string, unknown>;
}

/**
 * Interface for artwork providers
 */
export interface ArtworkProvider {
  /**
   * Get artwork URLs for a specific song
   * @param song - The song to get artwork for
   * @returns Promise with array of artwork URLs
   */
  getArtwork(song: Song): Promise<string[]>;

  /**
   * Get the unique identifier for this provider
   */
  getId(): string;

  /**
   * Get a human-readable name for this provider
   */
  getName(): string;

  /**
   * Check if this provider is currently available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Extended music source interface that includes plugin support
 */
export interface MusicSource {
  /**
   * Get current song information and playback state
   */
  getSong(): Promise<Song>;

  /**
   * Start or resume playback
   */
  play(): Promise<void>;

  /**
   * Pause playback
   */
  pause(): Promise<void>;

  /**
   * Seek to a specific time position
   * @param time - Time in seconds
   */
  seek(time: number): Promise<void>;

  /**
   * Get the unique identifier for this source
   */
  getId(): string;

  /**
   * Get a human-readable name for this source
   */
  getName(): string;

  /**
   * Check if this source is currently available/connected
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the lyrics provider associated with this source
   */
  getLyricsProvider(): LyricsProvider | null;

  /**
   * Get the artwork provider associated with this source
   */
  getArtworkProvider(): ArtworkProvider | null;
}

/**
 * Result type for source operations
 */
export interface SourceOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Configuration for music sources with plugin support
 */
export interface SourceConfig {
  type: "remote" | "local";
  name: string;
  options?: Record<string, unknown>;
  lyricsProvider?: LyricsProviderConfig;
  artworkProvider?: LyricsProviderConfig;
}
