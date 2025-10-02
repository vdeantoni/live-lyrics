import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/setup.ts"],
    include: [
      "./tests/unit/**/*.{test,spec}.{js,ts}",
      "./tests/integration/**/*.{test,spec}.{js,ts}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/tests/**", "**/dist/**", "**/node_modules/**"],
    },
  },
});
