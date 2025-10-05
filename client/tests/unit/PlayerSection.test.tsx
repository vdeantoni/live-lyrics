import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { PlayerSection } from "@/components/Settings/PlayerSection";
import { renderWithProviders } from "../helpers/testUtils";

describe("PlayerSection", () => {
  beforeEach(() => {
    // Clear any stored settings before each test
    localStorage.clear();
  });

  it("renders websocket player when found in registry", async () => {
    await renderWithProviders(<PlayerSection />);

    // Should show the websocket player from config
    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Remote player")).toBeInTheDocument();

    // Toggle should be enabled
    const toggle = screen.getByTestId("remote-player-toggle");
    expect(toggle).not.toBeDisabled();

    // Should show success icon (CheckCircle)
    const statusIcon = screen.getByTestId("remote-player-status");
    expect(statusIcon.querySelector("svg")).toHaveClass(
      "lucide-circle-check-big",
    );
  });

  it("shows fallback UI when websocket player not found", async () => {
    // Render with empty player registry
    await renderWithProviders(<PlayerSection />, {
      customProviders: {
        players: [], // No players in registry
        lyricsProviders: [],
        artworkProviders: [],
      },
    });

    // Even with empty custom providers, the built-in remote player is still shown
    // because the component falls back to showing it with config values
    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Remote player")).toBeInTheDocument();

    // Toggle should still be enabled
    const toggle = screen.getByTestId("remote-player-toggle");
    expect(toggle).not.toBeDisabled();

    // Should show success icon
    const statusIcon = screen.getByTestId("remote-player-status");
    expect(statusIcon.querySelector("svg")).toHaveClass(
      "lucide-circle-check-big",
    );
  });

  it("toggles between websocket and local player", async () => {
    await renderWithProviders(<PlayerSection />);

    const toggle = screen.getByTestId("remote-player-toggle");

    // Initially unchecked (local player is default)
    expect(toggle).toHaveAttribute("aria-checked", "false");

    // Toggle to websocket player
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(toggle).toHaveAttribute("aria-checked", "true");

    // Toggle back to local player
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("displays correct player name from config", async () => {
    await renderWithProviders(<PlayerSection />);

    // Verify it uses the actual config values, not hardcoded strings
    const playerName = screen.getByText("Server");
    expect(playerName).toHaveClass("font-medium");

    const playerDescription = screen.getByText("Remote player");
    expect(playerDescription).toHaveClass("text-sm");
  });
});
