import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock fetch globally
global.fetch = vi.fn();

// Mock IndexedDB for cache tests
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
          put: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
          delete: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
        })),
      })),
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  })),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, "indexedDB", {
  writable: true,
  value: mockIndexedDB,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
