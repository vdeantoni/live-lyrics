import { QueryClient } from "@tanstack/react-query";

/**
 * Clears all application data including:
 * - React Query cache (both in-memory and persisted)
 * - Jotai atoms localStorage data
 * - Any other app-specific localStorage entries
 */
export const clearAppData = async (queryClient: QueryClient): Promise<void> => {
  try {
    // Clear React Query cache (in-memory)
    queryClient.clear();

    // Clear localStorage entries related to our app
    const keysToRemove: string[] = [];

    // Iterate through localStorage to find our app's keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("LIVE_LYRICS_")) {
        keysToRemove.push(key);
      }
    }

    // Remove the identified keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage as well (in case anything is stored there)
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("LIVE_LYRICS_")) {
        sessionKeysToRemove.push(key);
      }
    }

    sessionKeysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    console.log("App data cleared successfully");
  } catch (error) {
    console.error("Error clearing app data:", error);
    throw error;
  }
};
