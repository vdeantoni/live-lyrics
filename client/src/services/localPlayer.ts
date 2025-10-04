import type { Song } from "@/types";
import type { Player } from "@/types";

/**
 * Local player
 * Singleton pattern to maintain state across player switches
 */
export class LocalPlayer implements Player {
  private static instance: LocalPlayer | null = null;

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
  private queue: Song[] = []; // Queue for playQueue functionality

  constructor() {
    // Return existing instance if it exists (singleton pattern)
    if (LocalPlayer.instance) {
      return LocalPlayer.instance;
    }

    // Initialize new instance
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
          this.lastUpdateTime = Date.now();
        }
      }
    }, 100);
  }

  private nextSong(): void {
    // Check if there's a queue to play from
    if (this.queue.length > 0) {
      // Find current song index in queue
      const currentQueueIndex = this.queue.findIndex(
        (s) =>
          s.name === this.playlist[this.currentSongIndex].name &&
          s.artist === this.playlist[this.currentSongIndex].artist,
      );

      if (
        currentQueueIndex !== -1 &&
        currentQueueIndex < this.queue.length - 1
      ) {
        // Play next song in queue
        const nextQueueSong = this.queue[currentQueueIndex + 1];
        const nextIndex = this.playlist.findIndex(
          (s) =>
            s.name === nextQueueSong.name && s.artist === nextQueueSong.artist,
        );
        if (nextIndex !== -1) {
          this.currentSongIndex = nextIndex;
          this.currentTime = 0;
          this.duration = this.playlist[this.currentSongIndex].duration;
          return;
        }
      } else {
        // End of queue, clear it
        this.queue = [];
      }
    }

    // Default behavior: loop through playlist
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

  async next(): Promise<void> {
    this.nextSong();
    // Reset playback position and keep playing state
    this.lastUpdateTime = Date.now();
  }

  async previous(): Promise<void> {
    // If more than 3 seconds into the song, restart current song
    if (this.currentTime > 3) {
      this.currentTime = 0;
      this.lastUpdateTime = Date.now();
      return;
    }

    // Otherwise, go to previous song
    this.currentSongIndex =
      (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
    this.currentTime = 0;
    this.duration = this.playlist[this.currentSongIndex].duration;
    this.lastUpdateTime = Date.now();
  }

  async playSong(song: {
    name: string;
    artist: string;
    album: string;
    duration?: number;
  }): Promise<void> {
    // Find the song in the playlist
    const songIndex = this.playlist.findIndex(
      (s) => s.name === song.name && s.artist === song.artist,
    );

    if (songIndex !== -1) {
      // Song exists in playlist, switch to it
      // Clear queue so next song comes from playlist position
      this.currentSongIndex = songIndex;
      this.currentTime = 0;
      this.duration = this.playlist[songIndex].duration;
      this.queue = []; // Ensure next song is from playlist, not queue
    } else {
      // Song doesn't exist in playlist, add it temporarily and play
      const newSong: Song = {
        name: song.name,
        artist: song.artist,
        album: song.album,
        duration: song.duration || 180,
        currentTime: 0,
        isPlaying: false,
      };
      this.playlist.push(newSong);
      this.currentSongIndex = this.playlist.length - 1;
      this.currentTime = 0;
      this.duration = newSong.duration;

      // Clear queue when playing a song not in current context
      this.queue = [];
    }

    // Start playing
    this.isPlaying = true;
    this.hasEverBeenPlayed = true;
    this.lastUpdateTime = Date.now();
  }

  async playQueue(songs: Song[]): Promise<void> {
    if (songs.length === 0) return;

    // Set queue
    this.queue = [...songs];

    // Play first song in queue
    const firstSong = songs[0];
    await this.playSong(firstSong);
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
