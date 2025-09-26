import { AspectRatio } from "@/components/ui/aspect-ratio";
import LyricsViewport from "./LyricsViewport";
import LyricsContainer from "./LyricsContainer";
import Player from "./Player";

const LyricsVisualizer = () => {
  return (
    <AspectRatio
      ratio={0.95}
      className="flex flex-col w-[80%] max-w-[800px] bg-zinc-800 rounded-2xl shadow-xl p-6 gap-4"
    >
      <LyricsViewport>
        <LyricsContainer />
      </LyricsViewport>
      <Player />
    </AspectRatio>
  );
};

export default LyricsVisualizer;
