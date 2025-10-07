import type { Song } from "@/types";
import type { LyricsProvider } from "@/types";

/**
 * Local lyrics provider with hardcoded demo lyrics in Enhanced LRC format
 */
export class LocalLyricsProvider implements LyricsProvider {
  private lyricsDatabase: Record<string, string> = {
    "bohemian-rhapsody-queen": `[00:00.00]<00:00.00>Is <00:00.50>this <00:01.00>the <00:01.50>real <00:02.00>life?
[00:03.50]<00:03.50>Is <00:04.00>this <00:04.50>just <00:05.00>fantasy?
[00:07.00]<00:07.00>Caught <00:07.50>in <00:08.00>a <00:08.50>landslide
[00:09.50]<00:09.50>No <00:10.00>escape <00:10.50>from <00:11.00>reality
[00:13.00]<00:13.00>Open <00:13.50>your <00:14.00>eyes
[00:15.50]<00:15.50>Look <00:16.00>up <00:16.50>to <00:17.00>the <00:17.50>skies <00:18.00>and <00:18.50>see
[00:20.00]<00:20.00>I'm <00:20.50>just <00:21.00>a <00:21.50>poor <00:22.00>boy
[00:22.50]<00:22.50>I <00:23.00>don't <00:23.50>need <00:24.00>no <00:24.50>sympathy
[00:25.00]<00:25.00>Because <00:25.50>I'm <00:26.00>easy <00:26.50>come, <00:27.00>easy <00:27.50>go
[00:28.50]<00:28.50>Little <00:29.00>high, <00:29.50>little <00:30.00>low
[00:32.00]<00:32.00>Any <00:32.50>way <00:33.00>the <00:33.50>wind <00:34.00>blows
[00:35.50]<00:35.50>Doesn't <00:36.00>really <00:36.50>matter <00:37.00>to <00:37.50>me
[00:40.00]<00:40.00>To <00:40.50>me
[00:45.00]<00:45.00>Mama, <00:45.50>just <00:46.00>killed <00:46.50>a <00:47.00>man
[00:48.50]<00:48.50>Put <00:49.00>a <00:49.50>gun <00:50.00>against <00:50.50>his <00:51.00>head
[00:52.00]<00:52.00>Pulled <00:52.50>my <00:53.00>trigger, <00:53.50>now <00:54.00>he's <00:54.50>dead
[00:55.50]<00:55.50>Mama, <00:56.00>life <00:56.50>had <00:57.00>just <00:57.50>begun
[00:59.00]<00:59.00>But <00:59.50>now <01:00.00>I've <01:00.50>gone <01:01.00>and <01:01.50>thrown <01:02.00>it <01:02.50>all <01:03.00>away`,

    "stairway-to-heaven-led-zeppelin": `[00:00.00]<00:00.00>There's <00:01.00>a <00:02.00>lady <00:03.00>who's <00:04.00>sure
[00:04.00]<00:04.00>All <00:05.00>that <00:06.00>glitters <00:07.00>is <00:08.00>gold
[00:08.00]<00:08.00>And <00:09.00>she's <00:10.00>buying <00:11.00>a <00:12.00>stairway <00:13.00>to <00:14.00>heaven
[00:16.00]<00:16.00>When <00:17.00>she <00:18.00>gets <00:19.00>there <00:20.00>she <00:20.50>knows
[00:20.00]<00:20.00>If <00:21.00>the <00:22.00>stores <00:23.00>are <00:24.00>all <00:24.50>closed
[00:24.00]<00:24.00>With <00:25.00>a <00:26.00>word <00:27.00>she <00:28.00>can <00:29.00>get <00:30.00>what <00:31.00>she <00:31.50>came <00:32.00>for
[00:32.00]<00:32.00>Ooh, <00:34.00>ooh, <00:36.00>and <00:37.00>she's <00:38.00>buying <00:39.00>a <00:40.00>stairway <00:41.00>to <00:42.00>heaven
[00:44.00]<00:44.00>There's <00:45.00>a <00:46.00>sign <00:47.00>on <00:48.00>the <00:48.50>wall
[00:48.00]<00:48.00>But <00:49.00>she <00:50.00>wants <00:51.00>to <00:52.00>be <00:52.50>sure
[00:52.00]<00:52.00>'Cause <00:53.00>you <00:54.00>know <00:55.00>sometimes <00:56.00>words <00:57.00>have <00:58.00>two <00:59.00>meanings
[01:00.00]<01:00.00>In <01:01.00>a <01:02.00>tree <01:03.00>by <01:04.00>the <01:04.50>brook
[01:04.00]<01:04.00>There's <01:05.00>a <01:06.00>songbird <01:07.00>who <01:08.00>sings
[01:08.00]<01:08.00>Sometimes <01:09.00>all <01:10.00>of <01:11.00>our <01:12.00>thoughts <01:13.00>are <01:14.00>misgiven`,

    "hotel-california-eagles": `[00:00.00]<00:00.00>Welcome <00:01.00>to <00:02.00>the <00:03.00>Hotel <00:04.00>California
[00:04.00]<00:04.00>Such <00:05.00>a <00:06.00>lovely <00:06.50>place
[00:06.50]<00:06.50>(Such <00:07.00>a <00:07.50>lovely <00:08.00>place)
[00:08.00]<00:08.00>Such <00:09.00>a <00:10.00>lovely <00:11.00>face
[00:12.00]<00:12.00>Plenty <00:13.00>of <00:14.00>room <00:15.00>at <00:16.00>the <00:16.50>Hotel <00:17.00>California
[00:16.00]<00:16.00>Any <00:17.00>time <00:18.00>of <00:18.50>year
[00:18.50]<00:18.50>(Any <00:19.00>time <00:19.50>of <00:20.00>year)
[00:20.00]<00:20.00>You <00:21.00>can <00:22.00>find <00:23.00>it <00:24.00>here
[00:24.00]<00:24.00>Her <00:25.00>mind <00:26.00>is <00:27.00>Tiffany-twisted
[00:28.00]<00:28.00>She <00:29.00>got <00:30.00>the <00:31.00>Mercedes <00:32.00>bends
[00:32.00]<00:32.00>She <00:33.00>got <00:34.00>a <00:35.00>lot <00:36.00>of <00:37.00>pretty, <00:38.00>pretty <00:39.00>boys <00:40.00>she <00:40.50>calls <00:41.00>friends
[00:40.00]<00:40.00>How <00:41.00>they <00:42.00>dance <00:43.00>in <00:44.00>the <00:44.50>courtyard
[00:44.00]<00:44.00>Sweet <00:45.00>summer <00:46.00>sweat
[00:48.00]<00:48.00>Some <00:49.00>dance <00:50.00>to <00:51.00>remember
[00:52.00]<00:52.00>Some <00:53.00>dance <00:54.00>to <00:55.00>forget`,

    "imagine-john-lennon": `[00:00.00]<00:00.00>Imagine <00:01.50>there's <00:03.00>no <00:04.50>heaven
[00:06.00]<00:06.00>It's <00:07.50>easy <00:09.00>if <00:10.50>you <00:12.00>try
[00:12.00]<00:12.00>No <00:13.50>hell <00:15.00>below <00:16.50>us
[00:18.00]<00:18.00>Above <00:19.50>us <00:21.00>only <00:22.50>sky
[00:24.00]<00:24.00>Imagine <00:25.50>all <00:27.00>the <00:28.00>people
[00:29.00]<00:29.00>Living <00:30.50>for <00:32.00>today
[00:36.00]<00:36.00>Imagine <00:37.50>there's <00:39.00>no <00:40.50>countries
[00:42.00]<00:42.00>It <00:43.50>isn't <00:45.00>hard <00:46.50>to <00:48.00>do
[00:48.00]<00:48.00>Nothing <00:49.50>to <00:51.00>kill <00:52.50>or <00:54.00>die <00:54.50>for
[00:54.00]<00:54.00>And <00:55.50>no <00:57.00>religion <00:58.50>too
[01:00.00]<01:00.00>Imagine <01:01.50>all <01:03.00>the <01:04.00>people
[01:05.00]<01:05.00>Living <01:06.50>life <01:08.00>in <01:09.50>peace
[01:12.00]<01:12.00>You <01:13.50>may <01:15.00>say <01:16.50>I'm <01:18.00>a <01:18.50>dreamer
[01:18.00]<01:18.00>But <01:19.50>I'm <01:21.00>not <01:22.50>the <01:24.00>only <01:24.50>one
[01:24.00]<01:24.00>I <01:25.50>hope <01:27.00>someday <01:28.50>you'll <01:30.00>join <01:30.50>us
[01:30.00]<01:30.00>And <01:31.50>the <01:33.00>world <01:34.50>will <01:36.00>be <01:37.50>as <01:39.00>one`,

    "sweet-child-o-mine-guns-n-roses": `[00:00.00]<00:00.00>She's <00:01.00>got <00:02.00>a <00:03.00>smile <00:04.00>that <00:04.50>it <00:05.00>seems <00:05.50>to <00:06.00>me
[00:04.00]<00:04.00>Reminds <00:05.00>me <00:06.00>of <00:07.00>childhood <00:08.00>memories
[00:08.00]<00:08.00>Where <00:09.00>everything <00:10.00>was <00:11.00>as <00:12.00>fresh <00:13.00>as <00:14.00>the <00:15.00>bright <00:16.00>blue <00:16.50>sky
[00:16.00]<00:16.00>Now <00:17.00>and <00:18.00>then <00:19.00>when <00:20.00>I <00:20.50>see <00:21.00>her <00:21.50>face
[00:20.00]<00:20.00>She <00:21.00>takes <00:22.00>me <00:23.00>away <00:24.00>to <00:24.50>that <00:25.00>special <00:26.00>place
[00:24.00]<00:24.00>And <00:25.00>if <00:26.00>I <00:27.00>stared <00:27.50>too <00:28.00>long
[00:27.00]<00:27.00>I'd <00:28.00>probably <00:29.00>break <00:30.00>down <00:31.00>and <00:32.00>cry
[00:32.00]<00:32.00>Sweet <00:33.00>child <00:34.00>o' <00:35.00>mine
[00:36.00]<00:36.00>Sweet <00:37.00>love <00:38.00>of <00:39.00>mine
[00:48.00]<00:48.00>She's <00:49.00>got <00:50.00>eyes <00:51.00>of <00:52.00>the <00:52.50>bluest <00:53.00>skies
[00:52.00]<00:52.00>As <00:53.00>if <00:54.00>they <00:55.00>thought <00:56.00>of <00:56.50>rain
[00:56.00]<00:56.00>I <00:57.00>hate <00:58.00>to <00:59.00>look <01:00.00>into <01:00.50>those <01:01.00>eyes
[01:00.00]<01:00.00>And <01:01.00>see <01:02.00>an <01:03.00>ounce <01:04.00>of <01:05.00>pain`,
  };

  private getSongKey(song: Song): string {
    // Create a normalized key for the song
    const name = song.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "";
    const artist = song.artist?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "";
    return `${name}-${artist}`;
  }

  async getLyrics(
    song: Song,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signal?: AbortSignal,
  ): Promise<string | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const key = this.getSongKey(song);
    return this.lyricsDatabase[key] || null;
  }

  getId(): string {
    return "local-lyrics";
  }

  getName(): string {
    return "Local Lyrics";
  }

  getDescription(): string {
    return "Hardcoded demo lyrics for classic songs in Enhanced LRC format";
  }

  async supportsLyrics(song: Song): Promise<boolean> {
    const key = this.getSongKey(song);
    return key in this.lyricsDatabase;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async isFetching(): Promise<boolean> {
    // Simulated provider doesn't maintain persistent fetching state
    return false;
  }

  async search(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signal?: AbortSignal,
  ): Promise<
    Array<{
      id: string;
      trackName: string;
      artistName: string;
      albumName: string;
      duration: number;
    }>
  > {
    // Local provider doesn't support search - return empty array
    return [];
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
