import { execFile } from "child_process";
import type { Song } from "../types";

/**
 * Get the queue (upcoming tracks) from the current Apple Music playlist
 * Returns tracks after the current track in the playlist
 */
export function getQueueFromPlaylist(): Promise<Song[]> {
  return new Promise((resolve) => {
    const scriptLines = [
      'tell application "Music"',
      "    set currentPl to current playlist",
      "    set currentTr to current track",
      "    set allTracks to tracks of currentPl",
      "    ",
      "    -- Find current track index",
      "    set currentIndex to 0",
      "    set trackCount to count of allTracks",
      "    repeat with i from 1 to trackCount",
      "        if id of (item i of allTracks) = id of currentTr then",
      "            set currentIndex to i",
      "            exit repeat",
      "        end if",
      "    end repeat",
      "    ",
      "    -- Build queue from remaining tracks",
      "    set queueData to {}",
      "    if currentIndex > 0 and currentIndex < trackCount then",
      "        repeat with i from (currentIndex + 1) to trackCount",
      "            set t to item i of allTracks",
      '            set trackInfo to name of t & "\n" & artist of t & "\n" & album of t & "\n" & duration of t',
      '            set end of queueData to trackInfo & "\n---"',
      "        end repeat",
      "    end if",
      "    ",
      "    -- Return queue data",
      "    if (count of queueData) > 0 then",
      '        return (queueData as text) & "\n"',
      "    else",
      '        return "EMPTY"',
      "    end if",
      "end tell",
    ];

    const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("[Queue] Error fetching queue:", error || stderr);
        resolve([]);
        return;
      }

      const output = stdout.trim();

      if (output === "EMPTY" || output === "") {
        resolve([]);
        return;
      }

      // Parse queue data
      const queue: Song[] = [];
      const tracks = output.split("---\n").filter((t) => t.trim());

      for (const track of tracks) {
        const lines = track.trim().split("\n");
        if (lines.length >= 4) {
          const [name, artist, album, durationStr] = lines;
          const duration = parseFloat(durationStr) || 0;

          queue.push({
            name: name || "",
            artist: artist || "",
            album: album || "",
            duration,
            currentTime: 0,
            isPlaying: false,
          });
        }
      }

      resolve(queue);
    });
  });
}

/**
 * Get the current playlist ID for change detection
 * Returns null if no playlist is playing
 */
export function getCurrentPlaylistId(): Promise<string | null> {
  return new Promise((resolve) => {
    const scriptLines = [
      'tell application "Music"',
      "    try",
      "        set currentPl to current playlist",
      "        return id of currentPl as text",
      "    on error",
      '        return "NONE"',
      "    end try",
      "end tell",
    ];

    const osascriptArgs = scriptLines.flatMap((line) => ["-e", line]);

    execFile("osascript", osascriptArgs, (error, stdout, stderr) => {
      if (error || stderr) {
        resolve(null);
        return;
      }

      const output = stdout.trim();
      if (output === "NONE" || output === "") {
        resolve(null);
      } else {
        resolve(output);
      }
    });
  });
}
