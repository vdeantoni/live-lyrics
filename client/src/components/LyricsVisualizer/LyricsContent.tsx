import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  lyricsDataAtom,
  activeLineAtom,
  activeWordAtom,
  playerControlAtom,
  playerStateAtom,
} from "@/atoms/playerAtoms";
import LyricsLine from "./LyricsLine";
import SilenceLine from "./SilenceLine";
import {
  findActiveLineElement,
  calculateCenteredScrollPosition,
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
  const previousActiveLineRef = useRef<LineData | null>(null);

  // Click handler
  const handleLineClick = useCallback(
    (time: number) => {
      if (time !== undefined) {
        playerControl({ type: "seek", payload: time });
      }
    },
    [playerControl],
  );

  // Scroll function that takes an optional target line
  const performScroll = useCallback(
    (targetLine?: LineData | null) => {
      if (!contentRef.current || !lyricsData) return;

      // Use provided target or fall back to current active line
      const currentActiveLine = targetLine || previousActiveLineRef.current;
      if (!currentActiveLine) return;

      const container = contentRef.current;

      requestAnimationFrame(() => {
        const activeLineElement = findActiveLineElement(
          container,
          currentActiveLine,
        );
        if (!activeLineElement) return;

        const isSilenceIndicator = currentActiveLine.type === "silence";
        const isLastElement =
          activeLineElement === container.lastElementChild ||
          activeLineElement ===
            container.children[container.children.length - 1];

        // For last silence block, scroll to bottom
        if (isSilenceIndicator && isLastElement) {
          container.scrollTo({
            top: container.scrollHeight - container.clientHeight,
            behavior: "smooth",
          });
          return;
        }

        // For non-last silence blocks, scroll to the NEXT lyric line
        if (isSilenceIndicator && !isLastElement) {
          const currentIndex = currentActiveLine.index ?? 0;
          const nextLyricLine = lyricsData.lines
            .slice(currentIndex + 1)
            .find((line) => line.type !== "silence");

          if (nextLyricLine) {
            const nextLineElement = findActiveLineElement(
              container,
              nextLyricLine,
            );
            if (nextLineElement) {
              const targetScrollTop = calculateCenteredScrollPosition(
                container,
                nextLineElement,
                64,
              );
              container.scrollTo({
                top: targetScrollTop,
                behavior: "smooth",
              });
              return;
            }
          }
        }

        // For regular lines or fallback
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
    },
    [lyricsData],
  );

  // Render lines (lyrics and silence indicators)
  useEffect(() => {
    if (!lyricsData) {
      setLines([]);
      return;
    }

    // Find first silence block index
    const silenceIndices = lyricsData.lines
      .map((line, idx) => (line.type === "silence" ? idx : -1))
      .filter((idx) => idx !== -1);
    const firstSilenceIndex = silenceIndices[0];

    const newLines = lyricsData.lines
      .map((line: LineData, index: number) => {
        const isActive = activeLine?.index === index;

        // Silence indicator lines
        if (line.type === "silence") {
          // Calculate duration to next lyric line or end of song
          const nextLine = lyricsData.lines[index + 1];
          let duration: number;

          if (nextLine) {
            // Duration until next lyric line
            duration = nextLine.time - line.time;
          } else {
            // Last silence block - use song duration from player state
            const songDuration = playerState?.duration || 0;
            duration = songDuration > 0 ? songDuration - line.time : 20;
          }

          // Determine block type based on actual position in song
          // - First: First silence in the array
          // - Last: Silence with no lyrics after it (truly at end of song)
          // - Middle: Everything else
          const isFirstBlock = index === firstSilenceIndex;
          const isLastBlock = !nextLine; // True last block has no line after it
          const isEdgeBlock = isFirstBlock || isLastBlock;

          // Always render the element (for scroll calculations) but control visibility
          return (
            <SilenceLine
              key={`silence-${index}-${line.time}`}
              index={index}
              time={line.time}
              duration={duration}
              isActive={isActive}
              isEdgeBlock={isEdgeBlock}
              isFirstBlock={isFirstBlock}
              isLastBlock={isLastBlock}
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
    if (!lyricsData || !contentRef.current) return;

    const container = contentRef.current;

    // Restore previous scroll position only if we have one saved
    if (lastScrollPosition.current > 0) {
      requestAnimationFrame(() => {
        container.scrollTop = lastScrollPosition.current;
      });
    }
  }, [lyricsData]); // Only depend on lyricsData, not activeLine

  // Auto-scroll to active line
  useEffect(() => {
    if (!activeLine || !contentRef.current || !lyricsData) return;

    previousActiveLineRef.current = activeLine;

    // Only scroll for regular lyric lines
    if (!activeLine.text?.includes("♪")) {
      performScroll(activeLine);
      console.log("Scroll:", activeLine);
    }
  }, [activeLine, lyricsData, performScroll]);

  // Handle initial scroll for new songs
  useEffect(() => {
    if (
      !lyricsData ||
      !activeLine ||
      !contentRef.current ||
      lastScrollPosition.current > 0
    )
      return;

    // Skip silence indicators on initial load - just scroll to regular lines
    if (activeLine.type === "silence") {
      return;
    }

    // For regular lines, scroll immediately using scrollIntoView
    const container = contentRef.current;
    const frame = requestAnimationFrame(() => {
      const activeLineElement = findActiveLineElement(container, activeLine);
      if (!activeLineElement) return;

      activeLineElement.scrollIntoView({
        behavior: "auto", // Instant for initial load
        block: "center",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [lyricsData, activeLine]);

  return (
    <div
      data-testid="lyrics-container"
      ref={contentRef}
      className="h-full w-full overflow-auto px-6 lg:px-8 xl:px-10 [&::-webkit-scrollbar]:hidden"
    >
      {lines}
    </div>
  );
};

export default LyricsContent;
