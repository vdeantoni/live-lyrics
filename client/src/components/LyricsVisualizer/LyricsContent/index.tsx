import React from "react";
import LyricsContent from "./LyricsContent";
import type { LyricsData, LineData, WordData } from "@/lib/api";

interface LyricsVisualizerProps {
  lyricsData: LyricsData | null;
  activeLine: LineData | null;
  activeWord: WordData | null;
  onLineClick?: (line: LineData) => void;
  className?: string;
  style?: React.CSSProperties;
}

const LyricsVisualizer: React.FC<LyricsVisualizerProps> = ({
  lyricsData,
  activeLine,
  activeWord,
  onLineClick,
  className = "",
  style = {},
}) => {
  return (
    <div className={`lyrics-visualizer ${className}`} style={style}>
      <LyricsContent
        lyricsData={lyricsData}
        activeLine={activeLine}
        activeWord={activeWord}
        onLineClick={onLineClick}
      />
    </div>
  );
};

export default LyricsVisualizer;
export { LyricsContent };
