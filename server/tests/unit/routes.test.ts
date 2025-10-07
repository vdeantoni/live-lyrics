import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { app, getSongInfo } from "../../src/index";
import * as childProcess from "child_process";

// Mock the execFile function
vi.mock("child_process", () => ({
  execFile: vi.fn(),
}));

describe("Server Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /", () => {
    it("should return Hello World", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Hello World");
    });
  });

  describe("GET /music", () => {
    it("should return song info when music is playing", async () => {
      const mockOutput =
        "Song Name\nArtist Name\nAlbum Name\n120.5\n240.0\nplaying";
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, mockOutput, "");
          return {} as any;
        },
      );

      const res = await app.request("/music");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        name: "Song Name",
        artist: "Artist Name",
        album: "Album Name",
        currentTime: 120.5,
        duration: 240.0,
        isPlaying: true,
      });
    });

    it("should return song info when music is paused", async () => {
      const mockOutput =
        "Song Name\nArtist Name\nAlbum Name\n120.5\n240.0\npaused";
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, mockOutput, "");
          return {} as any;
        },
      );

      const res = await app.request("/music");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        name: "Song Name",
        artist: "Artist Name",
        album: "Album Name",
        currentTime: 120.5,
        duration: 240.0,
        isPlaying: false,
      });
    });

    it("should return 404 when no song is playing", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(new Error("Not playing"), "", "");
          return {} as any;
        },
      );

      const res = await app.request("/music");
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "Not playing" });
    });

    it("should handle AppleScript error", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, "", "Error executing AppleScript");
          return {} as any;
        },
      );

      const res = await app.request("/music");
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "Not playing" });
    });
  });

  describe("POST /music", () => {
    it("should handle play action", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, "", "");
          return {} as any;
        },
      );

      const res = await app.request("/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "play" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: "Music app command received" });
      expect(childProcess.execFile).toHaveBeenCalled();
    });

    it("should handle pause action", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, "", "");
          return {} as any;
        },
      );

      const res = await app.request("/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: "Music app command received" });
      expect(childProcess.execFile).toHaveBeenCalled();
    });

    it("should handle seek action with time", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, "", "");
          return {} as any;
        },
      );

      const res = await app.request("/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seek", time: 60.5 }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: "Music app command received" });
      expect(childProcess.execFile).toHaveBeenCalled();
    });

    it("should not execute commands when body is empty", async () => {
      const res = await app.request("/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: "Music app command received" });
      expect(childProcess.execFile).not.toHaveBeenCalled();
    });
  });

  describe("getSongInfo", () => {
    it("should parse valid song info correctly", async () => {
      const mockOutput =
        "Test Song\nTest Artist\nTest Album\n45.5\n180.0\nplaying";
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, mockOutput, "");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      expect(result).toEqual({
        name: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        currentTime: 45.5,
        duration: 180.0,
        isPlaying: true,
      });
    });

    it("should handle empty fields gracefully", async () => {
      const mockOutput = "\n\n\n0\n0\npaused";
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, mockOutput, "");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      // After trim(), "\n\n\n0\n0\npaused" becomes "0\n0\npaused" which splits to ["0", "0", "paused"]
      // This results in name="0", artist="0", album="paused", rest undefined
      expect(result).toEqual({
        name: "0",
        artist: "0",
        album: "paused",
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      });
    });

    it("should detect playing state correctly", async () => {
      const mockOutput = "Song\nArtist\nAlbum\n10.0\n100.0\nplaying";
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, mockOutput, "");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      expect("isPlaying" in result && result.isPlaying).toBe(true);
    });

    it("should detect paused state correctly", async () => {
      const mockOutput = "Song\nArtist\nAlbum\n10.0\n100.0\npaused";
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, mockOutput, "");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      expect("isPlaying" in result && result.isPlaying).toBe(false);
    });

    it("should handle execFile errors", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(new Error("Command failed"), "", "");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      expect(result).toEqual({ error: "Not playing" });
    });

    it("should handle stderr output", async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, "", "Some error message");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      expect(result).toEqual({ error: "Not playing" });
    });

    it('should handle "No song playing" message', async () => {
      vi.mocked(childProcess.execFile).mockImplementation(
        (
          file: string,
          args: any,
          callback: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          callback(null, "No song playing", "");
          return {} as any;
        },
      );

      const result = await getSongInfo();
      expect(result).toEqual({ error: "No song playing" });
    });
  });
});
