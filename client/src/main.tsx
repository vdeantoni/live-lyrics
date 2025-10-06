import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { providerAPI, providerRegistryAPI } from "./api/providerAPI";
import { playerService } from "./core/services/PlayerService";

/**
 * Development and testing utilities
 * Expose provider API to window object for E2E tests and debugging
 * TODO: Consider restricting to dev/test environments in production
 */

// Create player control API for testing (using event-driven PlayerService)
const playerControlAPI = {
  seek: async (time: number) => {
    await playerService.seek(time);
  },
  play: async () => {
    await playerService.play();
  },
  pause: async () => {
    await playerService.pause();
  },
};

// Make provider API available globally for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).providerAPI = providerAPI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).providerRegistryAPI = providerRegistryAPI; // Maintain backward compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).playerControlAPI = playerControlAPI;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
