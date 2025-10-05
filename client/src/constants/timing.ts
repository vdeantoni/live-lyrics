/**
 * Timing constants for polling intervals, WebSocket, and UI delays
 */

export const POLLING_INTERVALS = {
  /** Song data sync interval (milliseconds) - used for fallback HTTP polling */
  SONG_SYNC: 300,
  /** Lyrics provider fetch polling interval (milliseconds) */
  LYRICS_FETCH_POLL: 50,
} as const;

export const WEBSOCKET = {
  /** WebSocket connection timeout (milliseconds) */
  CONNECTION_TIMEOUT: 5000,
  /** WebSocket ping interval (milliseconds) */
  PING_INTERVAL: 30000,
  /** WebSocket reconnect max attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** WebSocket reconnect base delay (milliseconds) */
  RECONNECT_BASE_DELAY: 1000,
  /** WebSocket reconnect max delay (milliseconds) */
  RECONNECT_MAX_DELAY: 16000,
} as const;

export const UI_DELAYS = {
  /** Delay before showing "No Lyrics Found" message (milliseconds) */
  NO_LYRICS_DISPLAY: 500,
  /** Timeout for seek operation completion (milliseconds) */
  SEEK_END_TIMEOUT: 1000,
} as const;

export const LYRICS_SILENCE = {
  /** Minimum silence duration to trigger indicator (seconds) */
  DETECTION_THRESHOLD: 15,
  /** Time after last lyric line when silence indicator appears (seconds) */
  INDICATOR_DELAY: 5,
} as const;
