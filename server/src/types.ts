// Shared types between client and server
export interface Song {
  name: string;
  artist: string;
  album: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export interface SongResponse extends Song {
  // Server can add additional fields if needed
}

export interface ErrorResponse {
  error: string;
}

export interface MessageResponse {
  message: string;
}

// JSON-RPC 2.0 types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// JSON-RPC error codes
export enum JsonRpcErrorCode {
  // Standard JSON-RPC 2.0 errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // Application-specific errors
  APPLESCRIPT_FAILED = -32000,
  PLAYER_UNAVAILABLE = -32001,
  SEEK_FAILED = -32002,
}

// WebSocket message types for player control
export type PlayerMethod =
  | "player.play"
  | "player.pause"
  | "player.seek"
  | "player.next"
  | "player.previous";

export type ServerMethod = "server.ping" | "song.update" | "server.error";

// Parameter types for specific methods
export interface PlayerSeekParams {
  time: number;
}

export interface SongUpdateParams extends Song {}

export interface ServerPingParams {
  timestamp: number;
}

export interface ServerErrorParams {
  message: string;
}
