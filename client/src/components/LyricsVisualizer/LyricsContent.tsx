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

  useEffect(() => {
    if (!lyricsData) {
      setLines([]);
      return;
    }

    const newLines = lyricsData.lines.map((line, index) => {
      const isActive = activeLine?.index === index;

      return (
        <div
          key={index}
          className={`text-center text-2xl font-normal my-3 opacity-50 transition-all duration-300 py-2.5 cursor-pointer transform ${
            isActive ? "text-2xl font-bold opacity-100 scale-110" : ""
          }`}
          onClick={() => onLineClick?.({ ...line, index })}
        >
          {lyricsData.enhanced && line.words
            ? line.words.map((word, wordIndex) => (
                <span key={wordIndex}>{word.text} </span>
              ))
            : line.text}
        </div>
      );
    });

    setLines(newLines);
  }, [lyricsData, activeLine, onLineClick]);

  // Auto-scroll to active line with proper centering (Refactored)
  useEffect(() => {
    // 1. Guard Clauses: Ensure all required elements and data are present.
    if (!activeLine || !contentRef.current) {
      return;
    }
    const container = contentRef.current;
    const activeLineElement = container.children[
      activeLine.index || 0
    ] as HTMLElement;

    if (!activeLineElement) {
      return;
    }

    // 2. DOM Measurements
    const containerHeight = container.clientHeight;
    const activeLineTop = activeLineElement.offsetTop;
    const activeLineHeight = activeLineElement.offsetHeight;

    // 3. Calculate the ideal scroll position to center the line
    // Formula: Position the top of the container at the line's top,
    // then move it up by half the container's height,
    // then move it down by half the line's height.
    // 64 accounts for padding and margin
    const idealScrollTop =
      activeLineTop - containerHeight / 2 + activeLineHeight / 2 + 64;

    // 4. Clamp the scroll position to valid bounds
    // We can't scroll above 0 or past the maximum scrollable position.
    const maxScrollTop = container.scrollHeight - containerHeight;
    const targetScrollTop = Math.max(0, Math.min(idealScrollTop, maxScrollTop));

    // 5. Scroll to the calculated position
    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
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
    <div
      ref={contentRef}
      className="w-full h-full px-10 overflow-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
    >
      <div
        ref={cursorRef}
        className="absolute w-1 h-1 rounded-md bg-current opacity-20 transition-all duration-300"
      />
      {lines}
    </div>
  );
};

export default LyricsContent;
