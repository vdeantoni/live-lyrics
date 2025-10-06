import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { providerAPI } from "./api/providerAPI";
import { playerService } from "./core/services/PlayerService";

/**
 * Development and testing utilities
 * Expose APIs to window object for E2E tests and debugging
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

// Make APIs available globally for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).providerAPI = providerAPI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).playerControlAPI = playerControlAPI;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
