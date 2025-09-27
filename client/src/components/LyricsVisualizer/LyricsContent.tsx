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
  const lastScrollPosition = useRef<number>(0);
  const isScrollingFromSwitch = useRef<boolean>(false);

  useEffect(() => {
    if (!lyricsData) {
      setLines([]);
      return;
    }

    const newLines = lyricsData.lines.map((line, index) => {
      const isActive = activeLine?.index === index;

      return (
        <div
          key={`${lyricsData.tags?.ti || 'song'}-${index}-${line.text.slice(0, 10)}`} // More unique key
          className={`text-center font-normal my-3 opacity-50 transition-all duration-300 py-2.5 cursor-pointer transform ${
            isActive
              ? "font-bold opacity-100 scale-110 [text-shadow:0_0_10px_#fff,4px_4px_8px_rgba(0,0,0,0.5)]"
              : ""
          }`}
          style={{
            fontSize: isActive
              ? "clamp(1.75rem, 4vw, 10rem)"
              : "clamp(1.5rem, 3.5vw, 6rem)",
          }}
          onClick={() => onLineClick?.({ ...line, index })}
        >
          {lyricsData.enhanced && line.words
            ? line.words.map((word, wordIndex) => (
                <span key={`${wordIndex}-${word.text}`}>{word.text} </span>
              ))
            : line.text}
        </div>
      );
    });

    setLines(newLines);
  }, [lyricsData, activeLine, onLineClick]);

  // Save scroll position when scrolling manually or naturally
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isScrollingFromSwitch.current) {
        lastScrollPosition.current = container.scrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
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
          if (!activeLine || (activeLine.index === undefined && activeLine.time === undefined)) return;

          // Find the active line element by looking for the one with active styling
          let activeLineElement: HTMLElement | null = null;
          for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i] as HTMLElement;
            if (child.className.includes('font-bold opacity-100 scale-110')) {
              activeLineElement = child;
              break;
            }
          }

          if (!activeLineElement) return;

          // Check if the active line is visible
          const containerHeight = container.clientHeight;
          const containerScrollTop = container.scrollTop;
          const activeLineTop = activeLineElement.offsetTop;
          const activeLineHeight = activeLineElement.offsetHeight;

          const lineTopInViewport = activeLineTop - containerScrollTop;
          const lineBottomInViewport = lineTopInViewport + activeLineHeight;

          // If active line is not visible, scroll to it
          if (lineTopInViewport < 0 || lineBottomInViewport > containerHeight) {
            const idealScrollTop =
              activeLineTop - containerHeight / 2 + activeLineHeight / 2 + 64;
            const maxScrollTop = container.scrollHeight - containerHeight;
            const targetScrollTop = Math.max(0, Math.min(idealScrollTop, maxScrollTop));

            container.scrollTo({
              top: targetScrollTop,
              behavior: "instant",
            });

            // Update the stored position
            lastScrollPosition.current = targetScrollTop;
          }
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

    // Find the active line element by looking for the one with active styling
    let activeLineElement: HTMLElement | null = null;
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      if (child.className.includes('font-bold opacity-100 scale-110')) {
        activeLineElement = child;
        break;
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
    const targetScrollTop = Math.max(0, Math.min(idealScrollTop, maxScrollTop));

    // 5. Scroll to the calculated position
    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
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

      // Find the active line element by looking for the one with the active styling
      let activeLineElement: HTMLElement | null = null;
      for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLElement;
        if (child.className.includes('font-bold opacity-100 scale-110')) {
          activeLineElement = child;
          break;
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
      const targetScrollTop = Math.max(0, Math.min(idealScrollTop, maxScrollTop));

      container.scrollTo({
        top: targetScrollTop,
        behavior: "instant",
      });

      // Update the stored position
      lastScrollPosition.current = targetScrollTop;
    });

    return () => cancelAnimationFrame(frame);
  }, [lyricsData]); // Also depend on activeLine changes

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
      className="w-full h-full px-6 lg:px-8 xl:px-10 overflow-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
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
