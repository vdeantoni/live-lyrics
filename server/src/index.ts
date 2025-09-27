import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { execFile } from "child_process";
import { cors } from "hono/cors";

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

function getSongInfo(): Promise<any> {
  return new Promise((resolve) => {
    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        resolve({ error: "Not playing" });
        return;
      }

      const output = stdout.trim();
      console.log(output);

      if (output === "No song playing") {
        resolve({ message: "No song playing" });
        return;
      }

      const [name, artist, album, currentTime, duration, playerState] =
        output.split("\n");

      resolve({
        name,
        artist,
        album,
        currentTime,
        duration,
        playerState,
      });
    });
  });
}

app.get("/", (c) => c.text("Hello World"));

app.get("/music", async (c) => {
  const songInfo = await getSongInfo();
  if (songInfo.error) {
    return c.json(songInfo, 404);
  }
  return c.json(songInfo);
});

app.post("/music", async (c) => {
  const body = await c.req.json();
  const commands: string[] = [];

  // Handle new action-based format
  if (body.action) {
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
    const scriptLines = [
      'tell application "Music"',
      ...commands.map((cmd) => `    ${cmd}`),
      "end tell",
    ];

    const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`Error executing AppleScript: ${error || stderr}`);
      } else {
        console.log(`Music app command executed: ${commands.join(", ")}`);
      }
    });
  }

  return c.json({ message: "Music app command received" });
});

serve({
  fetch: app.fetch,
  port: 4000,
});
