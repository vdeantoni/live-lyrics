import { useAtomValue, useSetAtom } from "jotai";
import { isSettingsOpenAtom, toggleSettingsAtom } from "@/atoms/settingsAtoms";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import LyricsScreen from "./LyricsScreen";
import SettingsScreen from "./SettingsScreen";

const MainScreen = () => {
  const isSettingsOpen = useAtomValue(isSettingsOpenAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl">
      {/* Settings Button - Only visible when settings are closed */}
      {!isSettingsOpen && (
        <div className="absolute right-4 top-4 z-30">
          <Button
            data-testid="settings-button"
            size="sm"
            variant="ghost"
            className="h-10 w-10 rounded-full border border-white/10 bg-black/40 p-2 shadow-lg backdrop-blur-md hover:scale-105 hover:bg-black/60"
            onClick={toggleSettings}
            aria-label="Open settings"
          >
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Settings className="h-5 w-5 text-white/90" />
            </motion.div>
          </Button>
        </div>
      )}

      {/* Content Area - Switch between lyrics and settings */}
      <motion.div
        className="h-full w-full"
        key={isSettingsOpen ? "settings" : "lyrics"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isSettingsOpen ? <SettingsScreen /> : <LyricsScreen />}
      </motion.div>
    </div>
  );
};

export default MainScreen;
