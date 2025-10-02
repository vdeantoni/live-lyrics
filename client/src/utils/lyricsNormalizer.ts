/**
 * Lyrics format normalization utilities
 *
 * This module provides functions to detect and normalize different lyrics formats
 * into a consistent Enhanced LRC format for the application.
 */

/**
 * Detect if lyrics contain Enhanced LRC features (word-level timing)
 * Enhanced LRC has word-level timing markers like <00:10.50> or multiple timestamps per line
 */
export function isEnhancedLrc(lyrics: string | null): boolean {
  if (!lyrics) return false;

  // Enhanced LRC typically has word-level timing markers like <00:10.50>
  const wordTimingPattern = /<\d{2}:\d{2}\.\d{2}>/;

  // Or multiple timestamps per line (karaoke format)
  const multipleTimestampsPerLine =
    /\[\d{2}:\d{2}\.\d{2}\].*\[\d{2}:\d{2}\.\d{2}\]/;

  return (
    wordTimingPattern.test(lyrics) || multipleTimestampsPerLine.test(lyrics)
  );
}

/**
 * Detect if lyrics contain standard LRC format (line-level timing only)
 */
export function isNormalLrc(lyrics: string | null): boolean {
  if (!lyrics) return false;

  // Check for standard LRC timestamp pattern [MM:SS.xx]
  const lineTimingPattern = /^\[\d{2}:\d{2}\.\d{2}\]/m;

  // But NOT enhanced LRC features
  return lineTimingPattern.test(lyrics) && !isEnhancedLrc(lyrics);
}

/**
 * Normalize lyrics to Enhanced LRC format
 *
 * Handles three input formats:
 * 1. Enhanced LRC (word-level timing) → Pass through unchanged
 * 2. Normal LRC (line-level timing) → Add word-level timing at line start
 * 3. Plain text → Add both line and word-level timestamps
 *
 * @param lyrics - Raw lyrics content in any format
 * @returns Normalized Enhanced LRC content
 */
export function normalizeLyricsToEnhanced(lyrics: string): string {
  if (!lyrics || lyrics.trim() === "") {
    return "";
  }

  // Already enhanced LRC - pass through
  if (isEnhancedLrc(lyrics)) {
    return lyrics;
  }

  // Normal LRC - add word-level timing at the start of each line
  if (isNormalLrc(lyrics)) {
    return normalizeNormalLrcToEnhanced(lyrics);
  }

  // Plain text - add both line and word-level timing
  return normalizePlainTextToEnhanced(lyrics);
}

/**
 * Convert Normal LRC to Enhanced LRC by adding word-level timing
 * Strategy: Split text into words and add the same timestamp for each word
 */
function normalizeNormalLrcToEnhanced(lyrics: string): string {
  const lines = lyrics.split("\n");

  return lines
    .map((line) => {
      // Match line timestamp [MM:SS.xx]
      const timestampMatch = line.match(/^\[(\d{2}:\d{2}\.\d{2})\]/);

      if (!timestampMatch) {
        // No timestamp, return as-is (metadata or empty line)
        return line;
      }

      const timestamp = timestampMatch[1];
      const textAfterTimestamp = line.slice(timestampMatch[0].length).trim();

      if (!textAfterTimestamp) {
        // Empty line, just return the timestamp
        return line;
      }

      // Split text into words and add timestamp for each word
      const words = textAfterTimestamp.split(/\s+/);
      const enhancedWords = words
        .map((word) => `<${timestamp}>${word}`)
        .join(" ");

      return `[${timestamp}]${enhancedWords}`;
    })
    .join("\n");
}

/**
 * Convert plain text to Enhanced LRC by adding synthetic timestamps
 * Strategy: Add timestamps at 2-second intervals with word-level timing for each word
 */
function normalizePlainTextToEnhanced(text: string): string {
  const lines = text.split("\n").filter((line) => line.trim() !== "");

  return lines
    .map((line, index) => {
      // Generate timestamp based on line index (2 seconds per line)
      const seconds = index * 2;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const timestamp = `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}.00`;

      // Split text into words and add timestamp for each word
      const words = line.trim().split(/\s+/);
      const enhancedWords = words
        .map((word) => `<${timestamp}>${word}`)
        .join(" ");

      return `[${timestamp}]${enhancedWords}`;
    })
    .join("\n");
}
