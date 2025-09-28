import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

// Animation timing constants
const ANIMATION_CONSTANTS = {
  INITIAL_DELAY: 3,
  SCROLL_SPEED_PER_PIXEL: 0.02,
  PAUSE_AFTER_SCROLL: 3,
  SCROLL_PADDING: 20,
  RESUME_DELAY_AFTER_DRAG: 2.5, // seconds
  RESUME_DELAY_AFTER_HOVER: 0.5, // seconds
} as const;

interface AnimatedSongNameProps {
  songName?: string;
  className?: string;
}

const AnimatedSongName = ({
  songName,
  className = "",
}: AnimatedSongNameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- Refs to hold current animation values ---
  const scrollDistanceRef = useRef(0);
  const scrollDurationRef = useRef(0);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xPositionRef = useRef(0);

  const controls = useAnimation();

  const startInfiniteAnimation = () => {
    // Read from refs to get the latest values
    const distance = scrollDistanceRef.current;
    const duration = scrollDurationRef.current;

    controls.start({
      x: [0, -distance],
      transition: {
        x: {
          duration: duration,
          delay: ANIMATION_CONSTANTS.INITIAL_DELAY,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: ANIMATION_CONSTANTS.PAUSE_AFTER_SCROLL,
        },
      },
    });
  };

  const resumeAndLoop = async () => {
    // Read from refs to get the latest values
    const distance = scrollDistanceRef.current;
    const duration = scrollDurationRef.current;

    // Safety check to prevent division by zero
    if (distance === 0) return;

    const currentX = xPositionRef.current;
    const targetX = -distance;
    const remainingDistance = Math.abs(targetX - currentX);
    const remainingDuration = (remainingDistance / distance) * duration;

    await controls.start({
      x: targetX,
      transition: { duration: remainingDuration, ease: "linear" },
    });
    await controls.start({
      x: targetX,
      transition: {
        delay: ANIMATION_CONSTANTS.PAUSE_AFTER_SCROLL,
        duration: 0,
      },
    });
    startInfiniteAnimation();
  };

  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const text = textRef.current;

      if (container && text) {
        const hasOverflow = text.scrollWidth > container.offsetWidth;
        setIsOverflowing(hasOverflow);

        if (hasOverflow) {
          const distance =
            text.scrollWidth -
            container.offsetWidth +
            ANIMATION_CONSTANTS.SCROLL_PADDING;
          // Set both state and ref
          setScrollDistance(distance);
          scrollDistanceRef.current = distance;
          scrollDurationRef.current =
            distance * ANIMATION_CONSTANTS.SCROLL_SPEED_PER_PIXEL;
        } else {
          // Reset both state and ref
          setScrollDistance(0);
          scrollDistanceRef.current = 0;
        }
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [songName]);

  const handleMouseEnter = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    if (!isDragging) {
      controls.stop();
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) return;
    resumeTimeoutRef.current = setTimeout(
      resumeAndLoop,
      ANIMATION_CONSTANTS.RESUME_DELAY_AFTER_HOVER * 1000,
    );
  };

  const handleDragStart = () => {
    setIsDragging(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    controls.stop();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Only schedule resume if there's actually overflow
    if (scrollDistanceRef.current > 0) {
      resumeTimeoutRef.current = setTimeout(
        resumeAndLoop,
        ANIMATION_CONSTANTS.RESUME_DELAY_AFTER_DRAG * 1000,
      );
    }
  };

  useEffect(() => {
    if (isOverflowing) {
      startInfiniteAnimation();
    } else {
      controls.stop();
      controls.set({ x: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverflowing, controls]);

  if (!songName) return null;

  return (
    <div
      data-testid={"song-name"}
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.h2
        ref={textRef}
        className="whitespace-nowrap text-center text-2xl font-semibold"
        animate={controls}
        onUpdate={(latest) => {
          if (typeof latest.x === "number") {
            xPositionRef.current = latest.x;
          }
        }}
        drag={isOverflowing ? "x" : false}
        dragConstraints={{ left: -scrollDistance, right: 0 }}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          cursor: isOverflowing ? "grab" : "text",
        }}
        whileDrag={{ cursor: "grabbing" }}
      >
        {songName}
      </motion.h2>
    </div>
  );
};

export default AnimatedSongName;
