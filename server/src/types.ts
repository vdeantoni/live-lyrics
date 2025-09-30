// Shared types between client and server
export interface Song {
  name: string;
  artist: string;
  album: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export interface SongResponse extends Song {
  // Server can add additional fields if needed
}

export interface ErrorResponse {
  error: string;
}

export interface MessageResponse {
  message: string;
}