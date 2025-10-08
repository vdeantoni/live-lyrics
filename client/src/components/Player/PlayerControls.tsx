import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import {
  ListMusic,
  ListPlus,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { playerStateAtom } from "@/atoms/playerAtoms";
import {
  toggleSearchAtom,
  searchOpenAtom,
  togglePlaylistsAtom,
  playlistsOpenAtom,
  openAddToPlaylistDialogAtom,
} from "@/atoms/appState";
import AutoScrollingText from "../LyricsVisualizer/AutoScrollingText";
import { motion } from "framer-motion";
import { usePlayerControls } from "@/adapters/react";
import SongProgressSlider from "./SongProgressSlider";
import { currentArtworkUrlAtom } from "../../atoms/playerAtoms";

const PlayerControls = () => {
  // Read unified atoms
  const playerState = useAtomValue(playerStateAtom);
  const { currentTime, duration, isPlaying, name, album, artist } = playerState;
  const isSearchOpen = useAtomValue(searchOpenAtom);
  const isPlaylistsOpen = useAtomValue(playlistsOpenAtom);

  // Player controls (event-driven)
  const { play, pause, next, previous } = usePlayerControls();

  // Action atoms
  const toggleSearch = useSetAtom(toggleSearchAtom);
  const togglePlaylists = useSetAtom(togglePlaylistsAtom);
  const openAddToPlaylistDialog = useSetAtom(openAddToPlaylistDialogAtom);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const currentArtworkUrl = useAtomValue(currentArtworkUrlAtom);

  return (
    <div data-testid="player-controls" className="flex flex-col gap-2">
      <div className="flex w-full flex-col gap-2 landscape:flex-row landscape:px-2">
        <div className="flex min-h-14 flex-1 justify-center gap-4 landscape:max-w-[calc(50%-5rem)]">
          <div
            className="aspect-square h-14 w-14 border"
            style={{
              backgroundImage: currentArtworkUrl
                ? `url(${currentArtworkUrl})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="min-h-14 flex-1 overflow-scroll text-left landscape:text-left">
            <AutoScrollingText
              data-testid="song-name"
              className="text-2xl font-semibold"
              text={name}
            />
            <AutoScrollingText
              data-testid="artist-name"
              className="text-muted-foreground text-md"
              text={artist + " " + album}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 landscape:flex-row">
          <div className="flex flex-1 items-center justify-center gap-3 landscape:w-10 landscape:justify-start">
            {/* Previous Button */}
            <Button
              data-testid="previous-button"
              size="sm"
              variant="ghost"
              className="dark:hover:bg-accent/0 hover:text-primary h-10 w-10 rounded-full p-2"
              aria-label="Previous song"
              onClick={previous}
              disabled={!name}
            >
              <motion.div
                whileTap={{
                  scale: [1, 0.85, 1],
                  rotate: [-5, 5, 0],
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                <SkipBack data-testid="previous-icon" className="h-6 w-6" />
              </motion.div>
            </Button>

            {/* Play/Pause Button - Centered */}
            <Button
              data-testid="play-pause-button"
              className="flex h-12 w-12 items-center justify-center rounded-full"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={!name}
            >
              {isPlaying ? (
                <Pause data-testid="pause-icon" className="h-6 w-6" />
              ) : (
                <Play data-testid="play-icon" className="h-6 w-6" />
              )}
            </Button>

            {/* Next Button */}
            <Button
              data-testid="next-button"
              size="sm"
              variant="ghost"
              className="dark:hover:bg-accent/0 hover:text-primary h-10 w-10 rounded-full p-2"
              aria-label="Next song"
              onClick={next}
              disabled={!name}
            >
              <motion.div
                whileTap={{
                  scale: [1, 0.85, 1],
                  rotate: [5, -5, 0],
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                <SkipForward data-testid="next-icon" className="h-6 w-6" />
              </motion.div>
            </Button>
          </div>

          <div className="absolute right-4 flex flex-1 items-center justify-end landscape:max-w-[calc(50%-5rem)]">
            {/* Add to Playlist Button */}
            <Button
              size="sm"
              variant="ghost"
              className="dark:hover:bg-accent/0 hover:text-primary h-10 w-10 rounded-full p-2"
              aria-label="Add to playlist"
              onClick={() => openAddToPlaylistDialog(playerState)}
              disabled={!playerState.name}
            >
              <ListPlus />
            </Button>

            {/* Playlists Button */}
            <Button
              data-testid="playlists-button"
              size="sm"
              variant="ghost"
              className={`dark:hover:bg-accent/0 hover:text-primary h-10 w-10 rounded-full p-2 transition-colors ${
                isPlaylistsOpen ? "text-primary" : ""
              }`}
              aria-label="View playlists"
              onClick={togglePlaylists}
            >
              <motion.div
                animate={{
                  scale: isPlaylistsOpen ? [1, 1.2, 1] : 1,
                  rotate: isPlaylistsOpen ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              >
                <ListMusic />
              </motion.div>
            </Button>

            {/* Search Button */}
            <Button
              data-testid="search-button"
              size="sm"
              variant="ghost"
              className={`dark:hover:bg-accent/0 hover:text-primary h-10 w-10 transform rounded-full p-2 transition-colors ${
                isSearchOpen ? "text-primary" : ""
              }`}
              aria-label="Search lyrics"
              onClick={toggleSearch}
            >
              <motion.div
                animate={{
                  scale: isSearchOpen ? [1, 1.2, 1] : 1,
                  rotate: isSearchOpen ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
              >
                <Search />
              </motion.div>
            </Button>
          </div>
        </div>
        <div className="flex hidden flex-1 landscape:visible">&nbsp;</div>
      </div>
      <div className="flex flex-1 items-center gap-1">
        <span
          id="current-time"
          data-testid="current-time"
          className="text-muted-foreground min-w-10 text-center text-xs"
        >
          {formatTime(currentTime)}
        </span>
        <SongProgressSlider />
        <span
          id="total-duration"
          data-testid="total-time"
          className="text-muted-foreground min-w-10 text-center text-xs"
        >
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default PlayerControls;
