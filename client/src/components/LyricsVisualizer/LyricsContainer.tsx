import { useLyrics, useSong, type Lyrics } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export const MAGIC_NUMBER = 0.8;

const LyricsContainer = () => {
  const { data: song } = useSong();
  const { data: lyrics } = useLyrics(song);

  const lineRefs = useRef(new Map());
  const setLineRef = (line: Lyrics, element: any) => {
    if (element) {
      lineRefs.current.set(line.time, element);
    } else {
      lineRefs.current.delete(line.time);
    }
  };

  const handleClick = (line: Lyrics) => {
    const element = lineRefs.current.get(line.time);
    if (element) {
      console.log(`Clicked item ID: ${line.time}, Element:`, element);
      element.style.backgroundColor = "lightblue";
    }
  };

  const [currentLine, setCurrentLine] = useState(-1);

  useEffect(() => {
    if (!lyrics) {
      return;
    }

    let newLyricIndex = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (song.currentTime >= lyrics[i].time - MAGIC_NUMBER) {
        newLyricIndex = i;
        break;
      }
    }

    setCurrentLine(newLyricIndex);
  }, [song, lyrics]);

  useEffect(() => {
    if (!lyrics?.[currentLine]) {
      return;
    }

    const element = lineRefs.current.get(lyrics[currentLine].time);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [currentLine, lyrics]);

  const isActive = (index: number) => {
    return index === currentLine;
  };

  const isVisible = (index: number) => {
    return Math.abs(index - currentLine) <= 3;
  };

  const getDistance = (index: number) => {
    return Math.abs(index - currentLine);
  };

  return (
    <div className="perspective-normal transform-3d relative flex flex-col-reverse items-center scroll-smooth z-10 h-full overflow-y-auto pt-[calc(100%_-_1px)]">
      {lyrics?.map((line, index) => (
        <span
          key={line.time}
          ref={(el) => setLineRef(line, el)}
          onClick={() => handleClick(line)}
          className={cn(
            `p-4 text-xl font-bold text-center text-muted origin-top transform-all duration-300 scale-90 -translate-z-0 rotate-x-12 rotate-z-0`,
            isActive(index) &&
              "pb-6 text-white text-2xl duration-[400ms] origin-center translate-z-0 rotate-x-0 scale-100",
            {
              invisible: !isVisible(index),
            },
          )}
        >
          {line.text || "..."}
        </span>
      ))}
    </div>
  );
};

export default LyricsContainer;
