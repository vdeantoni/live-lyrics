/**
 * Timing constants for polling intervals and UI delays
 */

export const POLLING_INTERVALS = {
  /** Song data sync interval (milliseconds) */
  SONG_SYNC: 300,
  /** Lyrics provider fetch polling interval (milliseconds) */
  LYRICS_FETCH_POLL: 50,
} as const;

export const UI_DELAYS = {
  /** Delay before showing "No Lyrics Found" message (milliseconds) */
  NO_LYRICS_DISPLAY: 500,
  /** Timeout for seek operation completion (milliseconds) */
  SEEK_END_TIMEOUT: 1000,
} as const;

export const LYRICS_SILENCE = {
  /** Minimum silence duration to trigger indicator (seconds) */
  DETECTION_THRESHOLD: 20,
  /** Time after last lyric line when silence indicator appears (seconds) */
  INDICATOR_DELAY: 1,
} as const;
