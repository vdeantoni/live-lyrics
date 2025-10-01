import type { Song } from "@/types";
import type { Player } from "@/types";

/**
 * Remote player - communicates with Apple Music via local server
 */
export class RemotePlayer implements Player {
  private baseUrl: string;

  constructor(baseUrl: string = "http://127.0.0.1:4000") {
    this.baseUrl = baseUrl;
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
    const response = await fetch(`${this.baseUrl}/music`);

    if (!response.ok) {
      throw new Error(`Failed to fetch song: ${response.status}`);
    }

    const json = await response.json();

    return {
      name: json.name || "Unknown Track",
      artist: json.artist || "Unknown Artist",
      album: json.album || "Unknown Album",
      duration: json.duration || 0,
      currentTime: parseFloat(json.currentTime || 0),
      isPlaying: json.isPlaying || false,
    };
  }

  async play(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/music`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    });

    if (!response.ok) {
      console.error("[RemotePlayer] Failed to play:", response.status);
      throw new Error(`Failed to play: ${response.status}`);
    }
  }

  async pause(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/music`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" }),
    });

    if (!response.ok) {
      console.error("[RemotePlayer] Failed to pause:", response.status);
      throw new Error(`Failed to pause: ${response.status}`);
    }
  }

  async seek(time: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/music`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seek", time }),
    });

    if (!response.ok) {
      throw new Error(`Failed to seek: ${response.status}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/music`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
