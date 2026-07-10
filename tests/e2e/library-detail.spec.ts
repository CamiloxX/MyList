import { expect, test } from "@playwright/test";
import { clearLibrary, e2eUserId, seedInterstellar } from "./helpers";

test.beforeEach(async () => {
  const userId = await e2eUserId();
  await clearLibrary(userId);
  await seedInterstellar(userId);
});

test("library shows the seeded item and navigates to its detail", async ({ page }) => {
  await page.goto("/es/library");

  const card = page.getByRole("link", { name: /Interstellar/i }).first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.click();

  await page.waitForURL("**/library/**", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Interstellar/i }).first()).toBeVisible();
});
