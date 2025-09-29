import { useAtomValue, useSetAtom } from "jotai";
import { isSettingsOpenAtom, toggleSettingsAtom } from "@/atoms/settingsAtoms";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import LyricsScreen from "./LyricsScreen";
import SettingsScreen from "./SettingsScreen";

const MainScreen = () => {
  const isSettingsOpen = useAtomValue(isSettingsOpenAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl">
      {/* Settings/Close Button - Always visible */}
      <div className="absolute right-4 top-4 z-40">
        <Button
          data-testid={
            isSettingsOpen ? "close-settings-button" : "settings-button"
          }
          size="sm"
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-black/40 p-2 shadow-lg backdrop-blur-md hover:scale-105 hover:bg-black/60"
          onClick={toggleSettings}
          aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
        >
          <motion.div
            key={isSettingsOpen ? "close" : "settings"}
            initial={{ rotate: 0, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isSettingsOpen ? (
              <X className="h-5 w-5 text-white/90" />
            ) : (
              <Settings className="h-5 w-5 text-white/90" />
            )}
          </motion.div>
        </Button>
      </div>

      {/* Lyrics Screen - Always visible, stays in place */}
      <LyricsScreen />

      {/* Settings Screen - Slides from bottom */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            className="absolute inset-0 z-30"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <SettingsScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainScreen;
