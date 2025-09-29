// Core types for the application
export type Song = {
  name: string;
  artist: string;
  album: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
};

// Lyrics data types (used by Liricle library)
export interface WordData {
  index?: number;
  time: number;
  text: string;
}

export interface LineData {
  index?: number;
  time: number;
  text: string;
  words?: WordData[] | null;
}

export interface LyricsData {
  tags: TagsData;
  lines: LineData[];
  enhanced: boolean;
}

export interface TagsData {
  ar?: string;
  ti?: string;
  al?: string;
  au?: string;
  by?: string;
  length?: string;
  offset?: string;
  re?: string;
  ve?: string;
}

// Application settings interface
export interface AppSettings {
  /** ID of the selected player */
  playerId: string;
  /** Ordered list of lyrics provider IDs by priority (first = highest priority) */
  lyricsProviderIds: string[];
  /** Ordered list of artwork provider IDs by priority (first = highest priority) */
  artworkProviderIds: string[];
  /** Set of enabled lyrics provider IDs */
  enabledLyricsProviders: Set<string>;
  /** Set of enabled artwork provider IDs */
  enabledArtworkProviders: Set<string>;
}

// Interface for player (local vs remote server)
export interface Player {
  /** Unique identifier for this player */
  getId(): string;
  /** Human-readable name */
  getName(): string;
  /** Description of what this player does */
  getDescription(): string;
  /** Check if this player is currently available */
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

// Interface for lyrics providers
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

// Interface for artwork providers
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

// Configuration types
export interface LyricsProviderConfig {
  type: "remote" | "local" | "lrclib" | "genius";
  name: string;
  options?: Record<string, unknown>;
}

// Extended music source interface that includes plugin support
export interface MusicSource {
  /** Get current song information and playback state */
  getSong(): Promise<Song>;
  /** Start or resume playback */
  play(): Promise<void>;
  /** Pause playback */
  pause(): Promise<void>;
  /** Seek to a specific time position */
  seek(time: number): Promise<void>;
  /** Get the unique identifier for this source */
  getId(): string;
  /** Get a human-readable name for this source */
  getName(): string;
  /** Check if this source is currently available/connected */
  isAvailable(): Promise<boolean>;
  /** Get the lyrics provider associated with this source */
  getLyricsProvider(): LyricsProvider | null;
  /** Get the artwork provider associated with this source */
  getArtworkProvider(): ArtworkProvider | null;
}

// Result type for source operations
export interface SourceOperationResult {
  success: boolean;
  error?: string;
}

// Configuration for music sources with plugin support
export interface SourceConfig {
  type: "remote" | "local";
  name: string;
  options?: Record<string, unknown>;
  lyricsProvider?: LyricsProviderConfig;
  artworkProvider?: LyricsProviderConfig;
}

// Registry entry types
export interface PlayerRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: () => Player;
}

export interface LyricsProviderRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: () => LyricsProvider;
}

export interface ArtworkProviderRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: () => ArtworkProvider;
}
