import { describe, it, expect } from "vitest";
import { formatTime, cn } from "../lib/utils";

describe("Utils", () => {
  describe("formatTime", () => {
    it("formats seconds correctly", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(30)).toBe("0:30");
      expect(formatTime(60)).toBe("1:00");
      expect(formatTime(90)).toBe("1:30");
      expect(formatTime(3661)).toBe("61:01");
    });

    it("pads seconds with leading zero", () => {
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(125)).toBe("2:05");
    });

    it("handles edge cases", () => {
      expect(formatTime(NaN)).toBe("0:00");
      expect(formatTime(null as unknown as number)).toBe("0:00");
      expect(formatTime(undefined as unknown as number)).toBe("0:00");
    });

    it("handles large numbers", () => {
      expect(formatTime(7200)).toBe("120:00"); // 2 hours
      expect(formatTime(7261)).toBe("121:01"); // 2 hours 1 minute 1 second
    });
  });

  describe("cn (className utility)", () => {
    it("merges class names correctly", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const isInactive = false;
      expect(cn("base", isActive && "active", isInactive && "inactive")).toBe(
        "base active",
      );
    });

    it("handles Tailwind conflicts", () => {
      // twMerge should resolve conflicts
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn(null, undefined, "")).toBe("");
    });
  });
});
