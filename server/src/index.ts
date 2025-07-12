import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { execFile } from "child_process";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

let currentSongInfo: any = { message: "No song playing" };

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

function updateSongInfo() {
  execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
    if (error || stderr) {
      currentSongInfo = { error: "Not playing" };
      return;
    }

    const output = stdout.trim();
    console.log(output);

    if (output === "No song playing") {
      currentSongInfo = { message: "No song playing" };
      return;
    }

    const [name, artist, album, currentTime, duration, playerState] =
      output.split("\n");

    currentSongInfo = {
      name,
      artist,
      album,
      currentTime,
      duration,
      playerState,
    };
  });
}

setInterval(updateSongInfo, 100);

app.get("/", (c) => c.text("Hello World"));

app.get("/music", (c) => {
  if (currentSongInfo.error) {
    return c.json(currentSongInfo, 404);
  }
  return c.json(currentSongInfo);
});

app.post("/music", async (c) => {
  const { playing, currentTime } = await c.req.json();
  let scriptCommand: string;

  if (playing) {
    scriptCommand = 'tell application "Music" to play';
  } else {
    scriptCommand = 'tell application "Music" to pause';
  }

  execFile("osascript", ["-e", scriptCommand], (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(`Error executing AppleScript: ${error || stderr}`);
      return c.json({ error: "Failed to control Music app" }, 500);
    }
    console.log(`Music app command executed: ${scriptCommand}`);
  });

  return c.json({ message: `Music app set to ${playing ? "play" : "pause"}` });
});

serve({
  fetch: app.fetch,
  port: 4000,
});
