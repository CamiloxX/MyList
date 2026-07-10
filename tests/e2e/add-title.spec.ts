import { expect, test } from "@playwright/test";
import { clearLibrary, e2eUserId } from "./helpers";

test.beforeEach(async () => {
  await clearLibrary(await e2eUserId());
});

test("search a movie and add it to the library", async ({ page }) => {
  await page.goto("/es/search?q=Interstellar");

  // TMDB results render as cards with an "Agregar" button each.
  const addButton = page.getByRole("button", { name: "Agregar", exact: true }).first();
  await expect(addButton).toBeVisible({ timeout: 30_000 });
  await addButton.click();

  // Success feedback: toast + the button flips to "Agregado".
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Agregado" }).first()).toBeVisible();
});
