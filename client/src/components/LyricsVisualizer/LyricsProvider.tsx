import { type LineData, type WordData, type LyricsData } from "@/types";
import { useEffect, useState, useRef } from "react";
import LyricsContent from "./LyricsContent";
import NoLyricsFound from "./NoLyricsFound";
import Liricle from "liricle";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { useAtomValue, useSetAtom } from "jotai";
import {
  songInfoAtom,
  currentTimeAtom,
  rawLrcContentAtom,
  lyricsDataAtom,
  activeLineAtom,
  activeWordAtom,
} from "@/atoms/playerAtoms";

const LyricsProvider = () => {
  // Read data from atoms
  const songInfo = useAtomValue(songInfoAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const rawLrcContent = useAtomValue(rawLrcContentAtom);

  // Action atoms
  const setLyricsData = useSetAtom(lyricsDataAtom);
  const setActiveLine = useSetAtom(activeLineAtom);
  const setActiveWord = useSetAtom(activeWordAtom);

  const liricleRef = useRef<Liricle | null>(null);
  const [showNoLyrics, setShowNoLyrics] = useState(false);

  // Trigger lyrics fetching (syncs to rawLrcContentAtom)
  useLyricsSync();

  // Delay showing "No Lyrics Found" to prevent flash during source switches
  useEffect(() => {
    if (
      rawLrcContent !== null &&
      (!rawLrcContent || rawLrcContent.trim() === "")
    ) {
      const timer = setTimeout(() => setShowNoLyrics(true), 500); // 500ms delay
      return () => clearTimeout(timer);
    } else {
      setShowNoLyrics(false);
    }
  }, [rawLrcContent, setShowNoLyrics]);

  // Initialize liricle when LRC content is available
  useEffect(() => {
    // Reset active line when lyrics content changes
    setActiveLine(null);
    setActiveWord(null);

    if (!rawLrcContent) {
      setLyricsData(null);
      return;
    }

    const liricle = new Liricle();
    liricleRef.current = liricle;

    // Set up load event handler to get lyrics data
    liricle.on("load", (data: LyricsData) => {
      setLyricsData(data);
    });

    // Set up sync event handler
    liricle.on("sync", (line: LineData | null, word: WordData | null) => {
      setActiveLine(line);
      setActiveWord(word);
    });

    // Load the raw LRC content directly
    liricle.load({ text: rawLrcContent });

    return () => {
      liricleRef.current = null;
      setLyricsData(null);
      setActiveLine(null);
      setActiveWord(null);
    };
  }, [rawLrcContent, setLyricsData, setActiveLine, setActiveWord]);

  // Sync with current time
  useEffect(() => {
    if (!liricleRef.current || !currentTime) return;

    liricleRef.current.sync(currentTime);
  }, [currentTime]);

  if (!songInfo.name || !songInfo.artist) return null;

  // Show loading state while waiting for lyrics content to be fetched
  if (rawLrcContent === null) {
    return (
      <div className="flex h-full min-h-96 items-center justify-center">
        <div className="text-zinc-400">Loading lyrics...</div>
      </div>
    );
  }

  // Only show NoLyricsFound after delay and when we definitively have no lyrics
  if (showNoLyrics) {
    return <NoLyricsFound songName={songInfo.name} artist={songInfo.artist} />;
  }

  return <LyricsContent />;
};

export default LyricsProvider;
