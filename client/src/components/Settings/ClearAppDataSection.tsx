import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { clearAppData } from "@/utils/clearAppData";
import { useSettings } from "@/adapters/react";

export const ClearAppDataSection = () => {
  const settings = useSettings();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAppData = async () => {
    setIsClearing(true);
    try {
      await clearAppData();

      // Reset provider settings to defaults
      settings.clearAllSettings();

      // Show success message and reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to clear app data:", error);
      alert(
        "Failed to clear app data. Please try again or refresh the page manually.",
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="clear-app-data-section">
      <h3 className="text-lg font-semibold text-white">App Data</h3>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="mb-3">
          <div className="font-medium text-white">Clear All Data</div>
          <div className="text-sm text-zinc-400">
            Reset all settings and clear cached data. This action cannot be
            undone.
          </div>
        </div>
        <Button
          data-testid="clear-app-data-button"
          size="sm"
          variant="outline"
          disabled={isClearing}
          onClick={handleClearAppData}
          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isClearing ? "Clearing..." : "Clear App Data"}
        </Button>
      </div>
    </div>
  );
};
