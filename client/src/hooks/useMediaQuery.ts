import { useState, useEffect } from "react";

/**
 * Hook to detect media query matches using window.matchMedia
 * More efficient than resize event listeners as it uses browser-native matching
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Initialize with current match state
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Update state when media query match changes
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern API (all browsers we support)
    mediaQuery.addEventListener("change", handler);

    // Sync initial state in case it changed between mount and effect
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
