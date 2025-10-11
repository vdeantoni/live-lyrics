import type { Song, PlayerSettings } from "@/types";
import type { Player } from "@/types";
import { settingsService } from "@/core/services/SettingsService";

/**
 * Local player with queue-based architecture
 * Singleton pattern to maintain state across player switches
 *
 * Playback flow: queue → current → history
 * - Queue: Songs waiting to be played (FIFO)
 * - Current: Currently playing song
 * - History: Previously played songs (LIFO for previous())
 */
export class LocalPlayer implements Player {
  private static instance: LocalPlayer | null = null;

  // Playback state
  private currentTime: number = 0;
  private duration: number = 0;
  private isPlaying: boolean = false;
  private lastUpdateTime: number = Date.now();
  private intervalId: number | null = null;

  // Queue system
  private currentSong: Song | null = null;
  private queue: Song[] = [];
  private history: Song[] = [];

  // Settings
  private settings!: PlayerSettings;

  // Subscription listeners for reactive updates
  private songUpdateListeners: Array<(song: Song) => void> = [];

  constructor() {
    // Return existing instance if it exists (singleton pattern)
    if (LocalPlayer.instance) {
      return LocalPlayer.instance;
    }

    // Initialize new instance
    this.settings = settingsService.getPlayerSettings("local");
    this.startClock();

    // Store the instance
    LocalPlayer.instance = this;

    // Return this for proper singleton behavior
    return this;
  }

  static getInstance(): LocalPlayer {
    if (!LocalPlayer.instance) {
      LocalPlayer.instance = new LocalPlayer();
    }
    return LocalPlayer.instance;
  }

  getId(): string {
    return "local";
  }

  getName(): string {
    return "Local";
  }

  getDescription(): string {
    return "Local player with queue management";
  }

