import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { selectedPlayerAtom, effectivePlayersAtom } from "@/atoms/appState";
import { CheckCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/adapters/react";
import type { PlayerSettings } from "@/types";

export const PlayerSection = () => {
  const selectedPlayer = useAtomValue(selectedPlayerAtom);
  const playerSources = useAtomValue(effectivePlayersAtom) || [];
  const settings = useSettings();

  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>({
    playOnAdd: false,
    timeOffsetInMs: 0,
  });

  const currentPlayerId = selectedPlayer?.config.id || "local";

  // Load player settings when currentPlayerId changes
  useEffect(() => {
    const loadedSettings = settings.getPlayerSettings(currentPlayerId);
    setPlayerSettings(loadedSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerId]);

  // Find the remote player from the registry
  const remotePlayerEntry = playerSources.find(
    (entry) => entry.config.id === "remote",
  );
  const isRemotePlayer = currentPlayerId === "remote";

  const handlePlayOnAddChange = (checked: boolean) => {
    settings.setPlayerSettings(currentPlayerId, { playOnAdd: checked });
    setPlayerSettings((prev) => ({ ...prev, playOnAdd: checked }));
  };

  const handleTimeOffsetChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    settings.setPlayerSettings(currentPlayerId, { timeOffsetInMs: numValue });
    setPlayerSettings((prev) => ({ ...prev, timeOffsetInMs: numValue }));
  };

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

        {/* Player Settings for the selected player */}
        {selectedPlayer && (
          <div className="mt-4 space-y-4 rounded-lg border border-white/5 bg-black/20 p-4">
            <h4 className="text-sm font-medium text-white">Player Settings</h4>

            {/* Auto-play Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Auto-play</div>
                <div className="text-xs text-zinc-400">
                  Start playing when adding songs
                </div>
              </div>
              <Switch
                checked={playerSettings.playOnAdd}
                onCheckedChange={handlePlayOnAddChange}
              />
            </div>

            {/* Time Offset Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Time Offset (ms)
              </label>
              <div className="text-xs text-zinc-400">
                Adjust lyrics sync (negative = earlier)
              </div>
              <Input
                type="number"
                value={playerSettings.timeOffsetInMs}
                onChange={(e) => handleTimeOffsetChange(e.target.value)}
                className="border-white/10 bg-zinc-800/50"
              />
            </div>
          </div>
        )}
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

      {/* Player Settings for the selected player */}
      {selectedPlayer && (
        <div className="mt-4 space-y-4 rounded-lg border border-white/5 bg-black/20 p-4">
          <h4 className="text-sm font-medium text-white">Player Settings</h4>

          {/* Auto-play Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Auto-play</div>
              <div className="text-xs text-zinc-400">
                Start playing when adding songs
              </div>
            </div>
            <Switch
              checked={playerSettings.playOnAdd}
              onCheckedChange={handlePlayOnAddChange}
            />
          </div>

          {/* Time Offset Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Time Offset (ms)
            </label>
            <div className="text-xs text-zinc-400">
              Adjust lyrics sync (negative = earlier)
            </div>
            <Input
              type="number"
              value={playerSettings.timeOffsetInMs}
              onChange={(e) => handleTimeOffsetChange(e.target.value)}
              className="border-white/10 bg-zinc-800/50"
            />
          </div>
        </div>
      )}
    </div>
  );
};
