import { type LineData, type WordData, type LyricsData } from "@/types";
import { useEffect, useState, useRef } from "react";
import LyricsContent from "./LyricsContent";
import NoLyricsFound from "./NoLyricsFound";
import Liricle from "liricle";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { useAtomValue, useSetAtom } from "jotai";
import {
  playerStateAtom,
  lyricsContentAtom,
  lyricsDataAtom,
  activeLineAtom,
  activeWordAtom,
  lyricsLoadingAtom,
} from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/appState";

const LyricsProvider = () => {
  // Read data from atoms
  const playerState = useAtomValue(playerStateAtom);
  const { currentTime = 0, name, artist } = playerState || {};
  const lyricsContent = useAtomValue(lyricsContentAtom);
  const lyricsLoading = useAtomValue(lyricsLoadingAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);

  // Action atoms
  const setLyricsData = useSetAtom(lyricsDataAtom);
  const setActiveLine = useSetAtom(activeLineAtom);
  const setActiveWord = useSetAtom(activeWordAtom);

  const liricleRef = useRef<Liricle | null>(null);
  const [showNoLyrics, setShowNoLyrics] = useState(false);

  // Trigger lyrics fetching and get current provider info
  const { currentProvider } = useLyricsSync();

  // Get current provider name for UI display
  const currentProviderName = currentProvider
    ? enabledLyricsProviders.find((p) => p.config.id === currentProvider)
        ?.config.name || currentProvider
    : null;

  // Delay showing "No Lyrics Found" to prevent flash during source switches
  useEffect(() => {
    if (!lyricsLoading && (!lyricsContent || lyricsContent.trim() === "")) {
      const timer = setTimeout(() => setShowNoLyrics(true), 500); // 500ms delay
      return () => clearTimeout(timer);
    } else {
      setShowNoLyrics(false);
    }
  }, [lyricsLoading, lyricsContent, setShowNoLyrics]);

  // Initialize liricle when LRC content is available
  useEffect(() => {
    // Reset active line when lyrics content changes
    setActiveLine(null);
    setActiveWord(null);

    if (!lyricsContent) {
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
    liricle.load({ text: lyricsContent });

    return () => {
      liricleRef.current = null;
      setLyricsData(null);
      setActiveLine(null);
      setActiveWord(null);
    };
  }, [lyricsContent, setLyricsData, setActiveLine, setActiveWord]);

  // Sync with current time
  useEffect(() => {
    if (!liricleRef.current || !currentTime) return;

    liricleRef.current.sync(currentTime);
  }, [currentTime]);

  if (!name || !artist) return null;

  // Show loading state with current provider info
  if (lyricsLoading) {
    return (
      <div
        className="flex h-full min-h-96 items-center justify-center"
        data-testid="lyrics-loading"
      >
        <div className="text-zinc-400">
          {currentProviderName
            ? `Loading from ${currentProviderName}...`
            : "Loading lyrics..."}
        </div>
      </div>
    );
  }

  // Only show NoLyricsFound after delay and when we definitively have no lyrics
  if (showNoLyrics) {
    return <NoLyricsFound songName={name} artist={artist} />;
  }

  return <LyricsContent />;
};

export default LyricsProvider;
