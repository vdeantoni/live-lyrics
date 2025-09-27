import type { Song } from "@/lib/api";
import type { MusicSource, LyricsProvider, ArtworkProvider } from "@/types/musicSource";
import { SimulatedLyricsProvider } from "@/providers/simulatedLyricsProvider";

/**
 * Simulated music source with internal clock for testing and development
 * Singleton pattern to maintain state across source switches
 */
export class SimulatedMusicSource implements MusicSource {
  private static instance: SimulatedMusicSource | null = null;

  private currentTime: number = 0;
  private duration: number = 180; // 3 minutes default
  private isPlaying: boolean = false;
  private hasEverBeenPlayed: boolean = false; // Track if ever played
  private lastUpdateTime: number = Date.now();
  private intervalId: number | null = null;
  private lyricsProvider!: LyricsProvider; // Will be initialized in constructor

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
    if (SimulatedMusicSource.instance) {
      return SimulatedMusicSource.instance;
    }

    // Initialize new instance
    this.startClock();
    this.lyricsProvider = new SimulatedLyricsProvider();

    // Store the instance
    SimulatedMusicSource.instance = this;

    // Return this for proper singleton behavior
    return this;
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
    // Auto-play next song if we were playing
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

  getId(): string {
    return "simulated-player";
  }

  getName(): string {
    return "Simulated Player";
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  getLyricsProvider(): LyricsProvider | null {
    return this.lyricsProvider;
  }

  getArtworkProvider(): ArtworkProvider | null {
    // Simulated source doesn't provide artwork for now
    return null;
  }

  // Additional methods for simulated source

  /**
   * Manually advance to the next song in the playlist
   */
  async nextTrack(): Promise<void> {
    this.nextSong();
  }

  /**
   * Go to the previous song in the playlist
   */
  async previousTrack(): Promise<void> {
    this.currentSongIndex =
      this.currentSongIndex === 0
        ? this.playlist.length - 1
        : this.currentSongIndex - 1;
    this.currentTime = 0;
    this.duration = this.playlist[this.currentSongIndex].duration;
    // Keep playing state when changing tracks
  }

  /**
   * Get the current playlist
   */
  getPlaylist(): Song[] {
    return [...this.playlist];
  }

  /**
   * Add a song to the playlist
   */
  addToPlaylist(song: Song): void {
    this.playlist.push(song);
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): SimulatedMusicSource {
    if (!SimulatedMusicSource.instance) {
      SimulatedMusicSource.instance = new SimulatedMusicSource();
    }
    return SimulatedMusicSource.instance;
  }

  /**
   * Clean up the internal clock when done
   * Note: In practice, this should rarely be called since the clock should keep running
   */
  destroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Don't reset the instance - keep state persistent
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  static reset(): void {
    if (SimulatedMusicSource.instance) {
      SimulatedMusicSource.instance.destroy();
      SimulatedMusicSource.instance = null;
    }
  }
}
