import type { Song } from "@/lib/api";
import type { LyricsProvider } from "@/types/musicSource";

/**
 * Simulated lyrics provider with hardcoded demo lyrics
 */
export class SimulatedLyricsProvider implements LyricsProvider {
  private lyricsDatabase: Record<string, string> = {
    "bohemian-rhapsody-queen": `[00:00.00] Is this the real life?
[00:03.50] Is this just fantasy?
[00:07.00] Caught in a landslide
[00:09.50] No escape from reality
[00:13.00] Open your eyes
[00:15.50] Look up to the skies and see
[00:20.00] I'm just a poor boy
[00:22.50] I don't need no sympathy
[00:25.00] Because I'm easy come, easy go
[00:28.50] Little high, little low
[00:32.00] Any way the wind blows
[00:35.50] Doesn't really matter to me
[00:40.00] To me
[00:45.00] Mama, just killed a man
[00:48.50] Put a gun against his head
[00:52.00] Pulled my trigger, now he's dead
[00:55.50] Mama, life had just begun
[00:59.00] But now I've gone and thrown it all away`,

    "stairway-to-heaven-led-zeppelin": `[00:00.00] There's a lady who's sure
[00:04.00] All that glitters is gold
[00:08.00] And she's buying a stairway to heaven
[00:16.00] When she gets there she knows
[00:20.00] If the stores are all closed
[00:24.00] With a word she can get what she came for
[00:32.00] Ooh, ooh, and she's buying a stairway to heaven
[00:44.00] There's a sign on the wall
[00:48.00] But she wants to be sure
[00:52.00] 'Cause you know sometimes words have two meanings
[01:00.00] In a tree by the brook
[01:04.00] There's a songbird who sings
[01:08.00] Sometimes all of our thoughts are misgiven`,

    "hotel-california-eagles": `[00:00.00] Welcome to the Hotel California
[00:04.00] Such a lovely place
[00:06.50] (Such a lovely place)
[00:08.00] Such a lovely face
[00:12.00] Plenty of room at the Hotel California
[00:16.00] Any time of year
[00:18.50] (Any time of year)
[00:20.00] You can find it here
[00:24.00] Her mind is Tiffany-twisted
[00:28.00] She got the Mercedes bends
[00:32.00] She got a lot of pretty, pretty boys she calls friends
[00:40.00] How they dance in the courtyard
[00:44.00] Sweet summer sweat
[00:48.00] Some dance to remember
[00:52.00] Some dance to forget`,

    "imagine-john-lennon": `[00:00.00] Imagine there's no heaven
[00:06.00] It's easy if you try
[00:12.00] No hell below us
[00:18.00] Above us only sky
[00:24.00] Imagine all the people
[00:29.00] Living for today
[00:36.00] Imagine there's no countries
[00:42.00] It isn't hard to do
[00:48.00] Nothing to kill or die for
[00:54.00] And no religion too
[01:00.00] Imagine all the people
[01:05.00] Living life in peace
[01:12.00] You may say I'm a dreamer
[01:18.00] But I'm not the only one
[01:24.00] I hope someday you'll join us
[01:30.00] And the world will be as one`,

    "sweet-child-o-mine-guns-n-roses": `[00:00.00] She's got a smile that it seems to me
[00:04.00] Reminds me of childhood memories
[00:08.00] Where everything was as fresh as the bright blue sky
[00:16.00] Now and then when I see her face
[00:20.00] She takes me away to that special place
[00:24.00] And if I stared too long
[00:27.00] I'd probably break down and cry
[00:32.00] Sweet child o' mine
[00:36.00] Sweet love of mine
[00:48.00] She's got eyes of the bluest skies
[00:52.00] As if they thought of rain
[00:56.00] I hate to look into those eyes
[01:00.00] And see an ounce of pain`,
  };

  private getSongKey(song: Song): string {
    // Create a normalized key for the song
    const name = song.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "";
    const artist = song.artist?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "";
    return `${name}-${artist}`;
  }

  async getLyrics(song: Song): Promise<string | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const key = this.getSongKey(song);
    return this.lyricsDatabase[key] || null;
  }

  getId(): string {
    return "simulated-lyrics";
  }

  getName(): string {
    return "Simulated Lyrics";
  }

  async supportsLyrics(song: Song): Promise<boolean> {
    const key = this.getSongKey(song);
    return key in this.lyricsDatabase;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  /**
   * Add lyrics to the simulated database
   */
  addLyrics(song: Song, lyrics: string): void {
    const key = this.getSongKey(song);
    this.lyricsDatabase[key] = lyrics;
  }

  /**
   * Get all available songs with lyrics
   */
  getAvailableSongs(): string[] {
    return Object.keys(this.lyricsDatabase);
  }
}
