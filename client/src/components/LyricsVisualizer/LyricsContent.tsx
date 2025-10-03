import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  lyricsDataAtom,
  activeLineAtom,
  activeWordAtom,
  playerControlAtom,
  playerStateAtom,
} from "@/atoms/playerAtoms";
import SilenceIndicator from "./SilenceIndicator";
import { LYRICS_SILENCE } from "@/constants/timing";
import { AnimatePresence, motion } from "framer-motion";

const LyricsContent: React.FC = () => {
  // Use atoms for lyrics state
  const lyricsData = useAtomValue(lyricsDataAtom);
  const activeLine = useAtomValue(activeLineAtom);
  const activeWord = useAtomValue(activeWordAtom);
  const playerControl = useSetAtom(playerControlAtom);
  const playerState = useAtomValue(playerStateAtom);

  // Click handler using playerControl atom
  const handleLineClick = useCallback(
    (time: number) => {
      if (time !== undefined) {
        playerControl({ type: "seek", payload: time });
      }
    },
    [playerControl],
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<React.ReactElement[]>([]);
  const lastScrollPosition = useRef<number>(0);
  const isScrollingFromSwitch = useRef<boolean>(false);

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
      .map((line, index) => {
        const isActive = activeLine?.index === index;

        // Handle silence indicator lines
        if (line.type === "silence") {
          if (isActive) {
            // Calculate duration to next lyric line
            const nextLine = lyricsData.lines[index + 1];
            const duration = nextLine ? nextLine.time - line.time : 20; // Default to 20s if no next line

            // Check if enough time has passed since line.time to show the indicator
            // The silence line time is already set with INDICATOR_DELAY, but we need
            // to check if current time has actually progressed past that point
            const currentTime = playerState?.currentTime || 0;
            const shouldShow =
              currentTime >= line.time + LYRICS_SILENCE.INDICATOR_DELAY;

            if (!shouldShow) {
              return null;
            }

            // Determine if this is an edge block (first or last)
            const isEdgeBlock =
              index === firstSilenceIndex || index === lastSilenceIndex;

            return (
              <AnimatePresence mode="wait">
                {shouldShow && (
                  <motion.div
                    key={`silence-${index}-${line.time}`}
                    data-testid="silence-indicator-line"
                    data-current={isActive ? "true" : "false"}
                    initial={{ height: 0, opacity: 0, scale: 0.8 }}
                    animate={{ height: "auto", opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1], // iOS-style easing
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.3 },
                    }}
                    className={`overflow-hidden ${
                      isActive
                        ? "font-black [text-shadow:0_0_15px_#fff,0_0_30px_#fff,2px_2px_4px_rgba(0,0,0,0.8)]"
                        : ""
                    }`}
                  >
                    <div className="my-3 transform py-2.5 transition-all duration-300">
                      <SilenceIndicator
                        isActive={isActive}
                        startTime={line.time}
                        duration={duration}
                        isEdgeBlock={isEdgeBlock}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          } else {
            return null;
          }
        }

        // Regular lyric lines
        return (
          <div
            key={`${lyricsData.tags?.ti || "song"}-${index}-${line.text.slice(0, 10)}`} // More unique key
            data-testid="lyrics-line"
            data-current={isActive ? "true" : "false"}
            data-line-index={index} // Add data attribute for easier detection
            data-line-text={line.text.substring(0, 20)} // Add data attribute for text matching
            className={`3xl:text-[clamp(1.5rem,5.5vw,7rem)] 4xl:text-[clamp(1.5rem,6vw,8em)] my-3 py-2.5 text-center text-[clamp(1.5rem,4.5vw,3rem)] font-normal opacity-50 transition-all duration-300 lg:text-[clamp(1.5rem,5vw,6rem)] ${
              isActive
                ? "scale-105 font-black opacity-100 [letter-spacing:0.02em] [text-shadow:0_0_15px_#fff,0_0_30px_#fff,2px_2px_4px_rgba(0,0,0,0.8)]"
                : ""
            }`}
          >
            {line.words
              ? line.words
                  .map((word, wordIndex) => {
                    // Check if this word is active (handles multiple words with same timestamp)
                    const isWordActive =
                      isActive &&
                      activeWord &&
                      word.time === activeWord.time &&
                      wordIndex >= (activeWord.index || 0);

                    return (
                      <span
                        key={`${wordIndex}-${word.text}`}
                        onClick={() => handleLineClick(word.time)}
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
      })
      .filter((element): element is React.ReactElement => element !== null);

    setLines(newLines);
  }, [lyricsData, activeLine, activeWord, playerState, handleLineClick]);

  // Save scroll position when scrolling manually or naturally
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

  // Restore scroll position when lyrics data loads (immediate)
  useEffect(() => {
    if (!lyricsData || !contentRef.current) return;

    const container = contentRef.current;

    // Restore previous scroll position immediately without any delay
    if (lastScrollPosition.current > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        container.scrollTop = lastScrollPosition.current;

        // After restoring position, check if active line is visible
        // Use a second requestAnimationFrame to ensure scroll is complete
        requestAnimationFrame(() => {
          // Only check for active line if there actually is one (not at time 0)
          if (
            !activeLine ||
            (activeLine.index === undefined && activeLine.time === undefined)
          )
            return;

          // Wait longer for React to fully update the DOM with active classes
          setTimeout(() => {
            // Robust element detection using data attribute
            let activeLineElement: HTMLElement | null = null;

            // Find by data-current attribute (works for both lyrics and silence indicators)
            for (let i = 0; i < container.children.length; i++) {
              const child = container.children[i] as HTMLElement;
              if (child.getAttribute("data-current") === "true") {
                activeLineElement = child;
                break;
              }
            }

            // Fallback: try to find by index if activeLine has an index
            if (!activeLineElement && activeLine.index !== undefined) {
              const potentialElement = container.children[
                activeLine.index
              ] as HTMLElement;
              if (potentialElement) {
                activeLineElement = potentialElement;
              }
            }

            // Last resort: find by searching through all elements for matching text
            if (!activeLineElement) {
              for (let i = 0; i < container.children.length; i++) {
                const child = container.children[i] as HTMLElement;
                if (
                  child.textContent?.includes(activeLine.text.substring(0, 20))
                ) {
                  activeLineElement = child;
                  break;
                }
              }
            }

            if (!activeLineElement) {
              return;
            }

            // Check if the active line is visible
            const containerHeight = container.clientHeight;
            const containerScrollTop = container.scrollTop;
            const activeLineTop = activeLineElement.offsetTop;
            const activeLineHeight = activeLineElement.offsetHeight;

            const lineTopInViewport = activeLineTop - containerScrollTop;
            const lineBottomInViewport = lineTopInViewport + activeLineHeight;

            // If active line is not visible, scroll to it
            if (
              lineTopInViewport < 0 ||
              lineBottomInViewport > containerHeight
            ) {
              const idealScrollTop =
                activeLineTop - containerHeight / 2 + activeLineHeight / 2;
              const maxScrollTop = container.scrollHeight - containerHeight;
              const targetScrollTop = Math.max(
                0,
                Math.min(idealScrollTop, maxScrollTop),
              );

              container.scrollTo({
                top: targetScrollTop,
                behavior: "instant",
              });

              // Update the stored position
              lastScrollPosition.current = targetScrollTop;
            }
          }, 200); // Increased delay to ensure React has updated
        });
      });
    }
  }, [lyricsData, activeLine]);

  // Auto-scroll to active line with proper centering (Refactored)
  useEffect(() => {
    // 1. Guard Clauses: Ensure all required elements and data are present.
    if (!activeLine || !contentRef.current) {
      return;
    }
    const container = contentRef.current;

    // Use requestAnimationFrame to ensure DOM has been updated with new classes
    const frame = requestAnimationFrame(() => {
      // Find the active line element using data attribute
      let activeLineElement: HTMLElement | null = null;

      // Find by data-current attribute (works for both lyrics and silence indicators)
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLElement;
        if (child.getAttribute("data-current") === "true") {
          activeLineElement = child;
          break;
        }
      }

      // Fallback: try to find by index if activeLine has an index
      if (!activeLineElement && activeLine.index !== undefined) {
        const potentialElement = container.children[
          activeLine.index
        ] as HTMLElement;
        if (potentialElement) {
          activeLineElement = potentialElement;
        }
      }

      // Last resort: find by searching through all elements for matching text
      if (!activeLineElement) {
        for (let i = 0; i < container.children.length; i++) {
          const child = container.children[i] as HTMLElement;
          if (child.textContent?.includes(activeLine.text.substring(0, 20))) {
            activeLineElement = child;
            break;
          }
        }
      }

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
      const targetScrollTop = Math.max(
        0,
        Math.min(idealScrollTop, maxScrollTop),
      );

      // 5. Scroll to the calculated position
      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeLine]);

  // Handle initial scroll when lyrics data loads with an already-active line (only for new songs)
  useEffect(() => {
    if (!lyricsData || !activeLine || !contentRef.current) {
      return;
    }

    // Only handle initial scroll if we don't have a saved position (completely new song)
    if (lastScrollPosition.current > 0) {
      return;
    }

    // Use requestAnimationFrame for better synchronization with rendering
    const frame = requestAnimationFrame(() => {
      const container = contentRef.current;
      if (!container) return;

      // Robust element detection using data attribute
      let activeLineElement: HTMLElement | null = null;

      // Find by data-current attribute (works for both lyrics and silence indicators)
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLElement;
        if (child.getAttribute("data-current") === "true") {
          activeLineElement = child;
          break;
        }
      }

      // Fallback: try to find by index if activeLine has an index
      if (!activeLineElement && activeLine.index !== undefined) {
        const potentialElement = container.children[
          activeLine.index
        ] as HTMLElement;
        if (potentialElement) {
          activeLineElement = potentialElement;
        }
      }

      // Last resort: find by searching through all elements for matching text
      if (!activeLineElement) {
        for (let i = 0; i < container.children.length; i++) {
          const child = container.children[i] as HTMLElement;
          if (child.textContent?.includes(activeLine.text.substring(0, 20))) {
            activeLineElement = child;
            break;
          }
        }
      }

      if (!activeLineElement) return;

      // Calculate and scroll to active line
      const containerHeight = container.clientHeight;
      const activeLineTop = activeLineElement.offsetTop;
      const activeLineHeight = activeLineElement.offsetHeight;

      const idealScrollTop =
        activeLineTop - containerHeight / 2 + activeLineHeight / 2 + 64;
      const maxScrollTop = container.scrollHeight - containerHeight;
      const targetScrollTop = Math.max(
        0,
        Math.min(idealScrollTop, maxScrollTop),
      );

      container.scrollTo({
        top: targetScrollTop,
        behavior: "instant",
      });

      // Update the stored position
      lastScrollPosition.current = targetScrollTop;
    });

    return () => cancelAnimationFrame(frame);
  }, [lyricsData, activeLine]); // Depend on both for proper initial scroll

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
