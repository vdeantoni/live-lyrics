import { useAtomValue, useSetAtom } from "jotai";
import { playerIdAtom } from "@/atoms/settingsAtoms";
import { Switch } from "@/components/ui/switch";

export const PlayerSection = () => {
  const currentPlayerId = useAtomValue(playerIdAtom);
  const setPlayerId = useSetAtom(playerIdAtom);

  const isRemotePlayer = currentPlayerId === "remote";

  const handlePlayerToggle = (checked: boolean) => {
    setPlayerId(checked ? "remote" : "local");
  };

  return (
    <div className="space-y-4" data-testid="music-player-section">
      <h3 className="text-lg font-semibold text-white">Player</h3>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
        <div>
          <div className="font-medium text-white">
            {isRemotePlayer ? "Remote" : "Local"}
          </div>
          <div className="text-sm text-zinc-400">
            {isRemotePlayer ? "Remote player" : "Local player"}
          </div>
        </div>
        <Switch
          id="player-toggle"
          data-testid="music-player-toggle"
          checked={isRemotePlayer}
          onCheckedChange={handlePlayerToggle}
        />
      </div>
    </div>
  );
};
