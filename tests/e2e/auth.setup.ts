import { test as setup } from "@playwright/test";

const AUTH_FILE = "tests/e2e/.auth/user.json";

// Logs in once and persists the Supabase session cookies; every spec in the
// chromium project reuses them via storageState.
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_EMAIL / E2E_PASSWORD missing — run scripts/create-e2e-user.mjs");
  }

  await page.goto("/es/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/library", { timeout: 60_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
