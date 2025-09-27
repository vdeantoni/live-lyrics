import {
  type LineData,
  type WordData,
  type LyricsData,
} from "@/lib/api";
import { useEffect, useState, useRef, useCallback } from "react";
import LyricsContent from "./LyricsContent";
import NoLyricsFound from "./NoLyricsFound";
import Liricle from "liricle";
import { useLyricsFromSource } from "@/hooks/useSongSync";
import { useAtomValue } from "jotai";
import { songNameAtom, artistAtom, albumAtom, durationAtom, currentTimeAtom } from "@/atoms/playerAtoms";

const LyricsProvider = () => {
  // Read song data from atoms (populated by useSongSync in parent)
  const songName = useAtomValue(songNameAtom);
  const artist = useAtomValue(artistAtom);
  const album = useAtomValue(albumAtom);
  const duration = useAtomValue(durationAtom);
  const currentTime = useAtomValue(currentTimeAtom);

  // Construct song object for lyrics provider
  const song = songName && artist ? {
    name: songName,
    artist,
    album: album || '',
    duration,
    currentTime,
    isPlaying: false // Not needed for lyrics fetching
  } : undefined;

  const { data: lrcContent, isLoading, isFetching, isSuccess } = useLyricsFromSource(song);

  const liricleRef = useRef<Liricle | null>(null);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [activeLine, setActiveLine] = useState<LineData | null>(null);
  const [activeWord, setActiveWord] = useState<WordData | null>(null);
  const [showNoLyrics, setShowNoLyrics] = useState(false);

  const handleLineClick = useCallback((line: LineData) => {
    console.log(`Clicked line: ${line.text} at time ${line.time}`);
  }, []);

  // Delay showing "No Lyrics Found" to prevent flash during source switches
  useEffect(() => {
    if (isSuccess && (!lrcContent || lrcContent.trim() === '')) {
      const timer = setTimeout(() => setShowNoLyrics(true), 500); // 500ms delay
      return () => clearTimeout(timer);
    } else {
      setShowNoLyrics(false);
    }
  }, [isSuccess, lrcContent]);

  // Initialize liricle when LRC content is available
  useEffect(() => {
    // Reset active line when lyrics content changes
    setActiveLine(null);
    setActiveWord(null);

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
    if (!liricleRef.current || !currentTime) return;

    liricleRef.current.sync(currentTime);
  }, [currentTime]);

  if (!song) return null;

  // Show loading state while fetching lyrics or if query hasn't completed successfully yet
  if (isLoading || isFetching || !isSuccess) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-zinc-400">Loading lyrics...</div>
      </div>
    );
  }

  // Only show NoLyricsFound after delay and when we definitively have no lyrics
  if (showNoLyrics) {
    return <NoLyricsFound songName={songName} artist={artist} />;
  }

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
