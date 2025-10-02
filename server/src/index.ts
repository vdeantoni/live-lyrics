import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { execFile } from "child_process";
import { cors } from "hono/cors";
import type { SongResponse, ErrorResponse } from "./types";

const app = new Hono();

app.use(cors());

const scriptLines = [
  'tell application "Music"',
  "    set playerState to player state",
  "    set currentTrack to current track",
  "    set trackName to name of currentTrack",
  "    set artistName to artist of currentTrack",
  "    set albumName to album of currentTrack",
  "    set currentTime to player position",
  "    set totalTime to duration of currentTrack",
  '    return trackName & "\n" & artistName & "\n" & albumName & "\n" & currentTime & "\n" & totalTime & "\n" & playerState',
  "end tell",
];

const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

export function getSongInfo(): Promise<SongResponse | ErrorResponse> {
  return new Promise((resolve) => {
    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        resolve({ error: "Not playing" });
        return;
      }

      const output = stdout.trim();
      console.log(output);

      if (output === "No song playing") {
        resolve({ error: "No song playing" });
        return;
      }

      const [name, artist, album, currentTime, duration, playerState] =
        output.split("\n");

      // Convert AppleScript output to proper Song format
      const song: SongResponse = {
        name: name || "",
        artist: artist || "",
        album: album || "",
        currentTime: parseFloat(currentTime) || 0,
        duration: parseFloat(duration) || 0,
        isPlaying: playerState === "playing",
      };

      resolve(song);
    });
  });
}

app.get("/", (c) => c.text("Hello World"));

app.get("/music", async (c) => {
  const songInfo = await getSongInfo();
  if ("error" in songInfo) {
    return c.json(songInfo, 404);
  }
  return c.json(songInfo);
});

app.post("/music", async (c) => {
  const body = await c.req.json();
  console.log("[Server] Received music control request:", body);
  const commands: string[] = [];

  // Handle new action-based format
  if (body.action) {
    console.log(`[Server] Processing action: ${body.action}`);
    switch (body.action) {
      case "play":
        commands.push("play");
        break;
      case "pause":
        commands.push("pause");
        break;
      case "seek":
        if (body.time !== undefined) {
          commands.push(`set player position to ${body.time}`);
        }
        break;
    }
  }
  // Handle old format for backward compatibility
  else {
    console.log("[Server] Processing legacy format");
    const { playing, currentTime } = body;

    if (playing === true) {
      commands.push("play");
    } else if (playing === false) {
      commands.push("pause");
    }

    if (currentTime !== undefined) {
      commands.push(`set player position to ${currentTime}`);
    }
  }

  if (commands.length > 0) {
    console.log(
      `[Server] Executing AppleScript commands: ${commands.join(", ")}`,
    );
    const scriptLines = [
      'tell application "Music"',
      ...commands.map((cmd) => `    ${cmd}`),
      "end tell",
    ];

    const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(
          `[Server] Error executing AppleScript: ${error || stderr}`,
        );
      } else {
        console.log(
          `[Server] Music app command executed successfully: ${commands.join(", ")}`,
        );
      }
    });
  } else {
    console.log("[Server] No commands to execute");
  }

  return c.json({ message: "Music app command received" });
});

export { app };

// Only start server if this file is run directly
if (require.main === module) {
  serve({
    fetch: app.fetch,
    port: 4000,
  });
}
