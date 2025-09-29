import { PlayerSection } from "@/components/Settings/PlayerSection";
import { LyricsProviderSection } from "@/components/Settings/LyricsProviderSection";
import { ArtworkProviderSection } from "@/components/Settings/ArtworkProviderSection";
import { ClearAppDataSection } from "@/components/Settings/ClearAppDataSection";

const SettingsScreen = () => {
  return (
    <div
      data-testid="settings-screen"
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-zinc-900/95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm text-zinc-400">Configure your player</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20">
        <div className="space-y-8">
          {/* Player Section */}
          <PlayerSection />

          {/* Lyrics Provider Section */}
          <LyricsProviderSection />

          {/* Artwork Provider Section */}
          <ArtworkProviderSection />

          {/* Clear App Data Section */}
          <ClearAppDataSection />
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
