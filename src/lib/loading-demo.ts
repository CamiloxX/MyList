import "server-only";

import { serverEnv } from "./env/server";

/**
 * Awaits the configured demo delay before resolving. Useful for visualizing
 * the LoadingScreen suspense boundary during navigation without a slow
 * connection. No-op when LOADING_DEMO_MS is unset.
 *
 * Drop `await loadingDemoDelay()` at the top of any server component to
 * preview the loader. Remove or unset the env var before shipping.
 */
export async function loadingDemoDelay(): Promise<void> {
  const ms = serverEnv.LOADING_DEMO_MS;
  if (!ms) return;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
