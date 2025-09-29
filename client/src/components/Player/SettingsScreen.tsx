import { useAtomValue, useSetAtom } from "jotai";
import {
  playerIdAtom,
  lyricsProviderIdAtom,
  artworkProviderIdAtom,
  lyricsProvidersWithStatusAtom,
  artworkProvidersWithStatusAtom,
} from "@/atoms/settingsAtoms";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense } from "react";

interface ProviderStatus {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
}

const ProviderSection = ({
  title,
  providers,
  currentId,
  onSelect,
}: {
  title: string;
  providers: ProviderStatus[];
  currentId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <div className="space-y-2">
      {providers.map((provider) => (
        <motion.div
          key={provider.id}
          className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
            provider.id === currentId
              ? "border-blue-500/50 bg-blue-500/10"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            {provider.isAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Circle className="h-5 w-5 text-red-400" />
            )}
            <div>
              <div className="font-medium text-white">{provider.name}</div>
              <div className="text-sm text-zinc-400">
                {provider.description}
              </div>
            </div>
          </div>
          <Button
            data-testid="provider-status-button"
            data-provider={provider.id}
            data-status={provider.id === currentId ? "active" : "available"}
            size="sm"
            variant={provider.id === currentId ? "default" : "outline"}
            disabled={!provider.isAvailable}
            onClick={() => onSelect(provider.id)}
          >
            {provider.id === currentId ? "Active" : "Select"}
          </Button>
        </motion.div>
      ))}
    </div>
  </div>
);

const LyricsProviderSection = () => {
  const currentLyricsProviderId = useAtomValue(lyricsProviderIdAtom);
  const setLyricsProviderId = useSetAtom(lyricsProviderIdAtom);
  const lyricsProviders = useAtomValue(lyricsProvidersWithStatusAtom);

  return (
    <ProviderSection
      title="Lyrics Provider"
      providers={lyricsProviders}
      currentId={currentLyricsProviderId}
      onSelect={setLyricsProviderId}
    />
  );
};

const ArtworkProviderSection = () => {
  const currentArtworkProviderId = useAtomValue(artworkProviderIdAtom);
  const setArtworkProviderId = useSetAtom(artworkProviderIdAtom);
  const artworkProviders = useAtomValue(artworkProvidersWithStatusAtom);

  return (
    <ProviderSection
      title="Artwork Provider"
      providers={artworkProviders}
      currentId={currentArtworkProviderId}
      onSelect={setArtworkProviderId}
    />
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    <div className="h-6 w-32 animate-pulse rounded bg-white/10"></div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5"></div>
      ))}
    </div>
  </div>
);

const SettingsScreen = () => {
  const currentPlayerId = useAtomValue(playerIdAtom);
  const setPlayerId = useSetAtom(playerIdAtom);

  const isRemotePlayer = currentPlayerId === "remote";

  const handlePlayerToggle = (checked: boolean) => {
    setPlayerId(checked ? "remote" : "local");
  };

  return (
    <div
      data-testid="settings-screen"
      className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900/95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-zinc-400">Configure your music player</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="h-full overflow-y-auto p-6 pb-20">
        <div className="space-y-8">
          {/* Music Player Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Music Player</h3>
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
                checked={isRemotePlayer}
                onCheckedChange={handlePlayerToggle}
              />
            </div>
          </div>

          {/* Lyrics Provider Section */}
          <Suspense fallback={<LoadingSkeleton />}>
            <LyricsProviderSection />
          </Suspense>

          {/* Artwork Provider Section */}
          <Suspense fallback={<LoadingSkeleton />}>
            <ArtworkProviderSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
