import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    globals: false,
    css: false,
    // Fake env vars so modules that validate `process.env` at import time
    // (src/lib/env/*) don't crash when imported transitively from tests.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      TMDB_API_KEY: "test-tmdb-key",
    },
  },
});
