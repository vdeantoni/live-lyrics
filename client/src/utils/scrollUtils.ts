import type { LineData } from "@/types";

/**
 * Finds the active line element in the container using multiple fallback strategies
 */
export function findActiveLineElement(
  container: HTMLElement,
  activeLine: LineData,
): HTMLElement | null {
  // Strategy 1: Find by data-current attribute (most reliable)
  for (let i = 0; i < container.children.length; i++) {
    const child = container.children[i] as HTMLElement;
    if (child.getAttribute("data-current") === "true") {
      return child;
    }
  }

  // Strategy 2: Find by index if available
  if (activeLine.index !== undefined) {
    const potentialElement = container.children[
      activeLine.index
    ] as HTMLElement;
    if (potentialElement) {
      return potentialElement;
    }
  }

  // Strategy 3: Find by text content (last resort)
  const searchText = activeLine.text.substring(0, 20);
  for (let i = 0; i < container.children.length; i++) {
    const child = container.children[i] as HTMLElement;
    if (child.textContent?.includes(searchText)) {
      return child;
    }
  }

  return null;
}

/**
 * Calculates the target scroll position to center an element in the container
 */
export function calculateCenteredScrollPosition(
  container: HTMLElement,
  element: HTMLElement,
  offset: number = 64,
): number {
  const containerHeight = container.clientHeight;
  const elementTop = element.offsetTop;
  const elementHeight = element.offsetHeight;

  // Center the element with optional offset
  const idealScrollTop =
    elementTop - containerHeight / 2 + elementHeight / 2 + offset;

  // Clamp to valid scroll bounds
  const maxScrollTop = container.scrollHeight - containerHeight;
  return Math.max(0, Math.min(idealScrollTop, maxScrollTop));
}

/**
 * Checks if an element is visible within the container's viewport
 */
export function isElementVisible(
  container: HTMLElement,
  element: HTMLElement,
): boolean {
  const containerHeight = container.clientHeight;
  const containerScrollTop = container.scrollTop;
  const elementTop = element.offsetTop;
  const elementHeight = element.offsetHeight;

  const elementTopInViewport = elementTop - containerScrollTop;
  const elementBottomInViewport = elementTopInViewport + elementHeight;

  return (
    elementTopInViewport >= 0 && elementBottomInViewport <= containerHeight
  );
}
