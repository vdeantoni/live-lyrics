import { Music, Search } from "lucide-react";

interface NoLyricsFoundProps {
  songName?: string;
  artist?: string;
}

const NoLyricsFound = ({ songName, artist }: NoLyricsFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 text-center px-6">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-zinc-700/50 rounded-full flex items-center justify-center mb-4">
          <Music className="w-12 h-12 text-zinc-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center">
          <Search className="w-4 h-4 text-zinc-300" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-zinc-200 mb-2">
        No Lyrics Found
      </h3>

      {songName && artist ? (
        <p className="text-zinc-400 mb-4 max-w-md">
          We couldn't find lyrics for "{songName}" by {artist}.
        </p>
      ) : (
        <p className="text-zinc-400 mb-4 max-w-md">
          We couldn't find lyrics for this song.
        </p>
      )}

      <div className="text-sm text-zinc-500 space-y-1">
        <p>• Try switching to Simulated Player for demo lyrics</p>
        <p>• Check if your local server has a /lyrics endpoint</p>
        <p>• Some songs may not be available in our lyrics database</p>
      </div>
    </div>
  );
};

export default NoLyricsFound;