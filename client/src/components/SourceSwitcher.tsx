import { useAtomValue, useSetAtom } from "jotai";
import {
  availableSources,
  currentSourceConfigAtom,
  switchSourceAtom,
} from "@/atoms/sourceAtoms";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const SourceSwitcher = () => {
  const currentConfig = useAtomValue(currentSourceConfigAtom);
  const switchSource = useSetAtom(switchSourceAtom);
  const [isHovered, setIsHovered] = useState(false);

  const isServerMode = currentConfig.type === "http";

  const handleToggle = (checked: boolean) => {
    // checked = true means Server mode (http)
    // checked = false means Player mode (simulated) - default
    const targetSource = availableSources.find((source) =>
      checked ? source.type === "http" : source.type === "simulated",
    );
    if (targetSource) {
      switchSource(targetSource);
    }
  };

  return (
    <motion.div
      className="flex items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-lg cursor-pointer overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        scale: 1.05,
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      <Switch
        id="server-mode"
        checked={isServerMode}
        onCheckedChange={handleToggle}
      />

      <AnimatePresence>
        {isHovered && (
          <motion.label
            htmlFor="server-mode"
            className="text-sm font-medium text-white/90 cursor-pointer select-none whitespace-nowrap ml-3"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: "auto", marginLeft: 12 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            Server Mode
          </motion.label>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SourceSwitcher;
