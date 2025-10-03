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
  /** Whether this is the first or last silence block (no bounce animation) */
  isEdgeBlock?: boolean;
}

/**
 * Animated indicator for instrumental breaks / moments of silence
 * Shows a pulsing musical note icon with a circular progress timer
 * Edge blocks (first/last) don't have bounce animation
 */
const SilenceIndicator: React.FC<SilenceIndicatorProps> = ({
  isActive = false,
  startTime,
  duration,
  isEdgeBlock = false,
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

  return (
    <div
      data-testid="silence-indicator"
      className={`flex items-center justify-center transition-all duration-300 ${
        isActive
          ? "opacity-100 [filter:drop-shadow(0_0_15px_#fff)_drop-shadow(0_0_30px_#fff)_drop-shadow(2px_2px_4px_rgba(0,0,0,0.8))]"
          : "opacity-30"
      }`}
    >
      <motion.div
        animate={
          isEdgeBlock
            ? {
                // No bounce for edge blocks, just fade
                opacity: isActive ? [0.9, 1, 0.9] : [0.5, 0.7, 0.5],
              }
            : {
                // Normal bounce animation for middle blocks
                scale: isActive ? [1, 1.3, 1] : [1, 1.2, 1],
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
            className="-rotate-90 transform"
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
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              className={`transition-all duration-300 ${isActive ? "text-white/90" : "text-white/40"}`}
              strokeLinecap="round"
            />
          </svg>
          {displayTime >= 5 && (
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
          {isActive && displayTime < 5 && (
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
