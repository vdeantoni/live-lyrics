import { useAtomValue, useSetAtom } from "jotai";
import {
  coreAppStateAtom,
  settingsOpenAtom,
  searchOpenAtom,
  toggleSettingsAtom,
  toggleSearchAtom,
} from "@/atoms/appState";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import LyricsScreen from "./LyricsScreen";
import SettingsScreen from "./SettingsScreen";
import SearchScreen from "./SearchScreen";
import LoadingScreen from "./LoadingScreen";

const MainScreen = () => {
  const isSettingsOpen = useAtomValue(settingsOpenAtom);
  const isSearchOpen = useAtomValue(searchOpenAtom);
  const appState = useAtomValue(coreAppStateAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);
  const toggleSearch = useSetAtom(toggleSearchAtom);

  // Determine if any overlay is open
  const isOverlayOpen = isSettingsOpen || isSearchOpen;

  // Handle close/settings button click
  const handleButtonClick = () => {
    if (isSearchOpen) {
      toggleSearch();
    } else if (isSettingsOpen) {
      toggleSettings();
    } else {
      toggleSettings();
    }
  };

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl">
      {/* Settings/Close Button - Always visible */}
      <div className="absolute right-4 top-4 z-40">
        <Button
          data-testid={
            isOverlayOpen ? "close-overlay-button" : "settings-button"
          }
          size="sm"
          variant="ghost"
          className="h-10 w-10 rounded-full border border-white/10 bg-black/40 p-2 shadow-lg backdrop-blur-md hover:scale-105 hover:bg-black/60"
          onClick={handleButtonClick}
          aria-label={
            isSearchOpen
              ? "Close search"
              : isSettingsOpen
                ? "Close settings"
                : "Open settings"
          }
        >
          <motion.div
            key={isOverlayOpen ? "close" : "settings"}
            initial={{ rotate: 0, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isOverlayOpen ? (
              <X className="h-5 w-5 text-white/90" />
            ) : (
              <Settings className="h-5 w-5 text-white/90" />
            )}
          </motion.div>
        </Button>
      </div>

      {/* Lyrics Screen - Shows when app is ready */}
      <AnimatePresence>
        {appState.isReady && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <LyricsScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Screen - Shows only when loading AND not ready */}
      <AnimatePresence>
        {appState.isLoading && !appState.isReady && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Screen - Slides from bottom */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="absolute inset-0 z-20"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <SearchScreen />
          </motion.div>
        )}
      </AnimatePresence>

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
