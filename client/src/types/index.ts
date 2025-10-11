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
  type?: "lyric" | "silence";
  metadata?: {
    silenceDuration?: number;
  };
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
export interface PlayerSettings {
  /** Auto-play when songs are added to queue */
  playOnAdd: boolean;
  /** This can be used to tweak the time used to display lyrics, for example, when there's a delay from a remote player
   *  or the lyrics file is not perfect for this song. It expects time in miliseconds and can be negative. */
  timeOffsetInMs: number;
}

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
  /** Skip to next song */
  next(): Promise<void>;
  /** Go to previous song */
  previous(): Promise<void>;
  /** Add one or more songs to the queue (inserts at beginning after current) */
  add(...songs: Song[]): Promise<void>;
  /** Get current queue */
  getQueue(): Promise<Song[]>;
  /** Get playback history */
  getHistory(): Promise<Song[]>;
  /** Clear queue and current song */
  clear(): Promise<void>;
  /** Get player settings */
  getSettings(): Promise<PlayerSettings>;
  /** Update player settings */
  setSettings(settings: Partial<PlayerSettings>): Promise<void>;
  /** Set the entire queue (enables remove, reorder, add operations) */
  setQueue(songs: Song[]): Promise<void>;
  /** Clear playback history */
  clearHistory(): Promise<void>;
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

// Playlist types
export interface PlaylistSong {
  id: string; // unique within playlist
  name: string;
  artist: string;
  album: string;
  duration: number;
  order: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: PlaylistSong[];
  createdAt: number;
  updatedAt: number;
}
