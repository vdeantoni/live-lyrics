import { WebSocketServer, WebSocket } from "ws";
import { execFile } from "child_process";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  JsonRpcError,
  JsonRpcErrorCode,
  PlayerMethod,
  Song,
} from "./types";
import { getSongInfo } from "./index";

const JSON_RPC_VERSION = "2.0" as const;

/**
 * Create a JSON-RPC error response
 */
function createErrorResponse(
  id: string | number | null,
  code: JsonRpcErrorCode,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: JSON_RPC_VERSION,
    error: {
      code,
      message,
      data,
    },
    id,
  };
}

/**
 * Create a JSON-RPC success response
 */
function createSuccessResponse(
  id: string | number,
  result: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: JSON_RPC_VERSION,
    result,
    id,
  };
}

/**
 * Create a JSON-RPC notification (no id)
 */
function createNotification(method: string, params?: any): JsonRpcNotification {
  return {
    jsonrpc: JSON_RPC_VERSION,
    method,
    params,
  };
}

/**
 * Handle player control commands
 */
async function handlePlayerMethod(
  method: PlayerMethod,
  params?: unknown,
): Promise<void> {
  const commands: string[] = [];

  switch (method) {
    case "player.play":
      commands.push("play");
      break;

    case "player.pause":
      commands.push("pause");
      break;

    case "player.seek":
      if (!params || typeof params !== "object" || !("time" in params)) {
        throw {
          code: -32602, // INVALID_PARAMS
          message: "Invalid params: 'time' must be a number",
        } as JsonRpcError;
      }
      const seekParams = params as { time: unknown };
      if (typeof seekParams.time !== "number") {
        throw {
          code: -32602, // INVALID_PARAMS
          message: "Invalid params: 'time' must be a number",
        } as JsonRpcError;
      }
      commands.push(`set player position to ${seekParams.time}`);
      break;

    case "player.next":
      commands.push("next track");
      break;

    case "player.previous":
      commands.push("previous track");
      break;

    default:
      throw {
        code: -32601, // METHOD_NOT_FOUND
        message: `Method not found: ${method}`,
      } as JsonRpcError;
  }

  if (commands.length > 0) {
    const scriptLines = [
      'tell application "Music"',
      ...commands.map((cmd) => `    ${cmd}`),
      "end tell",
    ];

    const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

    return new Promise((resolve, reject) => {
      execFile("osascript", osascriptArgs, (error, _stdout, stderr) => {
        if (error || stderr) {
          console.error(
            `[WebSocket] Error executing AppleScript: ${error || stderr}`,
          );
          reject({
            code: -32000, // APPLESCRIPT_FAILED
            message: "AppleScript execution failed",
            data: error?.message || stderr,
          } as JsonRpcError);
        } else {
          console.log(
            `[WebSocket] Music app command executed successfully: ${commands.join(", ")}`,
          );
          resolve();
        }
      });
    });
  }
}

/**
 * Handle incoming JSON-RPC messages
 */
async function handleJsonRpcMessage(
  ws: WebSocket,
  message: JsonRpcRequest,
): Promise<void> {
  const { method, params, id } = message;

  // Validate JSON-RPC version
  if (message.jsonrpc !== JSON_RPC_VERSION) {
    const response = createErrorResponse(
      id ?? null,
      -32600, // INVALID_REQUEST
      "Invalid Request: jsonrpc must be '2.0'",
    );
    ws.send(JSON.stringify(response));
    return;
  }

  try {
    // Handle player methods
    if (method.startsWith("player.")) {
      await handlePlayerMethod(method as PlayerMethod, params);

      // Only send response if this is a request (has id)
      if (id !== undefined) {
        const response = createSuccessResponse(id, { success: true });
        ws.send(JSON.stringify(response));
      }
      return;
    }

    // Handle server.ping
    if (method === "server.ping") {
      if (id !== undefined) {
        const response = createSuccessResponse(id, {
          timestamp: Date.now(),
          uptime: process.uptime(),
        });
        ws.send(JSON.stringify(response));
      }
      return;
    }

    // Unknown method
    const response = createErrorResponse(
      id ?? null,
      -32601, // METHOD_NOT_FOUND
      `Method not found: ${method}`,
    );
    ws.send(JSON.stringify(response));
  } catch (error: any) {
    // Handle JSON-RPC errors
    if (error && typeof error === "object" && "code" in error) {
      const response = createErrorResponse(
        id ?? null,
        error.code,
        error.message,
        error.data,
      );
      ws.send(JSON.stringify(response));
    } else {
      // Generic internal error
      const response = createErrorResponse(
        id ?? null,
        -32603, // INTERNAL_ERROR
        "Internal error",
        error?.message,
      );
      ws.send(JSON.stringify(response));
    }
  }
}

/**
 * Broadcast song updates to all connected clients
 */
function broadcastSongUpdate(wss: WebSocketServer, song: Song): void {
  const notification = createNotification("song.update", song);
  const message = JSON.stringify(notification);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Setup WebSocket server with JSON-RPC protocol
 */
export function setupWebSocket(wss: WebSocketServer): void {
  let lastSong: Song | null = null;
  let pollInterval: NodeJS.Timeout | null = null;

  // Start polling AppleScript for song updates
  const startPolling = () => {
    if (pollInterval) {
      return;
    }

    pollInterval = setInterval(async () => {
      try {
        const songInfo = await getSongInfo();

        // Only broadcast if song data is valid
        if ("error" in songInfo) {
          return;
        }

        // Only broadcast if song changed
        const songChanged =
          !lastSong ||
          lastSong.name !== songInfo.name ||
          lastSong.artist !== songInfo.artist ||
          Math.abs(lastSong.currentTime - songInfo.currentTime) > 1 ||
          lastSong.isPlaying !== songInfo.isPlaying;

        if (songChanged) {
          lastSong = songInfo;
          broadcastSongUpdate(wss, songInfo);
        }
      } catch (error) {
        console.error("[WebSocket] Error polling song info:", error);
      }
    }, 300);
  };

  // Stop polling when no clients connected
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    const clientCount = wss.clients.size;

    // Start polling when first client connects
    if (clientCount === 1) {
      startPolling();
    }

    // Send current song immediately on connection
    if (lastSong) {
      const notification = createNotification("song.update", lastSong);
      ws.send(JSON.stringify(notification));
    }

    // Handle incoming messages
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString()) as JsonRpcRequest;
        await handleJsonRpcMessage(ws, message);
      } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
        const response = createErrorResponse(
          null,
          -32700, // PARSE_ERROR
          "Parse error: Invalid JSON",
        );
        ws.send(JSON.stringify(response));
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      // Stop polling when no clients connected
      if (wss.clients.size === 0) {
        stopPolling();
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("[WebSocket] Client error:", error);
    });
  });
}
