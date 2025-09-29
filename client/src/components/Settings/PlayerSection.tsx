import { useAtomValue, useSetAtom } from "jotai";
import {
  playerIdAtom,
  remotePlayerWithStatusAtom,
  checkPlayerAvailabilityAtom,
} from "@/atoms/settingsAtoms";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useRef } from "react";

export const PlayerSection = () => {
  const currentPlayerId = useAtomValue(playerIdAtom);
  const remotePlayerStatus = useAtomValue(remotePlayerWithStatusAtom);
  const setPlayerId = useSetAtom(playerIdAtom);
  const checkAvailability = useSetAtom(checkPlayerAvailabilityAtom);
  const checkedPlayers = useRef(new Set<string>());

  const isRemotePlayer = currentPlayerId === "remote";

  // Check availability for remote player on mount and when needed
  useEffect(() => {
    // Only check if we have remote player status and haven't checked this player yet and it's not currently loading
    if (
      remotePlayerStatus &&
      !checkedPlayers.current.has("remote") &&
      !remotePlayerStatus?.isLoading
    ) {
      checkedPlayers.current.add("remote");
      checkAvailability("remote");
    }
  }, [checkAvailability, remotePlayerStatus]);

  const handleToggle = (enabled: boolean) => {
    setPlayerId(enabled ? "remote" : "local");
  };

  // Add defensive check for remotePlayerStatus
  if (!remotePlayerStatus) {
    return (
      <div className="space-y-4" data-testid="player-section">
        <h3 className="text-lg font-semibold text-white">Remote Player</h3>
        <div
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
          data-testid="remote-player-item"
        >
          <div className="flex items-center gap-3">
            <div data-testid="remote-player-status">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-white">Server</div>
              <div className="text-sm text-zinc-400">
                Connect to a remote server
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              data-testid="remote-player-toggle"
              checked={isRemotePlayer}
              onCheckedChange={handleToggle}
              disabled={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="player-section">
      <h3 className="text-lg font-semibold text-white">Remote Player</h3>
      <div
        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
        data-testid="remote-player-item"
      >
        <div className="flex items-center gap-3">
          <div data-testid="remote-player-status">
            {remotePlayerStatus?.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            ) : remotePlayerStatus?.isAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Circle className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-white">
              {remotePlayerStatus?.name || "Server"}
            </div>
            <div className="text-sm text-zinc-400">
              {remotePlayerStatus?.description || "Connect to a remote server"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            data-testid="remote-player-toggle"
            checked={isRemotePlayer}
            onCheckedChange={handleToggle}
            disabled={!remotePlayerStatus?.isAvailable}
          />
        </div>
      </div>
    </div>
  );
};
