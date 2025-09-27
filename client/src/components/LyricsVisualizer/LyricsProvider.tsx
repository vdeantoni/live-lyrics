import {
  useLyrics,
  useSong,
  type LineData,
  type WordData,
  type LyricsData,
} from "@/lib/api";
import { useEffect, useState, useRef, useCallback } from "react";
import LyricsContent from "./LyricsContent";
import Liricle from "liricle";

const LyricsProvider = () => {
  const { data: song } = useSong();
  const { data: lrcContent } = useLyrics(song);

  const liricleRef = useRef<Liricle | null>(null);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [activeLine, setActiveLine] = useState<LineData | null>(null);
  const [activeWord, setActiveWord] = useState<WordData | null>(null);

  const handleLineClick = useCallback((line: LineData) => {
    console.log(`Clicked line: ${line.text} at time ${line.time}`);
  }, []);

  // Initialize liricle when LRC content is available
  useEffect(() => {
    if (!lrcContent) {
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
    liricle.load({ text: lrcContent });

    return () => {
      liricleRef.current = null;
      setLyricsData(null);
      setActiveLine(null);
      setActiveWord(null);
    };
  }, [lrcContent]);

  // Sync with current time
  useEffect(() => {
    if (!liricleRef.current || !song?.currentTime) return;

    liricleRef.current.sync(song.currentTime);
  }, [song?.currentTime]);

  if (!song) return null;

  return (
    <LyricsContent
      lyricsData={lyricsData}
      activeLine={activeLine}
      activeWord={activeWord}
      onLineClick={handleLineClick}
    />
  );
};

export default LyricsProvider;
