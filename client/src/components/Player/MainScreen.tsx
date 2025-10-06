import { useAtomValue, useSetAtom } from "jotai";
import {
  coreAppStateAtom,
  settingsOpenAtom,
  searchOpenAtom,
  playlistsOpenAtom,
  toggleSettingsAtom,
  toggleSearchAtom,
  togglePlaylistsAtom,
} from "@/atoms/appState";
import { isPlayerEmptyAtom } from "@/atoms/playerAtoms";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import LyricsScreen from "./LyricsScreen";
import SettingsScreen from "./SettingsScreen";
import SearchScreen from "./SearchScreen";
import PlaylistsScreen from "./PlaylistsScreen";
import LoadingScreen from "./LoadingScreen";
import EmptyScreen from "./EmptyScreen";
import AddToPlaylistDialog from "../Playlists/AddToPlaylistDialog";

const MainScreen = () => {
  const isSettingsOpen = useAtomValue(settingsOpenAtom);
  const isSearchOpen = useAtomValue(searchOpenAtom);
  const isPlaylistsOpen = useAtomValue(playlistsOpenAtom);
  const appState = useAtomValue(coreAppStateAtom);
  const isPlayerEmpty = useAtomValue(isPlayerEmptyAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);
  const toggleSearch = useSetAtom(toggleSearchAtom);
  const togglePlaylists = useSetAtom(togglePlaylistsAtom);

  // Determine if any overlay is open
  const isOverlayOpen = isSettingsOpen || isSearchOpen || isPlaylistsOpen;

  // Handle close/settings button click
  const handleButtonClick = () => {
    if (isSearchOpen) {
      toggleSearch();
    } else if (isPlaylistsOpen) {
      togglePlaylists();
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
              : isPlaylistsOpen
                ? "Close playlists"
                : isSettingsOpen
                  ? "Close settings"
                  : "Open settings"
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={
                isSearchOpen
                  ? "close-search"
                  : isPlaylistsOpen
                    ? "close-playlists"
                    : isSettingsOpen
                      ? "close-settings"
                      : "settings"
              }
              initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ pointerEvents: "none" }}
            >
              {isOverlayOpen ? (
                <X className="h-5 w-5 text-white/90" />
              ) : (
                <Settings className="h-5 w-5 text-white/90" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>

      {/* Main Content Area - Shows when app is ready */}
      <AnimatePresence>
        {appState.isReady && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {/* Show EmptyScreen or LyricsScreen based on player state */}
            {isPlayerEmpty ? <EmptyScreen /> : <LyricsScreen />}
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

      {/* Overlays - Single AnimatePresence with mode="wait" ensures one exits before next enters */}
      <AnimatePresence mode="wait">
        {isSearchOpen && (
          <motion.div
            key="search"
            className="absolute inset-0 z-20"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <SearchScreen />
          </motion.div>
        )}
        {isPlaylistsOpen && (
          <motion.div
            key="playlists"
            className="absolute inset-0 z-20"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <PlaylistsScreen />
          </motion.div>
        )}
        {isSettingsOpen && (
          <motion.div
            key="settings"
            className="absolute inset-0 z-20"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <SettingsScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Playlist Dialog - Modal on top of everything */}
      <AddToPlaylistDialog />
    </div>
  );
};

export default MainScreen;
