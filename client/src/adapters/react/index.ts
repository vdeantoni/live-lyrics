// Action hooks - provide functions to interact with services
export { usePlayerControls } from "./hooks/usePlayerControls";
export { useSettings } from "./hooks/useSettings";
export { usePlaylists } from "./hooks/usePlaylists";
export { useProviders } from "./hooks/useProviders";
export { useEventBus } from "./hooks/useEventBus";

// Synchronization hooks - keep state in sync with external sources
export { useEventSync } from "./sync/useEventSync";
export { usePlayerSync } from "./sync/usePlayerSync";
export { usePlayerControlSync } from "./sync/usePlayerControlSync";
export { useLyricsSync } from "./sync/useLyricsSync";
export { useArtworkSync } from "./sync/useArtworkSync";
export { useProviderStatus } from "./sync/useProviderStatus";
