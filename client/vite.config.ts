import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Standard port for Vite dev server
  },
  preview: {
    port: 5173, // Align preview server with dev server
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: React ecosystem
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          // UI libraries
          "vendor-ui": ["framer-motion", "lucide-react"],
          // State management
          "vendor-state": ["jotai", "@tanstack/react-query"],
          // Radix UI primitives
          "vendor-radix": [
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "@radix-ui/react-switch",
          ],
          // Lyrics parsing
          "vendor-lyrics": ["liricle"],
          // DnD kit
          "vendor-dnd": [
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@dnd-kit/utilities",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly to avoid warnings for main chunk
  },
});
