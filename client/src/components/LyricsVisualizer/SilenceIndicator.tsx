import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { useAtomValue } from "jotai";
import { playerStateAtom } from "@/atoms/playerAtoms";

interface SilenceIndicatorProps {
  /** Whether the silence line is currently active */
  isActive?: boolean;
  /** Start time of the silence period in seconds */
  startTime: number;
  /** Duration of the silence period in seconds */
  duration: number;
  /** Type of silence block: first (fade in), middle (animated), last (fade out) */
  blockType?: "first" | "middle" | "last";
}

/**
 * Animated indicator for instrumental breaks / moments of silence
 * Shows a pulsing musical note icon with a circular progress timer
 * First block fades in, middle blocks animate, last block fades out
 */
const SilenceIndicator: React.FC<SilenceIndicatorProps> = ({
  isActive = false,
  startTime,
  duration,
  blockType = "middle",
}) => {
  const playerState = useAtomValue(playerStateAtom);
  const [progress, setProgress] = useState(0);

  // Calculate progress based on current playback time
  useEffect(() => {
    if (!isActive || !playerState?.currentTime) {
      setProgress(0);
      return;
    }

    const elapsed = playerState.currentTime - startTime;
    const progressPercent = Math.min(
      Math.max((elapsed / duration) * 100, 0),
      100,
    );
    setProgress(progressPercent);
  }, [isActive, playerState?.currentTime, startTime, duration]);

  // Calculate remaining time
  const remainingTime =
    duration -
    (playerState?.currentTime ? playerState.currentTime - startTime : 0);
  const displayTime = Math.max(Math.ceil(remainingTime), 0);

  // Easing function for smooth fade in/out (ease-in-out cubic)
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Calculate opacity based on block type and progress
  const fadeOpacity = isActive
    ? blockType === "first"
      ? (() => {
          // First block: fade in over duration, then fade out over last 1s
          const elapsed = (progress / 100) * duration;
          const FADE_OUT_DURATION = 1; // 1 second

          if (elapsed > duration - FADE_OUT_DURATION) {
            // Fade out during last second
            const t = (duration - elapsed) / FADE_OUT_DURATION;
            return Math.min(progress / 100, 1) * easeInOutCubic(t);
          } else {
            // Normal fade in
            return Math.min(progress / 100, 1);
          }
        })()
      : blockType === "last"
        ? (() => {
            // Last block: fade in over first 1s, then fade out over remaining duration
            const elapsed = (progress / 100) * duration;
            const FADE_IN_DURATION = 1; // 1 second

            if (elapsed < FADE_IN_DURATION) {
              // Fade in during first second
              const t = elapsed / FADE_IN_DURATION;
              return easeInOutCubic(t) * Math.max(1 - progress / 100, 0);
            } else {
              // Normal fade out
              return Math.max(1 - progress / 100, 0);
            }
          })()
        : (() => {
            // Middle blocks: fade in over 1s, full opacity, fade out over 1s
            const elapsed = (progress / 100) * duration;
            const FADE_DURATION = 1; // 1 second

            if (elapsed < FADE_DURATION) {
              // Fade in during first second
              const t = elapsed / FADE_DURATION;
              return easeInOutCubic(t);
            } else if (elapsed > duration - FADE_DURATION) {
              // Fade out during last second
              const t = (duration - elapsed) / FADE_DURATION;
              return easeInOutCubic(t);
            } else {
              // Full opacity in between
              return 1;
            }
          })()
    : 0.3;

  return (
    <div
      data-testid="silence-indicator"
      className={`flex items-center justify-center p-3 transition-all duration-300 ${
        isActive
          ? "[filter:drop-shadow(0_0_2px_#fff)_drop-shadow(0_0_10px_#fff)_drop-shadow(2px_2px_4px_rgba(0,0,0,0.8))]"
          : ""
      }`}
      style={{ opacity: fadeOpacity }}
    >
      <motion.div
        animate={
          blockType === "middle"
            ? {
                // Normal bounce animation for middle blocks
                scale: isActive ? [1, 1.3, 1] : [1, 1.2, 1],
                opacity: isActive ? [0.9, 1, 0.9] : [0.5, 0.7, 0.5],
              }
            : {
                // No bounce for first/last blocks, just subtle fade
                opacity: isActive ? [0.9, 1, 0.9] : [0.5, 0.7, 0.5],
              }
        }
        transition={{
          duration: isActive ? 1.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center gap-3"
      >
        {/* Circular progress background - responsive sizing with clamp */}
        <div
          className="relative"
          style={{
            width: "clamp(3rem, 8vw, 6rem)",
            height: "clamp(3rem, 8vw, 6rem)",
          }}
        >
          {/* Background circle */}
          <svg
            className={`transform ${blockType === "last" ? "rotate-90" : "-rotate-90"}`}
            style={{ width: "100%", height: "100%" }}
            viewBox="0 0 48 48"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={
                blockType === "last"
                  ? `${2 * Math.PI * 20 * (progress / 100)}` // Counter-clockwise: empties as progress increases
                  : `${2 * Math.PI * 20 * (1 - progress / 100)}` // Clockwise: fills as progress increases
              }
              className={`transition-all duration-300 ${isActive ? "text-white/90" : "text-white/40"}`}
              strokeLinecap="round"
            />
          </svg>
          {displayTime >= 6 && (
            <>
              {/* Music icon in center - responsive sizing */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Music
                  className={isActive ? "text-white/90" : "text-white/50"}
                  style={{
                    width: "clamp(1.25rem, 3vw, 3rem)",
                    height: "clamp(1.25rem, 3vw, 3rem)",
                  }}
                />
              </div>
            </>
          )}

          {/* Timer display - responsive sizing */}
          {isActive && displayTime < 6 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute inset-0 flex items-center justify-center font-medium text-white/70"
              style={{
                fontSize: "clamp(1rem, 3vw, 3rem)",
              }}
            >
              {displayTime}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SilenceIndicator;
