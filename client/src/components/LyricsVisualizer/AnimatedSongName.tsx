import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

// Animation timing constants
const ANIMATION_CONSTANTS = {
  INITIAL_DELAY: 3, // Delay in seconds
  SCROLL_SPEED_PER_PIXEL: 0.02, // Time in seconds to scroll one pixel
  PAUSE_AFTER_SCROLL: 3, // Pause in seconds
  SCROLL_PADDING: 20,
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

  const animationValuesRef = useRef({ scrollDistance: 0, scrollDuration: 0 });
  const xPositionRef = useRef(0);
  const controls = useAnimation();

  const startInfiniteAnimation = () => {
    const { scrollDistance, scrollDuration } = animationValuesRef.current;
    controls.start({
      x: [0, -scrollDistance],
      transition: {
        x: {
          duration: scrollDuration,
          delay: ANIMATION_CONSTANTS.INITIAL_DELAY,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: ANIMATION_CONSTANTS.PAUSE_AFTER_SCROLL,
        },
      },
    });
  };

  // This effect is for measuring the element
  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const text = textRef.current;

      if (container && text) {
        const hasOverflow = text.scrollWidth > container.offsetWidth;
        setIsOverflowing(hasOverflow); // Fix is here

        if (hasOverflow) {
          const scrollDistance =
            text.scrollWidth -
            container.offsetWidth +
            ANIMATION_CONSTANTS.SCROLL_PADDING;
          const scrollDuration =
            scrollDistance * ANIMATION_CONSTANTS.SCROLL_SPEED_PER_PIXEL;

          animationValuesRef.current = { scrollDistance, scrollDuration };
        }
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [songName]); // Dependency array updated

  // This effect starts/stops the animation when overflow status changes
  useEffect(() => {
    if (isOverflowing) {
      startInfiniteAnimation();
    } else {
      controls.stop();
      controls.set({ x: 0 });
    }
  }, [isOverflowing, controls]);

  const handleMouseEnter = () => {
    controls.stop();
  };

  const handleMouseLeave = () => {
    const { scrollDistance, scrollDuration } = animationValuesRef.current;
    const currentX = xPositionRef.current;
    const targetX = -scrollDistance;
    const remainingDistance = Math.abs(targetX - currentX);
    const totalDistance = scrollDistance;
    const remainingDuration =
      (remainingDistance / totalDistance) * scrollDuration;

    const resumeAndLoop = async () => {
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

    if (isOverflowing) {
      resumeAndLoop();
    }
  };

  if (!songName) return null;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.h2
        ref={textRef}
        className="text-2xl font-semibold whitespace-nowrap cursor-text select-text"
        animate={controls}
        onUpdate={(latest) => {
          if (typeof latest.x === "number") {
            xPositionRef.current = latest.x;
          }
        }}
      >
        {songName}
      </motion.h2>
    </div>
  );
};

export default AnimatedSongName;
