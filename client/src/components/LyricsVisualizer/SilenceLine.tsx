import React from "react";
import { motion } from "framer-motion";
import SilenceIndicator from "./SilenceIndicator";

interface SilenceLineProps {
  index: number;
  time: number;
  duration: number;
  isActive: boolean;
  isEdgeBlock: boolean;
  isFirstBlock?: boolean;
  isLastBlock?: boolean;
}

/**
 * Renders an animated silence indicator line with entrance/exit animations
 */
const SilenceLine: React.FC<SilenceLineProps> = ({
  time,
  duration,
  isActive,
  isEdgeBlock,
  isFirstBlock = false,
  isLastBlock = false,
}) => {
  return (
    <div
      data-testid="silence-indicator-line"
      data-current={isActive ? "true" : "false"}
      className={`${isFirstBlock ? "mt-8" : isLastBlock ? "mb-8" : ""}`}
    >
      <motion.div
        initial={isActive ? { opacity: 0, scale: 0.8 } : false}
        animate={{
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1 : 0.8,
        }}
        transition={{
          ease: [0.25, 0.1, 0.25, 1],
          opacity: {
            duration: isActive ? 0.4 : 0.2,
            delay: 0,
          },
          scale: {
            duration: isActive ? 0.4 : 0.2,
            delay: 0,
          },
        }}
        className={
          isActive
            ? "[0_0_10px_#fff,2px_2px_4px_rgba(0,0,0,0.8)] font-black"
            : ""
        }
      >
        <SilenceIndicator
          isActive={isActive}
          startTime={time}
          duration={duration}
          isEdgeBlock={isEdgeBlock}
        />
      </motion.div>
    </div>
  );
};

export default SilenceLine;
