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

// Search result type for lyrics providers
export interface SearchResult {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
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
  getLyrics(song: Song, signal?: AbortSignal): Promise<string | null>;
  /** Search for songs by query string */
  search(query: string, signal?: AbortSignal): Promise<SearchResult[]>;
  /** Check if this provider supports the given song */
  supportsLyrics(song: Song): Promise<boolean>;
  /** Check if this provider is currently available */
  isAvailable(): Promise<boolean>;
  /** Check if this provider is currently fetching data */
  isFetching(): Promise<boolean>;
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
  getArtwork(song: Song, signal?: AbortSignal): Promise<string[]>;
  /** Check if this provider is currently available */
  isAvailable(): Promise<boolean>;
  /** Check if this provider is currently fetching data */
  isFetching(): Promise<boolean>;
}
