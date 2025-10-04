import React from "react";
import type { LineData, WordData } from "@/types";

interface LyricsLineProps {
  line: LineData;
  index: number;
  isActive: boolean;
  activeWord: WordData | null;
  songTitle: string;
  onWordClick: (time: number) => void;
}

/**
 * Renders a single lyric line with word-level highlighting and click handlers
 */
const LyricsLine: React.FC<LyricsLineProps> = ({
  line,
  index,
  isActive,
  activeWord,
  songTitle,
  onWordClick,
}) => {
  // Check if line has word-level timing (at least one word with different timing)
  const hasWordLevelTiming =
    line.words &&
    line.words.length > 1 &&
    line.words.some(
      (word, idx) => idx > 0 && word.time !== line.words![0].time,
    );

  return (
    <div
      key={`${songTitle}-${index}-${line.text.slice(0, 10)}`}
      data-testid="lyrics-line"
      data-current={isActive ? "true" : "false"}
      data-line-index={index}
      data-line-text={line.text.substring(0, 20)}
      className={`3xl:text-[clamp(1.5rem,5.5vw,7rem)] 4xl:text-[clamp(1.5rem,6vw,8em)] my-3 py-2.5 text-center text-[clamp(1.5rem,4.5vw,3rem)] font-normal opacity-50 transition-all duration-300 lg:text-[clamp(1.5rem,5vw,6rem)] ${
        isActive
          ? "scale-105 font-black opacity-100 [text-shadow:0_0_15px_#fff,0_0_30px_#fff,2px_2px_4px_rgba(0,0,0,0.8)]"
          : ""
      }`}
    >
      {line.words
        ? line.words
            .map((word, wordIndex) => {
              // Only show word-level underlines if the line has actual word-level timing
              // or if it's a single word line
              const shouldShowWordHighlight =
                hasWordLevelTiming || line.words!.length === 1;

              // Check if this word is active (handles multiple words with same timestamp)
              const isWordActive =
                shouldShowWordHighlight &&
                isActive &&
                activeWord &&
                word.time === activeWord.time &&
                wordIndex >= (activeWord.index || 0);

              return (
                <span
                  key={`${wordIndex}-${word.text}`}
                  onClick={() => onWordClick(word.time)}
                  data-word-index={wordIndex}
                  className={`cursor-pointer ${
                    isWordActive
                      ? "relative inline-block after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-md after:bg-current after:opacity-20 after:content-['']"
                      : ""
                  }`}
                >
                  {word.text}
                </span>
              );
            })
            .reduce<React.ReactNode[]>((acc, element, idx) => {
              if (idx > 0) acc.push(" "); // Add space between words
              acc.push(element);
              return acc;
            }, [])
        : line.text}
    </div>
  );
};

export default LyricsLine;