  private startClock(): void {
    // Update the internal clock every 100ms for smooth progress
    this.intervalId = window.setInterval(() => {
      // Clock ticks when there's a current song
      if (this.currentSong && this.isPlaying) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds

        this.currentTime = Math.min(
          this.currentTime + deltaTime,
          this.duration,
        );

        // Auto-advance when current song ends
        if (this.currentTime >= this.duration) {
          this.autoAdvance();
        }
        this.lastUpdateTime = Date.now();

        // Emit update to listeners (reactive!)
        this.notifySongUpdateListeners();
      }
    }, 100);
  }

  private autoAdvance(): void {
    // When song ends naturally, advance to next
    if (this.queue.length > 0) {
      // Queue has songs: shift to current
      this.shiftQueueToCurrentSong();
    } else {
      // No queue: play current to end, then clear and stop
      if (this.currentSong) {
        this.history.push(this.currentSong);
      }
      this.currentSong = null;
      this.currentTime = 0;
      this.duration = 0;
      this.isPlaying = false;
    }
  }

  private shiftQueueToCurrentSong(): void {
    // Move current to history
    if (this.currentSong) {
      this.history.push(this.currentSong);
    }

    // Shift first song from queue to current
    const nextSong = this.queue.shift();
    if (nextSong) {
      this.currentSong = nextSong;
      this.currentTime = 0;
      this.duration = nextSong.duration;
      this.lastUpdateTime = Date.now();
    }
  }

  async getSong(): Promise<Song> {
    // Handle null current song
    if (!this.currentSong) {
      // Return a default empty song
      return {
        name: "",
        artist: "",
        album: "",
        duration: 0,
        currentTime: 0,
        isPlaying: false,
      };
    }

    return {
      ...this.currentSong,
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
    };
  }

  async play(): Promise<void> {
    // No-op if no current song
    if (!this.currentSong) {
      return;
    }

    this.isPlaying = true;
    this.lastUpdateTime = Date.now();
    this.notifySongUpdateListeners();
  }

  async pause(): Promise<void> {
    this.isPlaying = false;
    this.notifySongUpdateListeners();
  }

  async seek(time: number): Promise<void> {
    // No-op if no current song
    if (!this.currentSong) {
      return;
    }

    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.lastUpdateTime = Date.now();
    this.notifySongUpdateListeners();
  }

  async next(): Promise<void> {
    // Handle null current song
    if (!this.currentSong) {
      // If queue has songs, shift first to current
      if (this.queue.length > 0) {
        this.shiftQueueToCurrentSong();
      }
      this.notifySongUpdateListeners();
      return;
    }

    // If queue has songs, shift to current
    if (this.queue.length > 0) {
      this.shiftQueueToCurrentSong();
    } else {
      // No queue: play current to end, clear, stop
      this.history.push(this.currentSong);
      this.currentSong = null;
      this.currentTime = 0;
      this.duration = 0;
      this.isPlaying = false;
    }
    this.lastUpdateTime = Date.now();
    this.notifySongUpdateListeners();
  }

  async previous(): Promise<void> {
    // If more than 3 seconds into current song, restart it
    if (this.currentTime > 3) {
      this.currentTime = 0;
      this.lastUpdateTime = Date.now();
      this.notifySongUpdateListeners();
      return;
    }

    // Otherwise, pop from history
    if (this.history.length > 0) {
      // Push current back to front of queue
      if (this.currentSong) {
        this.queue.unshift(this.currentSong);
      }

      // Pop last from history to current
      const previousSong = this.history.pop();
      if (previousSong) {
        this.currentSong = previousSong;
        this.currentTime = 0;
        this.duration = previousSong.duration;
      }
    } else {
      // No history: restart current song (if exists)
      if (this.currentSong) {
        this.currentTime = 0;
      }
    }
    this.lastUpdateTime = Date.now();
    this.notifySongUpdateListeners();
  }

  async add(...songs: Song[]): Promise<void> {
    if (songs.length === 0) return;

    // Insert songs at beginning of queue (after current)
    this.queue.unshift(...songs);

    // If no current song, shift first to current
    if (!this.currentSong && this.queue.length > 0) {
      this.shiftQueueToCurrentSong();
      this.notifySongUpdateListeners(); // Notify after shifting to current
    }

    // Auto-play if playOnAdd is enabled and we have a current song
    if (this.settings.playOnAdd && this.currentSong) {
      await this.play(); // play() already notifies
    }
  }

  async getQueue(): Promise<Song[]> {
    return [...this.queue];
  }

  async getHistory(): Promise<Song[]> {
    return [...this.history];
  }

  async clear(): Promise<void> {
    this.queue = [];
    this.currentSong = null;
    this.currentTime = 0;
    this.duration = 0;
    this.isPlaying = false;
    this.notifySongUpdateListeners();
    // Don't clear history - preserve for previous()
  }

  async getSettings(): Promise<PlayerSettings> {
    return settingsService.getPlayerSettings(this.getId());
  }

  async setSettings(settings: Partial<PlayerSettings>): Promise<void> {
    settingsService.setPlayerSettings(this.getId(), settings);
    this.settings = settingsService.getPlayerSettings(this.getId());
  }

  async setQueue(songs: Song[]): Promise<void> {
    // Replace the entire queue
    this.queue = [...songs];
  }

  async clearHistory(): Promise<void> {
    // Clear playback history
    this.history = [];
  }

  async isAvailable(): Promise<boolean> {
    // Local player is always available
    return true;
  }

  /**
   * Subscribe to song updates (reactive pattern like RemotePlayer)
   * Returns unsubscribe function
   */
  onSongUpdate(listener: (song: Song) => void): () => void {
    this.songUpdateListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.songUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.songUpdateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all song update listeners with current state
   */
  private notifySongUpdateListeners(): void {
    const song: Song = {
      name: this.currentSong?.name || "",
      artist: this.currentSong?.artist || "",
      album: this.currentSong?.album || "",
      currentTime: this.currentTime,
      duration: this.duration,
      isPlaying: this.isPlaying,
    };

    // Notify all listeners
    this.songUpdateListeners.forEach((listener) => {
      try {
        listener(song);
      } catch (error) {
        console.error("[LocalPlayer] Error in song update listener:", error);
      }
    });
  }

  /**
   * Cleanup method to stop the internal clock
   */
  cleanup(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
