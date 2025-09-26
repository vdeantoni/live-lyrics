import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useSong } from "@/lib/api";
import { formatTime } from "@/lib/utils";

const Player = () => {
  const { data: song } = useSong();

  return (
    <div className="flex flex-col landscape:flex-row w-full gap-4">
      <div className="flex flex-col items-center min-h-14">
        <h2 className="text-2xl font-semibold">{song?.name}</h2>
        <h3 className="text-muted-foreground">{song?.artist}</h3>
      </div>
      <div className="flex flex-1 items-center gap-3">
        <span id="current-time" className="text-sm min-w-10 text-center">
          {formatTime(song?.currentTime)}
        </span>
        <Slider
          value={[song?.currentTime || 0]}
          min={0}
          max={song?.duration}
          step={0.1}
          className=" bg-zinc-700 rounded-md"
        />
        <span id="total-duration" className="text-sm min-w-10 text-center">
          {formatTime(song?.duration)}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <Button className="rounded-full py-7 text-3xl">
          {song?.isPlaying ? "❚❚" : "▶"}
        </Button>
      </div>
    </div>
  );
};

export default Player;
