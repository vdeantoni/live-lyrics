import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/setup.ts"],
    css: true,
    include: [
      "./tests/unit/**/*.{test,spec}.{js,ts,tsx}",
      "./tests/integration/**/*.{test,spec}.{js,ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/e2e/**", // Exclude Playwright E2E tests
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
