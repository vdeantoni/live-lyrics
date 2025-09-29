import { useAtomValue, useSetAtom } from "jotai";
import {
  modeIdAtom,
  lyricsProviderIdAtom,
  artworkProviderIdAtom,
  toggleSettingsAtom,
} from "@/atoms/settingsAtoms";
// import { musicModeRegistry } from "@/registries/musicModeRegistry";
import { lyricsProviderRegistry } from "@/registries/lyricsProviderRegistry";
import { artworkProviderRegistry } from "@/registries/artworkProviderRegistry";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, Circle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ProviderStatus {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
}

const SettingsScreen = () => {
  const currentModeId = useAtomValue(modeIdAtom);
  const currentLyricsProviderId = useAtomValue(lyricsProviderIdAtom);
  const currentArtworkProviderId = useAtomValue(artworkProviderIdAtom);

  const setModeId = useSetAtom(modeIdAtom);
  const setLyricsProviderId = useSetAtom(lyricsProviderIdAtom);
  const setArtworkProviderId = useSetAtom(artworkProviderIdAtom);
  const toggleSettings = useSetAtom(toggleSettingsAtom);

  const [lyricsProviders, setLyricsProviders] = useState<ProviderStatus[]>([]);
  const [artworkProviders, setArtworkProviders] = useState<ProviderStatus[]>(
    [],
  );
  // const [modesStatus, setModesStatus] = useState<ProviderStatus[]>([]); // Future use for mode availability checking

  // Get available options from registries and check their availability
  useEffect(() => {
    const checkProviderStatus = async () => {
      // Check lyrics providers
      const lyricsProviderEntries = lyricsProviderRegistry.getAll();
      const lyricsStatus = await Promise.all(
        lyricsProviderEntries.map(async (entry) => {
          const provider = entry.factory();
          const isAvailable = await provider.isAvailable();
          return {
            id: entry.id,
            name: entry.name,
            description: entry.description,
            isAvailable,
          };
        }),
      );
      setLyricsProviders(lyricsStatus);

      // Check artwork providers
      const artworkProviderEntries = artworkProviderRegistry.getAll();
      const artworkStatus = await Promise.all(
        artworkProviderEntries.map(async (entry) => {
          const provider = entry.factory();
          const isAvailable = await provider.isAvailable();
          return {
            id: entry.id,
            name: entry.name,
            description: entry.description,
            isAvailable,
          };
        }),
      );
      setArtworkProviders(artworkStatus);

      // Check music modes (future enhancement)
      // const modeEntries = musicModeRegistry.getAll();
      // const modeStatus = await Promise.all(
      //   modeEntries.map(async (entry) => {
      //     const mode = entry.factory();
      //     const isAvailable = await mode.isAvailable();
      //     return {
      //       id: entry.id,
      //       name: entry.name,
      //       description: entry.description,
      //       isAvailable,
      //     };
      //   })
      // );
      // setModesStatus(modeStatus);
    };

    checkProviderStatus();
  }, []);

  const isRemoteMode = currentModeId === "remote";

  const handleModeToggle = (checked: boolean) => {
    setModeId(checked ? "remote" : "local");
  };

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

  return (
    <div
      data-testid="settings-screen"
      className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900/95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-zinc-400">Configure your music player</p>
        </div>
        <Button
          data-testid="close-settings-button"
          size="sm"
          variant="ghost"
          className="h-10 w-10 rounded-full p-2"
          onClick={toggleSettings}
          aria-label="Close settings"
        >
          <X className="h-5 w-5 text-white/90" />
        </Button>
      </div>

      {/* Settings Content */}
      <div className="h-full overflow-y-auto p-6 pb-20">
        <div className="space-y-8">
          {/* Music Mode Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Music Mode</h3>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <div className="font-medium text-white">
                  {isRemoteMode ? "Server Mode" : "Local Mode"}
                </div>
                <div className="text-sm text-zinc-400">
                  {isRemoteMode
                    ? "Connect to Apple Music via local server"
                    : "Use simulated player for testing"}
                </div>
              </div>
              <Switch
                id="mode-toggle"
                checked={isRemoteMode}
                onCheckedChange={handleModeToggle}
              />
            </div>
          </div>

          {/* Lyrics Provider Section */}
          <ProviderSection
            title="Lyrics Provider"
            providers={lyricsProviders}
            currentId={currentLyricsProviderId}
            onSelect={setLyricsProviderId}
          />

          {/* Artwork Provider Section */}
          <ProviderSection
            title="Artwork Provider"
            providers={artworkProviders}
            currentId={currentArtworkProviderId}
            onSelect={setArtworkProviderId}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
