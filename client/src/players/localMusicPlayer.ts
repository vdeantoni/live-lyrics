import type { Song } from "@/types";
import type { Player } from "@/types";

/**
 * Local music player
 * Singleton pattern to maintain state across player switches
 */
export class LocalMusicPlayer implements Player {
  private static instance: LocalMusicPlayer | null = null;

  private currentTime: number = 0;
  private duration: number = 180; // 3 minutes default
  private isPlaying: boolean = false;
  private hasEverBeenPlayed: boolean = false; // Track if ever played
  private lastUpdateTime: number = Date.now();
  private intervalId: number | null = null;

  // Demo playlist of songs
  private playlist: Song[] = [
    {
      name: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      duration: 355, // 5:55
      currentTime: 0,
      isPlaying: false,
    },
    {
      name: "Stairway to Heaven",
      artist: "Led Zeppelin",
      album: "Led Zeppelin IV",
      duration: 482, // 8:02
      currentTime: 0,
      isPlaying: false,
    },
    {
      name: "Hotel California",
      artist: "Eagles",
      album: "Hotel California",
      duration: 391, // 6:31
      currentTime: 0,
      isPlaying: false,
    },
    {
      name: "Imagine",
      artist: "John Lennon",
      album: "Imagine",
      duration: 183, // 3:03
      currentTime: 0,
      isPlaying: false,
    },
    {
      name: "Sweet Child O Mine",
      artist: "Guns N Roses",
      album: "Appetite for Destruction",
      duration: 356, // 5:56
      currentTime: 0,
      isPlaying: false,
    },
  ];

  private currentSongIndex: number = 0;

  constructor() {
    // Return existing instance if it exists (singleton pattern)
    if (LocalMusicPlayer.instance) {
      return LocalMusicPlayer.instance;
    }

    // Initialize new instance
    this.startClock();

    // Store the instance
    LocalMusicPlayer.instance = this;

    // Return this for proper singleton behavior
    return this;
  }

  static getInstance(): LocalMusicPlayer {
    if (!LocalMusicPlayer.instance) {
      LocalMusicPlayer.instance = new LocalMusicPlayer();
    }
    return LocalMusicPlayer.instance;
  }

  getId(): string {
    return "local";
  }

  getName(): string {
    return "Local";
  }

  getDescription(): string {
    return "Local player";
  }

  private startClock(): void {
    // Update the internal clock every 100ms for smooth progress
    this.intervalId = window.setInterval(() => {
      // Clock always ticks if it has ever been played, regardless of playing state
      if (this.hasEverBeenPlayed) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds

        // Only advance time if playing
        if (this.isPlaying) {
          this.currentTime = Math.min(
            this.currentTime + deltaTime,
            this.duration,
          );

          // Auto-advance to next song when current song ends
          if (this.currentTime >= this.duration) {
            this.nextSong();
          }
        }
      }
      this.lastUpdateTime = Date.now();
    }, 100);
  }

  private nextSong(): void {
    this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
    this.currentTime = 0;
    this.duration = this.playlist[this.currentSongIndex].duration;
    // Keep playing state when advancing - songs loop forever
  }

  private getCurrentSong(): Song {
    const song = this.playlist[this.currentSongIndex];
    return {
      ...song,
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
    };
  }

  async getSong(): Promise<Song> {
    return this.getCurrentSong();
  }

  async play(): Promise<void> {
    this.isPlaying = true;
    this.hasEverBeenPlayed = true; // Mark as ever played
    this.lastUpdateTime = Date.now();
  }

  async pause(): Promise<void> {
    this.isPlaying = false;
  }

  async seek(time: number): Promise<void> {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.lastUpdateTime = Date.now();
  }

  async isAvailable(): Promise<boolean> {
    // Local player is always available
    return true;
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
