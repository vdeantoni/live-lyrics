import { Music, Search } from "lucide-react";

interface NoLyricsFoundProps {
  songName?: string;
  artist?: string;
}

const NoLyricsFound = ({ songName, artist }: NoLyricsFoundProps) => {
  return (
    <div
      className="flex h-full min-h-96 flex-col items-center justify-center px-6 text-center"
      data-testid="no-lyrics"
    >
      <div className="relative mb-6">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-700/50">
          <Music className="h-12 w-12 text-zinc-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-600">
          <Search className="h-4 w-4 text-zinc-300" />
        </div>
      </div>

      <h3 className="mb-2 text-xl font-semibold text-zinc-200">
        No Lyrics Found
      </h3>

      {songName && artist ? (
        <p className="mb-4 max-w-md text-zinc-400">
          We couldn't find lyrics for "{songName}" by {artist}.
        </p>
      ) : (
        <p className="mb-4 max-w-md text-zinc-400">
          We couldn't find lyrics for this song.
        </p>
      )}

      <div className="space-y-1 text-sm text-zinc-500">
        <p>• Some songs may not be available in the selected provider</p>
      </div>
    </div>
  );
};

export default NoLyricsFound;
