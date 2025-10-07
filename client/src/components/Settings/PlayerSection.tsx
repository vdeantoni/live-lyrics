import { useAtomValue } from "jotai";
import { selectedPlayerAtom, effectivePlayersAtom } from "@/atoms/appState";
import { CheckCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/adapters/react";

export const PlayerSection = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerSources = useAtomValue(effectivePlayersAtom) || [];
  const settings = useSettings();

  const currentPlayerId = selectedPlayer?.config.id || "local";

  // Find the remote player from the registry
  const remotePlayerEntry = playerSources.find(
    (entry) => entry.config.id === "remote",
  );
  const isRemotePlayer = currentPlayerId === "remote";

  const handleToggle = (enabled: boolean) => {
    // Toggle between local and remote players with explicit state setting
    if (enabled) {
      // Enable remote, disable local
      settings.setProviderEnabled("players", "remote", true);
      settings.setProviderEnabled("players", "local", false);
    } else {
      // Enable local, disable remote
      settings.setProviderEnabled("players", "local", true);
      settings.setProviderEnabled("players", "remote", false);
    }
  };

  // Add defensive check for remotePlayerEntry
  if (!remotePlayerEntry) {
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
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <div className="font-medium text-white">
              {remotePlayerEntry.config.name}
            </div>
            <div className="text-sm text-zinc-400">
              {remotePlayerEntry.config.description}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            data-testid="remote-player-toggle"
            checked={isRemotePlayer}
            onCheckedChange={handleToggle}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
};
