import { defineConfig, devices } from "@playwright/test";

// Credentials and Supabase keys come from .env.local (Node 20.12+).
// CI environments provide them as real env vars instead.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the environment
}

export default defineConfig({
  testDir: "tests/e2e",
  // Specs share one test account (cleanup + seed helpers), so keep them serial.
  fullyParallel: false,
  workers: 1,
  // Dev-server cold compiles on Windows can take 50+ s per route first hit.
  timeout: 120_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    // Dedicated port: the user often has other projects' dev servers on 3000,
    // and reuseExistingServer would happily reuse the wrong app.
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      // Desktop-only on purpose: the app shell branches on User-Agent and the
      // mobile UI uses different selectors. Mobile specs are a later iteration.
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "tests/e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // Production server, NOT `next dev`: on this machine's slow disk the dev
    // server takes 3+ minutes to cold-compile and times the runner out.
    // Prerequisite: a fresh `pnpm build` (next start serves the last build).
    command: "pnpm exec next start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
