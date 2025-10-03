import { describe, it, expect } from "vitest";
import {
  insertSilenceIndicatorsIntoLrc,
  isEnhancedLrc,
  normalizeLyricsToEnhanced,
} from "@/utils/lyricsNormalizer";

describe("Silence Indicator Detection", () => {
  describe("insertSilenceIndicatorsIntoLrc", () => {
    it("should not insert silence indicators for gaps shorter than threshold", () => {
      const lrcContent = `[00:00.00]Line 1
[00:05.00]Line 2
[00:10.00]Line 3`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);
      const lines = result.split("\n").filter((l) => l.trim());

      expect(lines).toHaveLength(3);
      expect(result.includes("♪")).toBe(false);
    });

    it("should insert silence indicator for gap longer than threshold", () => {
      const lrcContent = `[00:00.00]Line 1
[00:30.00]Line 2`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);
      const lines = result.split("\n").filter((l) => l.trim());

      expect(lines).toHaveLength(3); // 2 original + 1 silence
      expect(result).toContain("♪");
      expect(result).toContain("[00:01.00]"); // 0 + INDICATOR_DELAY(1)
    });

    it("should insert multiple silence indicators for multiple gaps", () => {
      const lrcContent = `[00:00.00]Line 1
[00:25.00]Line 2
[00:30.00]Line 3
[00:55.00]Line 4`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);
      const silenceCount = (result.match(/♪/g) || []).length;

      expect(silenceCount).toBe(2);
    });

    it("should handle Bohemian Rhapsody instrumental break", () => {
      // Simplified version of Bohemian Rhapsody with the famous instrumental break
      const lrcContent = `[00:13.00]Open your eyes
[00:15.50]Look up to the skies and see
[00:45.00]Mama, just killed a man`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      // Should detect the ~29.5s gap between "see" and "Mama"
      expect(result).toContain("♪");
      expect(result).toContain("[00:16.50]"); // 15.5 + INDICATOR_DELAY(1)

      // Verify the silence indicator is positioned correctly
      const lines = result.split("\n");
      const silenceLineIndex = lines.findIndex((l) => l.includes("♪"));

      expect(silenceLineIndex).toBeGreaterThan(0);
      expect(silenceLineIndex).toBeLessThan(lines.length - 1);

      // Silence should be between the two lyrics
      const beforeSilence = lines[silenceLineIndex - 1];
      const afterSilence = lines[silenceLineIndex + 1];

      expect(beforeSilence).toContain("Look up to the skies and see");
      expect(afterSilence).toContain("Mama, just killed a man");
    });

    it("should handle empty or null input", () => {
      expect(insertSilenceIndicatorsIntoLrc("")).toBe("");
      expect(insertSilenceIndicatorsIntoLrc("   ")).toBe("   ");
    });

    it("should preserve metadata tags", () => {
      const lrcContent = `[ar:Test Artist]
[ti:Test Song]
[00:00.00]Line 1
[00:30.00]Line 2`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      expect(result).toContain("[ar:Test Artist]");
      expect(result).toContain("[ti:Test Song]");
      expect(result).toContain("♪");
    });

    it("should format timestamps correctly", () => {
      const lrcContent = `[00:00.00]Line 1
[00:30.00]Line 2`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      // Should have silence indicator at 1 second (0 + INDICATOR_DELAY)
      expect(result).toContain("[00:01.00]");
      expect(result).toContain("<00:01.00>♪");
    });

    it("should handle single line lyrics", () => {
      const lrcContent = "[00:00.00]Only line";
      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      expect(result).toBe(lrcContent);
      expect(result.includes("♪")).toBe(false);
    });

    it("should handle enhanced LRC input", () => {
      const enhancedLrc = `[00:00.00]<00:00.00>Hello <00:00.50>world
[00:30.00]<00:30.00>Next <00:30.50>line`;

      const result = insertSilenceIndicatorsIntoLrc(enhancedLrc);

      expect(result).toContain("♪");
      expect(result).toContain("<00:01.00>♪");
    });

    it("should not insert silence at exactly threshold duration", () => {
      const lrcContent = `[00:00.00]Line 1
[00:20.00]Line 2`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      // Gap is exactly 20s, should not insert (must be GREATER than threshold)
      expect(result.includes("♪")).toBe(false);
    });

    it("should insert for gap just above threshold", () => {
      const lrcContent = `[00:00.00]Line 1
[00:20.10]Line 2`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      expect(result).toContain("♪");
    });

    it("should handle complex timestamps with minutes", () => {
      const lrcContent = `[01:00.00]Line 1
[01:30.00]Line 2`;

      const result = insertSilenceIndicatorsIntoLrc(lrcContent);

      expect(result).toContain("♪");
      expect(result).toContain("[01:01.00]"); // 60 + 1 = 61s = 1:01
    });
  });

  describe("Integration with normalizeLyricsToEnhanced", () => {
    it("should add silence indicators to enhanced LRC", () => {
      const enhancedLrc = `[00:00.00]<00:00.00>Hello
[00:30.00]<00:30.00>World`;

      const result = normalizeLyricsToEnhanced(enhancedLrc);

      expect(result).toContain("♪");
    });

    it("should add silence indicators to normal LRC", () => {
      const normalLrc = `[00:00.00]Hello
[00:30.00]World`;

      const result = normalizeLyricsToEnhanced(normalLrc);

      expect(result).toContain("♪");
      expect(result).toContain("<"); // Should have word-level timing
    });

    it("should work with plain text", () => {
      // Plain text gets 2s intervals, so we need many lines to trigger >20s gap
      const plainText = `Line 1
Line 2
Line 3
Line 4
Line 5
Line 6
Line 7`;

      const result = normalizeLyricsToEnhanced(plainText);

      // With 2s per line, consecutive lines are only 2s apart, so no silence indicators
      expect(isEnhancedLrc(result)).toBe(true);
    });
  });
});
