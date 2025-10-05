import type { Song, PlayerSettings } from "@/types";
import type { Player } from "@/types";
import { JsonRpcWebSocketClient } from "./jsonRpcWebSocket";

/**
 * Remote player - communicates with server via WebSocket + JSON-RPC 2.0
 * Replaces the old HTTP polling approach with real-time updates
 */
export class RemotePlayer implements Player {
  private wsUrl: string;
  private rpcClient: JsonRpcWebSocketClient | null = null;
  private currentSong: Song = {
    name: "",
    artist: "",
    album: "",
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  };
  private songUpdateListeners: Array<(song: Song) => void> = [];
  private connectionStateListeners: Array<(connected: boolean) => void> = [];
  private isInitialized = false;

  constructor(wsUrl: string = "ws://127.0.0.1:4000/ws") {
    this.wsUrl = wsUrl;
  }

  /**
   * Initialize WebSocket connection
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.rpcClient = new JsonRpcWebSocketClient(this.wsUrl);

    // Register notification handler for song updates
    this.rpcClient.onNotification((method, params) => {
      if (method === "song.update") {
        this.currentSong = params as Song;
        this.notifySongUpdateListeners(params as Song);
      }
    });

    // Register connection state handler
    this.rpcClient.setConnectionChangeCallback((connected) => {
      this.notifyConnectionStateListeners(connected);
    });

    // Connect to server
    try {
      await this.rpcClient.connect();
      this.isInitialized = true;
    } catch (error) {
      console.error("[RemotePlayer] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Ensure client is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  getId(): string {
    return "remote";
  }

  getName(): string {
    return "Remote";
  }

  getDescription(): string {
    return "Remote player";
  }

  async getSong(): Promise<Song> {
    await this.ensureInitialized();
    return this.currentSong;
  }

  async play(): Promise<void> {
    await this.ensureInitialized();
    this.rpcClient?.notify("player.play");
  }

  async pause(): Promise<void> {
    await this.ensureInitialized();
    this.rpcClient?.notify("player.pause");
  }

  async seek(time: number): Promise<void> {
    await this.ensureInitialized();
    this.rpcClient?.notify("player.seek", { time });
  }

  async next(): Promise<void> {
    await this.ensureInitialized();
    this.rpcClient?.notify("player.next");
  }

  async previous(): Promise<void> {
    await this.ensureInitialized();
    this.rpcClient?.notify("player.previous");
  }

  async playSong(): Promise<void> {
    console.warn(
      "[RemotePlayer] playSong() not supported - Remote player can only control currently playing track",
    );
    throw new Error(
      "Remote player does not support direct song selection. Please use local player for playlist functionality.",
    );
  }

  async add(): Promise<void> {
    throw new Error("Remote player does not support queue management");
  }

  async getQueue(): Promise<Song[]> {
    throw new Error("Remote player does not support queue management");
  }

  async getHistory(): Promise<Song[]> {
    throw new Error("Remote player does not support history tracking");
  }

  async clear(): Promise<void> {
    throw new Error("Remote player does not support queue management");
  }

  async getSettings(): Promise<PlayerSettings> {
    throw new Error("Remote player does not support settings");
  }

  async setSettings(): Promise<void> {
    throw new Error("Remote player does not support settings");
  }

  async setQueue(): Promise<void> {
    throw new Error("Remote player does not support queue management");
  }

  async clearHistory(): Promise<void> {
    throw new Error("Remote player does not support history tracking");
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple check: try to connect to WebSocket
      return new Promise((resolve) => {
        const ws = new WebSocket(this.wsUrl);

        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 3000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to song updates from WebSocket
   */
  onSongUpdate(listener: (song: Song) => void): () => void {
    this.songUpdateListeners.push(listener);

    // Initialize connection if not already done
    if (!this.isInitialized && !this.rpcClient) {
      this.ensureInitialized().catch((error) => {
        console.error(
          "[RemotePlayer] Failed to initialize during onSongUpdate:",
          error,
        );
      });
    }

    // Return unsubscribe function
    return () => {
      const index = this.songUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.songUpdateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(listener: (connected: boolean) => void): () => void {
    this.connectionStateListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.connectionStateListeners.indexOf(listener);
      if (index > -1) {
        this.connectionStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all song update listeners
   */
  private notifySongUpdateListeners(song: Song): void {
    this.songUpdateListeners.forEach((listener) => {
      try {
        listener(song);
      } catch (error) {
        console.error("[RemotePlayer] Error in song update listener:", error);
      }
    });
  }

  /**
   * Notify all connection state listeners
   */
  private notifyConnectionStateListeners(connected: boolean): void {
    this.connectionStateListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        console.error(
          "[RemotePlayer] Error in connection state listener:",
          error,
        );
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.rpcClient) {
      this.rpcClient.disconnect();
      this.rpcClient = null;
      this.isInitialized = false;
    }
  }
}
