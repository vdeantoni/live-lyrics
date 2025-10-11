import { useAtomValue } from "jotai";
import {
  coreAppStateAtom,
  settingsOpenAtom,
  searchOpenAtom,
  playlistsOpenAtom,
} from "@/atoms/appState";
import { isPlayerEmptyAtom } from "@/atoms/playerAtoms";
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

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl">
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
