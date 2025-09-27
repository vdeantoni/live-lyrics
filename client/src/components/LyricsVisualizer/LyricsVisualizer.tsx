import LyricsDisplay from "./LyricsDisplay";
import LyricsProvider from "./LyricsProvider";
import Player from "./Player";
import SourceSwitcher from "../SourceSwitcher";
import { useSongSync } from "@/hooks/useSongSync";

const LyricsVisualizer = () => {
  // Sync with current music source data - only called once at the top level
  useSongSync();

  return (
    <div className="flex flex-col w-full h-full bg-zinc-800 rounded-2xl shadow-xl p-6 gap-4 mx-auto">
      <LyricsDisplay>
        {/* Floating source switcher overlay */}
        <div className="absolute top-4 right-4 z-20">
          <SourceSwitcher />
        </div>
        <LyricsProvider />
      </LyricsDisplay>
      <Player />
    </div>
  );
};

export default LyricsVisualizer;
