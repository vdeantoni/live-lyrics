import LyricsViewport from "./LyricsViewport";
import LyricsContainer from "./LyricsContainer";
import Player from "./Player";

const LyricsVisualizer = () => {
  return (
    <div className="flex flex-col w-full h-full bg-zinc-800 rounded-2xl shadow-xl p-6 gap-4 mx-auto">
      <LyricsViewport>
        <LyricsContainer />
      </LyricsViewport>
      <Player />
    </div>
  );
};

export default LyricsVisualizer;
