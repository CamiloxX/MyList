import { expect, test } from "@playwright/test";

// These specs exercise the login flow itself, so start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

test("valid credentials land on the library", async ({ page }) => {
  await page.goto("/es/login");
  await page.locator("#email").fill(process.env.E2E_EMAIL ?? "");
  await page.locator("#password").fill(process.env.E2E_PASSWORD ?? "");
  await page.locator('button[type="submit"]').click();

  await page.waitForURL("**/library", { timeout: 60_000 });
  await expect(page).toHaveURL(/\/library/);
});

test("wrong credentials keep the user on login with an error toast", async ({ page }) => {
  await page.goto("/es/login");
  await page.locator("#email").fill("e2e@mylist.test");
  await page.locator("#password").fill("definitely-wrong-password");
  await page.locator('button[type="submit"]').click();

  // sonner toast signals the failure; the URL must not change.
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/login/);
});
