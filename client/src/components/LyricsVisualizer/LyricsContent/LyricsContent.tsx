import React, { useEffect, useRef, useState } from "react";
import type { LyricsData, LineData, WordData } from "@/lib/api";

interface LyricsContentProps {
  lyricsData: LyricsData | null;
  activeLine: LineData | null;
  activeWord: WordData | null;
  onLineClick?: (line: LineData) => void;
}

const LyricsContent: React.FC<LyricsContentProps> = ({
  lyricsData,
  activeLine,
  activeWord,
  onLineClick,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<React.ReactElement[]>([]);

  // Generate lines similar to reference implementation
  useEffect(() => {
    if (!lyricsData) {
      setLines([]);
      return;
    }

    const newLines = lyricsData.lines.map((line, index) => {
      // Compare by index since liricle provides line.index in sync event
      const isActive = activeLine?.index === index;

      return (
        <div
          key={index}
          className={`lyric__line ${isActive ? "active" : ""}`}
          onClick={() => onLineClick?.({ ...line, index })}
        >
          {lyricsData.enhanced && line.words
            ? line.words.map((word, wordIndex) => (
                <span key={wordIndex} className="lyric__word">
                  {word.text}{" "}
                </span>
              ))
            : line.text}
        </div>
      );
    });

    setLines(newLines);
  }, [lyricsData, activeLine, onLineClick]);

  // Auto-scroll to active line (matching reference implementation)
  useEffect(() => {
    if (!activeLine || !contentRef.current) return;

    const activeLineElement = contentRef.current.children[
      activeLine.index || 0
    ] as HTMLElement;
    if (!activeLineElement) return;

    // Center the active line in the container
    const containerHeight = contentRef.current.offsetHeight;
    const lineHeight = activeLineElement.offsetHeight;
    const lineTop = activeLineElement.offsetTop;

    // Calculate scroll position to center the line
    const scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;

    contentRef.current.scrollTop = scrollTop;
  }, [activeLine]);

  // Word-level cursor positioning (matching reference implementation)
  useEffect(() => {
    if (
      !activeWord ||
      !activeLine ||
      !contentRef.current ||
      !cursorRef.current ||
      !lyricsData?.enhanced
    )
      return;

    const activeLineElement = contentRef.current.children[
      activeLine.index || 0
    ] as HTMLElement;
    if (!activeLineElement) return;

    const wordElement = activeLineElement.children[
      activeWord.index || 0
    ] as HTMLElement;
    if (!wordElement) return;

    const cursor = cursorRef.current;
    cursor.style.width = `${wordElement.offsetWidth}px`;
    cursor.style.top = `${wordElement.offsetTop + wordElement.offsetHeight}px`;
    cursor.style.left = `${wordElement.offsetLeft}px`;
    cursor.style.display = "block";
  }, [activeWord, activeLine, lyricsData?.enhanced]);

  // Show/hide cursor based on enhanced mode
  useEffect(() => {
    if (!cursorRef.current) return;

    if (lyricsData?.enhanced) {
      cursorRef.current.style.display = "block";
    } else {
      cursorRef.current.style.display = "none";
    }
  }, [lyricsData?.enhanced]);

  return (
    <div ref={contentRef} className="lyric__content">
      <div ref={cursorRef} className="lyric__cursor" />
      {lines}
    </div>
  );
};

export default LyricsContent;
