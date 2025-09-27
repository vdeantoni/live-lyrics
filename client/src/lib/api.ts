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
