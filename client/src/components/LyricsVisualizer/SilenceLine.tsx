import React from "react";
import { motion } from "framer-motion";
import SilenceIndicator from "./SilenceIndicator";

interface SilenceLineProps {
  index: number;
  time: number;
  duration: number;
  isActive: boolean;
  shouldShow: boolean;
  isEdgeBlock: boolean;
  isFirstBlock?: boolean;
  isLastBlock?: boolean;
}

/**
 * Renders an animated silence indicator line with entrance/exit animations
 */
const SilenceLine: React.FC<SilenceLineProps> = ({
  index,
  time,
  duration,
  isActive,
  shouldShow,
  isEdgeBlock,
  isFirstBlock = false,
  isLastBlock = false,
}) => {
  return (
    <motion.div
      key={`silence-${index}-${time}`}
      data-testid="silence-indicator-line"
      data-current={isActive ? "true" : "false"}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: shouldShow ? 1 : 0,
        scale: shouldShow ? 1 : 0.8,
      }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // iOS-style easing
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 },
      }}
      className={`${
        isActive
          ? "font-black [text-shadow:0_0_15px_#fff,0_0_30px_#fff,2px_2px_4px_rgba(0,0,0,0.8)]"
          : ""
      }`}
    >
      <div
        className={`transform transition-all duration-300 ${
          isFirstBlock ? "mt-8" : isLastBlock ? "mb-8" : "my-2"
        }`}
      >
        <SilenceIndicator
          isActive={isActive}
          startTime={time}
          duration={duration}
          isEdgeBlock={isEdgeBlock}
        />
      </div>
    </motion.div>
  );
};

export default SilenceLine;
