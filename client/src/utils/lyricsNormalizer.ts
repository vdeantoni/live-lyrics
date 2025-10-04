/**
 * Lyrics format normalization utilities
 *
 * This module provides functions to detect and normalize different lyrics formats
 * into a consistent Enhanced LRC format for the application.
 */

import type { LyricsData } from "@/types";
import { LYRICS_SILENCE } from "@/constants/timing";
import Liricle from "liricle";

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
 * Format seconds to LRC timestamp format [MM:SS.xx]
 */
function formatLrcTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const centisecs = Math.floor((secs - wholeSecs) * 100);

  return `${minutes.toString().padStart(2, "0")}:${wholeSecs.toString().padStart(2, "0")}.${centisecs.toString().padStart(2, "0")}`;
}

/**
 * Insert silence indicator lines into LRC content string
 * This happens BEFORE Liricle parsing so sync works properly
 */
export function insertSilenceIndicatorsIntoLrc(
  lrcContent: string,
  duration?: number,
): string {
  if (!lrcContent || lrcContent.trim() === "") {
    return lrcContent;
  }

  // Parse with Liricle to get timing data
  const tempLiricle = new Liricle();
  let parsedData: LyricsData | null = null;

  tempLiricle.on("load", (data: LyricsData) => {
    parsedData = data;
  });

  tempLiricle.load({ text: lrcContent });

  // TypeScript narrowing: Need to check parsedData after event handler executes
  // We assert the type since Liricle.load() calls the event handler synchronously
  if (!parsedData) {
    return lrcContent;
  }

  const data = parsedData as LyricsData & { lines: unknown[] };
  if (!data.lines || data.lines.length < 2) {
    return lrcContent;
  }

  const { DETECTION_THRESHOLD, INDICATOR_DELAY } = LYRICS_SILENCE;
  const lines = lrcContent.split("\n");
  const newLines: string[] = [];

  // Separate metadata lines from lyric lines
  const metadataLines: string[] = [];
  const lyricLineMap = new Map<number, string>(); // time -> original line
  const emptyLines: number[] = []; // Track empty line positions

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Preserve completely empty lines
    if (!trimmed) {
      emptyLines.push(idx);
      return;
    }

    // Check if it's a metadata tag like [ar:Artist]
    if (/^\[[a-z]+:/.test(trimmed)) {
      metadataLines.push(line);
    } else if (/^\[\d{2}:\d{2}\.\d{2}\]/.test(trimmed)) {
      // It's a lyric line - extract timestamp
      const match = trimmed.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const centiseconds = parseInt(match[3]);
        const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
        lyricLineMap.set(timeInSeconds, line);
      }
    }
  });

  // Add metadata at the top
  newLines.push(...metadataLines);
  if (metadataLines.length > 0 && lyricLineMap.size > 0) {
    newLines.push(""); // Blank line after metadata
  }

  // Process lyric lines and insert silence indicators
  const sortedTimes = Array.from(lyricLineMap.keys()).sort((a, b) => a - b);

  // Check if we need silence indicator at the beginning
  if (sortedTimes.length > 0) {
    const firstTime = sortedTimes[0];
    if (firstTime > DETECTION_THRESHOLD) {
      const silenceStartTime = 0;
      const startTimestamp = formatLrcTimestamp(silenceStartTime);

      // Add silence marker
      newLines.push(`[${startTimestamp}]<${startTimestamp}>♪`);
    }
  }

  for (let i = 0; i < sortedTimes.length; i++) {
    const currentTime = sortedTimes[i];
    const currentLine = lyricLineMap.get(currentTime)!;
    const nextTime = sortedTimes[i + 1];

    // Add current line
    newLines.push(currentLine);

    // Check if there were empty lines after this in the original
    const currentLineOriginalIndex = lines.indexOf(currentLine);
    const nextLineOriginalIndex =
      nextTime !== undefined
        ? lines.indexOf(lyricLineMap.get(nextTime)!)
        : lines.length;

    // Preserve empty lines between lyrics
    for (const emptyIdx of emptyLines) {
      if (
        emptyIdx > currentLineOriginalIndex &&
        emptyIdx < nextLineOriginalIndex
      ) {
        newLines.push("");
      }
    }

    // Check if we need to insert silence indicator
    if (nextTime !== undefined) {
      const gapDuration = nextTime - currentTime;

      if (gapDuration > DETECTION_THRESHOLD) {
        const silenceStartTime = currentTime + INDICATOR_DELAY;
        const startTimestamp = formatLrcTimestamp(silenceStartTime);

        // Add silence marker
        newLines.push(`[${startTimestamp}]<${startTimestamp}>♪`);
      }
    }
  }

  // Check if we need silence indicator at the end
  if (sortedTimes.length > 0 && duration !== undefined && duration > 0) {
    const lastTime = sortedTimes[sortedTimes.length - 1];
    const gapAtEnd = duration - lastTime;

    if (gapAtEnd > DETECTION_THRESHOLD) {
      const silenceStartTime = lastTime + INDICATOR_DELAY;
      const startTimestamp = formatLrcTimestamp(silenceStartTime);

      // Add start marker only (no end marker since song ends)
      newLines.push(`[${startTimestamp}]<${startTimestamp}>♪`);
    }
  }

  return newLines.join("\n");
}

/**
 * Normalize lyrics to Enhanced LRC format with silence indicators
 *
 * Handles three input formats:
 * 1. Enhanced LRC (word-level timing) → Add silence indicators
 * 2. Normal LRC (line-level timing) → Add word-level timing + silence indicators
 * 3. Plain text → Add both line and word-level timestamps + silence indicators
 *
 * @param lyrics - Raw lyrics content in any format
 * @param duration - Optional song duration in seconds for end silence detection
 * @returns Normalized Enhanced LRC content with silence indicators
 */
export function normalizeLyricsToEnhanced(
  lyrics: string,
  duration?: number,
): string {
  if (!lyrics || lyrics.trim() === "") {
    return "";
  }

  let normalized = lyrics;

  // Already enhanced LRC - pass through
  if (isEnhancedLrc(lyrics)) {
    normalized = lyrics;
  }
  // Normal LRC - add word-level timing at the start of each line
  else if (isNormalLrc(lyrics)) {
    normalized = normalizeNormalLrcToEnhanced(lyrics);
  }
  // Plain text - add both line and word-level timing
  else {
    normalized = normalizePlainTextToEnhanced(lyrics);
  }

  // Add silence indicators to the normalized LRC
  return insertSilenceIndicatorsIntoLrc(normalized, duration);
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
