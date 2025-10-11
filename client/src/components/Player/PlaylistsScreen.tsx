import { useSetAtom } from "jotai";
import { togglePlaylistsAtom } from "@/atoms/appState";
import PlaylistsColumn from "./PlaylistsColumn";
import QueueColumn from "./QueueColumn";
import HistoryColumn from "./HistoryColumn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Mobile Layout: 3 Tabs (Playlists, Queue, History)
 * Viewport: < 768px
 */
const MobileLayout = () => (
  <div className="flex-1 overflow-hidden p-6 pb-20">
    <Tabs defaultValue="playlists" className="flex h-full flex-col">
      <TabsList className="mb-4 grid w-full grid-cols-3">
        <TabsTrigger value="playlists">Playlists</TabsTrigger>
        <TabsTrigger value="queue">Queue</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent
        value="playlists"
        className="flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
      >
        <PlaylistsColumn showHeader={false} />
      </TabsContent>
      <TabsContent
        value="queue"
        className="flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
      >
        <QueueColumn showHeader={false} />
      </TabsContent>
      <TabsContent
        value="history"
        className="flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
      >
        <HistoryColumn showHeader={false} />
      </TabsContent>
    </Tabs>
  </div>
);

/**
 * Medium/Tablet Layout: Playlists Column + Tabbed Queue/History
 * Viewport: 768px - 1279px
 */
const MediumLayout = () => (
  <div className="flex flex-1 gap-4 overflow-hidden p-6 pb-20">
    {/* Playlists Column */}
    <div className="flex h-full w-1/2 flex-col overflow-hidden">
      <h3 className="mb-3 text-lg font-semibold text-white">Playlists</h3>
      <div className="flex-1 overflow-y-auto">
        <PlaylistsColumn showHeader={false} />
      </div>
    </div>

    {/* Tabbed Queue/History */}
    <div className="flex h-full w-1/2 flex-col overflow-hidden">
      <Tabs
        defaultValue="queue"
        className="flex h-full flex-col overflow-hidden"
      >
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent
          value="queue"
          className="flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
        >
          <QueueColumn showHeader={false} />
        </TabsContent>
        <TabsContent
          value="history"
          className="flex-1 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col"
        >
          <HistoryColumn showHeader={false} />
        </TabsContent>
      </Tabs>
    </div>
  </div>
);

/**
 * Desktop Layout: 3 Columns (Playlists, Queue, History)
 * Viewport: >= 1280px
 */
const DesktopLayout = () => (
  <div className="flex flex-1 gap-4 overflow-hidden p-6 pb-20">
    {/* Playlists Column */}
    <div className="flex h-full w-1/3 flex-col overflow-hidden">
      <h3 className="mb-3 text-lg font-semibold text-white">Playlists</h3>
      <div className="flex-1 overflow-y-auto">
        <PlaylistsColumn showHeader={false} />
      </div>
    </div>

    {/* Queue Column */}
    <div className="flex h-full w-1/3 flex-col overflow-hidden">
      <h3 className="mb-3 text-lg font-semibold text-white">Queue</h3>
      <div className="flex-1 overflow-y-auto">
        <QueueColumn showHeader={false} />
      </div>
    </div>

    {/* History Column */}
    <div className="flex h-full w-1/3 flex-col overflow-hidden">
      <h3 className="mb-3 text-lg font-semibold text-white">History</h3>
      <div className="flex-1 overflow-y-auto">
        <HistoryColumn showHeader={false} />
      </div>
    </div>
  </div>
);

const PlaylistsScreen = () => {
  const togglePlaylists = useSetAtom(togglePlaylistsAtom);

  // Tailwind breakpoints: md = 768px, xl = 1280px
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  // Medium/Tablet is implicit: !isMobile && !isDesktop

  return (
    <div
      data-testid="playlists-screen"
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-zinc-900/95 backdrop-blur-md"
    >
      {/* Header - Always visible */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2
              data-testid="playlists-screen-title"
              className="text-2xl font-bold text-white"
            >
              Playlists
            </h2>
            <p className="text-sm text-zinc-400">
              Manage your collections, queue, and history
            </p>
          </div>
          {/* Close Button */}
          <Button
            data-testid="close-playlists-button"
            size="sm"
            variant="ghost"
            className="h-10 w-10 rounded-full border border-white/10 bg-black/40 p-2 shadow-lg backdrop-blur-md hover:scale-105 hover:bg-black/60"
            onClick={() => togglePlaylists()}
            aria-label="Close playlists"
          >
            <X className="h-5 w-5 text-white/90" />
          </Button>
        </div>
      </div>

      {/* Conditionally render only the active layout */}
      {isMobile && <MobileLayout />}
      {!isMobile && !isDesktop && <MediumLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
};

export default PlaylistsScreen;
