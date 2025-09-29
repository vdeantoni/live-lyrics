import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { ListMusic, Pause, Play, Search } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  currentTimeAtom,
  durationAtom,
  isPlayingAtom,
  songNameAtom,
  artistAtom,
  playAtom,
  pauseAtom,
  seekAtom,
  isDraggingAtom,
} from "@/atoms/playerAtoms";
import AnimatedSongName from "../LyricsVisualizer/AnimatedSongName";

const PlayerControls = () => {
  // Read atoms
  const currentTime = useAtomValue(currentTimeAtom);
  const duration = useAtomValue(durationAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const songName = useAtomValue(songNameAtom);
  const artist = useAtomValue(artistAtom);

  // Action atoms
  const play = useSetAtom(playAtom);
  const pause = useSetAtom(pauseAtom);
  const seek = useSetAtom(seekAtom);
  const setDragging = useSetAtom(isDraggingAtom);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSliderChange = ([time]: number[]) => {
    seek(time);
  };

  const handleSliderPointerDown = () => {
    setDragging(true);
  };

  const handleSliderPointerUp = () => {
    setDragging(false);
  };

  return (
    <div
      data-testid="player-controls"
      className="flex w-full flex-col gap-4 landscape:flex-row"
    >
      <div className="flex max-h-20 min-h-14 flex-col landscape:max-w-[30%]">
        <AnimatedSongName
          data-testid="song-name"
          className="flex-1"
          songName={songName}
        />
        <h3
          data-testid="artist-name"
          className="text-muted-foreground self-center"
        >
          {artist}
        </h3>
      </div>
      <div className="flex flex-1 items-center gap-3">
        <span
          id="current-time"
          data-testid="current-time"
          className="min-w-10 text-center text-sm"
        >
          {formatTime(currentTime)}
        </span>
        <Slider
          data-testid="progress-slider"
          value={[currentTime]}
          min={0}
          max={duration || 0}
          step={0.1}
          className="rounded-md bg-zinc-700"
          onValueChange={handleSliderChange}
          onPointerDown={handleSliderPointerDown}
          onPointerUp={handleSliderPointerUp}
        />
        <span
          id="total-duration"
          data-testid="duration"
          className="min-w-10 text-center text-sm"
        >
          {formatTime(duration)}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {/* Search Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-10 w-10 rounded-full p-2"
          aria-label="Search lyrics"
          onClick={() => console.log("Search clicked")}
        >
          <Search />
        </Button>

        <div className="flex flex-1 items-center justify-center">
          {/* Play/Pause Button - Centered */}
          <Button
            data-testid="play-pause-button"
            className="flex h-12 w-12 items-center justify-center rounded-full"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause data-testid="pause-icon" className="h-6 w-6" />
            ) : (
              <Play data-testid="play-icon" className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Playlists Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-10 w-10 rounded-full p-2"
          aria-label="View playlists"
          onClick={() => console.log("Playlists clicked")}
        >
          <ListMusic />
        </Button>
      </div>
    </div>
  );
};

export default PlayerControls;
