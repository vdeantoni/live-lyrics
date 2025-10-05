import { Hono } from "hono";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { execFile } from "child_process";
import { cors } from "hono/cors";
import type { SongResponse, ErrorResponse } from "./types";
import { setupWebSocket } from "./websocket";

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

    execFile("osascript", osascriptArgs, (error, _stdout, stderr) => {
      if (error || stderr) {
        console.error(
          `[Server] Error executing AppleScript: ${error || stderr}`,
        );
      }
    });
  }

  return c.json({ message: "Music app command received" });
});

export { app };

// Only start server if this file is run directly
if (require.main === module) {
  const PORT = 4000;

  // Create HTTP server
  const httpServer = createServer();

  // Create WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // Attach Hono app to HTTP server for regular HTTP requests
  httpServer.on("request", async (req, res) => {
    const request = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await new Promise<string>((resolve) => {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk;
              });
              req.on("end", () => resolve(body));
            })
          : undefined,
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  });

  // Handle WebSocket upgrade requests
  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `ws://localhost:${PORT}`);

    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Setup WebSocket handlers
  setupWebSocket(wss);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
  });
}
