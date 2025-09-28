import { describe, it, expect } from "vitest";

describe("Test Setup", () => {
  it("should run basic tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have vitest globals available", () => {
    expect(typeof describe).toBe("function");
    expect(typeof it).toBe("function");
    expect(typeof expect).toBe("function");
  });
});
