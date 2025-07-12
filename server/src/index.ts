import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { execFile } from "child_process";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

app.get("/", (c) => c.text("Hello World"));

app.get("/music", async (c) => {
  return new Promise((resolve) => {
    const delimiter = "|~|";
    const scriptLines = [
      'tell application "Music"',
      '  if player state is not playing then',
      '    error "Music is not playing."',
      '  end if',
      "  set oldDelimiters to AppleScript's text item delimiters",
      `  set AppleScript's text item delimiters to {"${delimiter}"}`,
      '  set trackInfo to {duration, name, artist, album} of current track',
      '  set trackInfoString to trackInfo as string',
      "  set AppleScript's text item delimiters to oldDelimiters",
      '  trackInfoString',
      'end tell',
    ];

    const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        console.log(error || stderr);
        return resolve(c.json({ error: "Not playing" }, 404));
      }
      console.log(stdout.trim());
      const [duration, name, artist, album] = stdout.trim().split(delimiter);
      return resolve(c.json({ duration, name, artist, album }));
    });
  });
});

serve(app);
