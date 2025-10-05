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
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const currentSongIdRef = useRef<string | null>(null);

  // Click handler
  const handleLineClick = useCallback(
    (time: number) => {
      if (time !== undefined) {
        playerControl({ type: "seek", payload: time });
      }
    },
    [playerControl],
  );

  // Unified scroll function with proper cleanup and coordination
  const performScroll = useCallback(
    (targetLine: LineData | null, isInitial: boolean = false) => {
      if (!contentRef.current || !lyricsData || !targetLine) return;

      // Cancel any pending scroll animation
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }

      const container = contentRef.current;

      // Use double RAF to ensure DOM has updated with new data-current attributes
      scrollAnimationFrameRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const activeLineElement = findActiveLineElement(
            container,
            targetLine,
          );
          if (!activeLineElement) return;

          const isSilenceIndicator = targetLine.type === "silence";
          const isLastElement =
            activeLineElement === container.lastElementChild ||
            activeLineElement ===
              container.children[container.children.length - 1];

          // For last silence block, scroll to bottom
          if (isSilenceIndicator && isLastElement) {
            container.scrollTo({
              top: container.scrollHeight - container.clientHeight,
              behavior: isInitial ? "auto" : "smooth",
            });
            return;
          }

          // For non-last silence blocks, scroll to the NEXT lyric line
          if (isSilenceIndicator && !isLastElement) {
            const currentIndex = targetLine.index ?? 0;
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
                  behavior: isInitial ? "auto" : "smooth",
                });
                return;
              }
            }
          }

          // For regular lines - always center exactly
          const targetScrollTop = calculateCenteredScrollPosition(
            container,
            activeLineElement,
            64,
          );
          container.scrollTo({
            top: targetScrollTop,
            behavior: isInitial ? "auto" : "smooth",
          });
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

  // Detect song changes
  useEffect(() => {
    if (!lyricsData) {
      currentSongIdRef.current = null;
      isInitialLoadRef.current = true;
      lastScrollPosition.current = 0;
      return;
    }

    const songId = lyricsData.tags?.ti || "unknown";
    if (songId !== currentSongIdRef.current) {
      currentSongIdRef.current = songId;
      isInitialLoadRef.current = true;
      lastScrollPosition.current = 0;
    }
  }, [lyricsData]);

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
  }, []);

  // Unified auto-scroll effect (replaces three separate effects)
  useEffect(() => {
    if (!activeLine || !contentRef.current || !lyricsData) return;

    previousActiveLineRef.current = activeLine;

    // Skip silence indicators (only scroll on lyric lines)
    if (activeLine.text?.includes("♪") || activeLine.type === "silence") {
      return;
    }

    // Determine if this is an initial load
    const isInitial = isInitialLoadRef.current;

    // Scroll to the active line
    performScroll(activeLine, isInitial);

    // Mark as no longer initial after first scroll
    if (isInitial) {
      isInitialLoadRef.current = false;
    }

    // Cleanup function to cancel pending animations
    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };
  }, [activeLine, lyricsData, performScroll]);

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
