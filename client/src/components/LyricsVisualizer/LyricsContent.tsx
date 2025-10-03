import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  lyricsDataAtom,
  activeLineAtom,
  activeWordAtom,
  playerControlAtom,
  playerStateAtom,
} from "@/atoms/playerAtoms";
import { LYRICS_SILENCE } from "@/constants/timing";
import LyricsLine from "./LyricsLine";
import SilenceLine from "./SilenceLine";
import {
  findActiveLineElement,
  calculateCenteredScrollPosition,
  isElementVisible,
} from "@/utils/scrollUtils";
import type { LineData } from "@/types";

const LyricsContent: React.FC = () => {
  // Atom subscriptions
  const lyricsData = useAtomValue(lyricsDataAtom);
  const activeLine = useAtomValue(activeLineAtom);
  const activeWord = useAtomValue(activeWordAtom);
  const playerControl = useSetAtom(playerControlAtom);
  const playerState = useAtomValue(playerStateAtom);

  // Refs and state
  const contentRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<React.ReactElement[]>([]);
  const lastScrollPosition = useRef<number>(0);
  const isScrollingFromSwitch = useRef<boolean>(false);

  // Click handler
  const handleLineClick = useCallback(
    (time: number) => {
      if (time !== undefined) {
        playerControl({ type: "seek", payload: time });
      }
    },
    [playerControl],
  );

  // Render lines (lyrics and silence indicators)
  useEffect(() => {
    if (!lyricsData) {
      setLines([]);
      return;
    }

    // Find first and last silence block indices
    const silenceIndices = lyricsData.lines
      .map((line, idx) => (line.type === "silence" ? idx : -1))
      .filter((idx) => idx !== -1);
    const firstSilenceIndex = silenceIndices[0];
    const lastSilenceIndex = silenceIndices[silenceIndices.length - 1];

    const newLines = lyricsData.lines
      .map((line: LineData, index: number) => {
        const isActive = activeLine?.index === index;

        // Silence indicator lines
        if (line.type === "silence") {
          if (!isActive) return null;

          // Calculate duration to next lyric line
          const nextLine = lyricsData.lines[index + 1];
          const duration = nextLine ? nextLine.time - line.time : 20;

          // Check if enough time has passed to show the indicator
          const currentTime = playerState?.currentTime || 0;
          const shouldShow =
            currentTime >= line.time + LYRICS_SILENCE.INDICATOR_DELAY;

          if (!shouldShow) return null;

          // Determine if this is an edge block (first or last)
          const isEdgeBlock =
            index === firstSilenceIndex || index === lastSilenceIndex;

          return (
            <SilenceLine
              key={`silence-${index}-${line.time}`}
              index={index}
              time={line.time}
              duration={duration}
              isActive={isActive}
              shouldShow={shouldShow}
              isEdgeBlock={isEdgeBlock}
            />
          );
        }

        // Regular lyric lines
        return (
          <LyricsLine
            key={`${lyricsData.tags?.ti || "song"}-${index}-${line.text.slice(0, 10)}`}
            line={line}
            index={index}
            isActive={isActive}
            activeWord={activeWord}
            songTitle={lyricsData.tags?.ti || "song"}
            onWordClick={handleLineClick}
          />
        );
      })
      .filter((element): element is React.ReactElement => element !== null);

    setLines(newLines);
  }, [lyricsData, activeLine, activeWord, playerState, handleLineClick]);

  // Save scroll position when scrolling manually
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isScrollingFromSwitch.current) {
        lastScrollPosition.current = container.scrollTop;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [lyricsData]);

  // Restore scroll position when lyrics data loads
  useEffect(() => {
    if (!lyricsData || !contentRef.current || !activeLine) return;

    const container = contentRef.current;

    // Restore previous scroll position
    if (lastScrollPosition.current > 0) {
      requestAnimationFrame(() => {
        container.scrollTop = lastScrollPosition.current;

        // Check if active line is visible after restore
        requestAnimationFrame(() => {
          if (
            !activeLine ||
            (activeLine.index === undefined && activeLine.time === undefined)
          )
            return;

          setTimeout(() => {
            const activeLineElement = findActiveLineElement(
              container,
              activeLine,
            );
            if (!activeLineElement) return;

            // Scroll to active line if not visible
            if (!isElementVisible(container, activeLineElement)) {
              const targetScrollTop = calculateCenteredScrollPosition(
                container,
                activeLineElement,
                0,
              );
              container.scrollTo({
                top: targetScrollTop,
                behavior: "instant",
              });
              lastScrollPosition.current = targetScrollTop;
            }
          }, 200);
        });
      });
    }
  }, [lyricsData, activeLine]);

  // Auto-scroll to active line
  useEffect(() => {
    if (!activeLine || !contentRef.current) return;

    const container = contentRef.current;

    const frame = requestAnimationFrame(() => {
      const activeLineElement = findActiveLineElement(container, activeLine);
      if (!activeLineElement) return;

      const targetScrollTop = calculateCenteredScrollPosition(
        container,
        activeLineElement,
        64,
      );

      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeLine]);

  // Handle initial scroll for new songs
  useEffect(() => {
    if (
      !lyricsData ||
      !activeLine ||
      !contentRef.current ||
      lastScrollPosition.current > 0
    )
      return;

    const container = contentRef.current;

    const frame = requestAnimationFrame(() => {
      const activeLineElement = findActiveLineElement(container, activeLine);
      if (!activeLineElement) return;

      const targetScrollTop = calculateCenteredScrollPosition(
        container,
        activeLineElement,
        64,
      );

      container.scrollTo({
        top: targetScrollTop,
        behavior: "instant",
      });

      lastScrollPosition.current = targetScrollTop;
    });

    return () => cancelAnimationFrame(frame);
  }, [lyricsData, activeLine]);

  return (
    <div
      data-testid="lyrics-container"
      ref={contentRef}
      className="h-full w-full overflow-auto scroll-smooth px-6 lg:px-8 xl:px-10 [&::-webkit-scrollbar]:hidden"
    >
      {lines}
    </div>
  );
};

export default LyricsContent;
