import { describe, it, expect } from "vitest";
import {
  isEnhancedLrc,
  isNormalLrc,
  normalizeLyricsToEnhanced,
} from "@/utils/lyricsNormalizer";

describe("lyricsNormalizer", () => {
  describe("isEnhancedLrc", () => {
    it("should return true for lyrics with word-level timing markers", () => {
      const lyrics = "[00:12.00]<00:12.00>Hello <00:12.50>world";
      expect(isEnhancedLrc(lyrics)).toBe(true);
    });

    it("should return true for lyrics with multiple timestamps per line", () => {
      const lyrics = "[00:12.00]Hello world[00:15.00]Next line";
      expect(isEnhancedLrc(lyrics)).toBe(true);
    });

    it("should return false for normal LRC format", () => {
      const lyrics = "[00:12.00]Hello world\n[00:15.00]Next line";
      expect(isEnhancedLrc(lyrics)).toBe(false);
    });

    it("should return false for plain text", () => {
      const lyrics = "Hello world\nNext line";
      expect(isEnhancedLrc(lyrics)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isEnhancedLrc(null)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isEnhancedLrc("")).toBe(false);
    });
  });

  describe("isNormalLrc", () => {
    it("should return true for standard LRC format", () => {
      const lyrics = "[00:12.00]Hello world\n[00:15.00]Next line";
      expect(isNormalLrc(lyrics)).toBe(true);
    });

    it("should return false for enhanced LRC", () => {
      const lyrics = "[00:12.00]<00:12.00>Hello <00:12.50>world";
      expect(isNormalLrc(lyrics)).toBe(false);
    });

    it("should return false for plain text", () => {
      const lyrics = "Hello world\nNext line";
      expect(isNormalLrc(lyrics)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isNormalLrc(null)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isNormalLrc("")).toBe(false);
    });

    it("should handle LRC with metadata lines", () => {
      const lyrics =
        "[ar:Artist]\n[ti:Title]\n[00:12.00]Hello world\n[00:15.00]Next line";
      expect(isNormalLrc(lyrics)).toBe(true);
    });
  });

  describe("normalizeLyricsToEnhanced", () => {
    describe("Enhanced LRC pass-through", () => {
      it("should pass through Enhanced LRC unchanged", () => {
        const lyrics = "[00:12.00]<00:12.00>Hello <00:12.50>world";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(lyrics);
      });

      it("should pass through multi-timestamp Enhanced LRC unchanged", () => {
        const lyrics = "[00:12.00]Hello[00:15.00]world";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(lyrics);
      });
    });

    describe("Normal LRC normalization", () => {
      it("should add word-level timing to normal LRC", () => {
        const lyrics = "[00:12.00]Hello world test";
        const expected =
          "[00:12.00]<00:12.00>Hello <00:12.00>world <00:12.00>test";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });

      it("should handle multiple lines", () => {
        const lyrics = "[00:12.00]Hello world\n[00:15.00]Next line";
        const expected =
          "[00:12.00]<00:12.00>Hello <00:12.00>world\n[00:15.00]<00:15.00>Next <00:15.00>line";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });

      it("should preserve metadata lines", () => {
        const lyrics = "[ar:Artist]\n[ti:Title]\n[00:12.00]Hello world";
        const expected =
          "[ar:Artist]\n[ti:Title]\n[00:12.00]<00:12.00>Hello <00:12.00>world";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });

      it("should preserve empty lines", () => {
        const lyrics = "[00:12.00]Hello\n\n[00:15.00]World";
        const expected =
          "[00:12.00]<00:12.00>Hello\n\n[00:15.00]<00:15.00>World";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });

      it("should handle lines with only timestamps", () => {
        const lyrics = "[00:12.00]\n[00:15.00]Hello";
        const expected = "[00:12.00]\n[00:15.00]<00:15.00>Hello";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });

      it("should handle multiple spaces between words", () => {
        const lyrics = "[00:12.00]Hello    world";
        const expected = "[00:12.00]<00:12.00>Hello <00:12.00>world";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });

      it("should trim whitespace after timestamp", () => {
        const lyrics = "[00:12.00]  Hello world  ";
        const expected = "[00:12.00]<00:12.00>Hello <00:12.00>world";
        expect(normalizeLyricsToEnhanced(lyrics)).toBe(expected);
      });
    });

    describe("Plain text normalization", () => {
      it("should add timestamps to plain text", () => {
        const text = "Hello world";
        const expected = "[00:00.00]<00:00.00>Hello <00:00.00>world";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should use 2-second intervals for multiple lines", () => {
        const text = "First line\nSecond line\nThird line";
        const expected =
          "[00:00.00]<00:00.00>First <00:00.00>line\n" +
          "[00:02.00]<00:02.00>Second <00:02.00>line\n" +
          "[00:04.00]<00:04.00>Third <00:04.00>line";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should handle timestamps over 60 seconds correctly", () => {
        const lines = Array(35).fill("Line");
        const text = lines.join("\n");
        const result = normalizeLyricsToEnhanced(text);

        // Check first line (0 seconds)
        expect(result).toContain("[00:00.00]");

        // Check 30th line (60 seconds = 1 minute)
        expect(result).toContain("[01:00.00]");

        // Check 35th line (68 seconds = 1:08)
        expect(result).toContain("[01:08.00]");
      });

      it("should filter out empty lines", () => {
        const text = "First line\n\n\nSecond line";
        const expected =
          "[00:00.00]<00:00.00>First <00:00.00>line\n" +
          "[00:02.00]<00:02.00>Second <00:02.00>line";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should handle lines with multiple spaces", () => {
        const text = "Hello    world    test";
        const expected =
          "[00:00.00]<00:00.00>Hello <00:00.00>world <00:00.00>test";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should trim whitespace from lines", () => {
        const text = "  Hello world  \n  Next line  ";
        const expected =
          "[00:00.00]<00:00.00>Hello <00:00.00>world\n" +
          "[00:02.00]<00:02.00>Next <00:02.00>line";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });
    });

    describe("Edge cases", () => {
      it("should return empty string for null input", () => {
        expect(normalizeLyricsToEnhanced("")).toBe("");
      });

      it("should return empty string for whitespace-only input", () => {
        expect(normalizeLyricsToEnhanced("   \n  \n  ")).toBe("");
      });

      it("should handle single word lines", () => {
        const text = "Hello\nWorld";
        const expected = "[00:00.00]<00:00.00>Hello\n[00:02.00]<00:02.00>World";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should handle very long lines", () => {
        const words = Array(100).fill("word");
        const text = words.join(" ");
        const result = normalizeLyricsToEnhanced(text);

        // Should have 100 word timestamps
        const timestampCount = (result.match(/<00:00.00>/g) || []).length;
        expect(timestampCount).toBe(100);
      });

      it("should handle special characters in lyrics", () => {
        const text = "Hello! How are you? I'm fine.";
        const expected =
          "[00:00.00]<00:00.00>Hello! <00:00.00>How <00:00.00>are <00:00.00>you? <00:00.00>I'm <00:00.00>fine.";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should handle Unicode characters", () => {
        const text = "你好 世界";
        const expected = "[00:00.00]<00:00.00>你好 <00:00.00>世界";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });

      it("should handle emojis", () => {
        const text = "Hello 👋 World 🌍";
        const expected =
          "[00:00.00]<00:00.00>Hello <00:00.00>👋 <00:00.00>World <00:00.00>🌍";
        expect(normalizeLyricsToEnhanced(text)).toBe(expected);
      });
    });
  });
});
