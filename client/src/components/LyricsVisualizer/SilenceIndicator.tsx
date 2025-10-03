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
}

/**
 * Animated indicator for instrumental breaks / moments of silence
 * Shows a pulsing musical note icon with a circular progress timer
 */
const SilenceIndicator: React.FC<SilenceIndicatorProps> = ({
  isActive = false,
  startTime,
  duration,
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
      className={`my-3 flex items-center justify-center py-2.5 transition-opacity duration-300 ${
        isActive ? "opacity-80" : "opacity-30"
      }`}
    >
      <motion.div
        animate={{
          scale: isActive ? [1, 1.3, 1] : [1, 1.2, 1],
          opacity: isActive ? [0.8, 1, 0.8] : [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: isActive ? 1.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center gap-3"
      >
        {/* Circular progress background */}
        <div className="relative h-16 w-16">
          {/* Background circle */}
          <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-white/20"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              className={`transition-all duration-300 ${isActive ? "text-white/80" : "text-white/40"}`}
              strokeLinecap="round"
            />
          </svg>
          {displayTime >= 5 && (
            <>
              {/* Music icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Music
                  className={`h-6 w-6 ${isActive ? "text-white/80" : "text-white/50"}`}
                />
              </div>
            </>
          )}

          {/* Timer display */}
          {isActive && displayTime < 5 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute inset-0 flex items-center justify-center text-3xl font-medium text-white/70"
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
