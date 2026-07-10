import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { clearLibrary, e2eUserId } from "./helpers";

/** Minimal canonical export: 2 titles, 2 viewings (one per title). */
function buildExport() {
  const movieId = randomUUID();
  const animeId = randomUUID();
  return {
    format_version: 1,
    exported_at: new Date().toISOString(),
    user_email: null,
    items_count: 2,
    entries_count: 2,
    items: [
      {
        id: movieId,
        source: "tmdb",
        source_id: "157336",
        kind: "movie",
        title: "Interstellar",
        original_title: "Interstellar",
        year: 2014,
        runtime_minutes: 169,
        episode_count: null,
        episodes_watched: null,
        poster_url: null,
        status: "watched",
        genres: [],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: animeId,
        source: "anilist",
        source_id: "5114",
        kind: "anime",
        title: "Fullmetal Alchemist: Brotherhood",
        original_title: null,
        year: 2009,
        runtime_minutes: 24,
        episode_count: 64,
        episodes_watched: 64,
        poster_url: null,
        status: "watched",
        genres: [],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    entries: [
      {
        id: randomUUID(),
        media_item_id: movieId,
        watched_on: "2026-02-14",
        rating: 10,
        platform: "Netflix",
        season_number: null,
        notes: null,
        created_at: "2026-02-14T00:00:00Z",
      },
      {
        id: randomUUID(),
        media_item_id: animeId,
        watched_on: "2026-03-01",
        rating: 9,
        platform: "Crunchyroll",
        season_number: null,
        notes: "rewatch",
        created_at: "2026-03-01T00:00:00Z",
      },
    ],
  };
}

test.beforeEach(async () => {
  await clearLibrary(await e2eUserId());
});

test("import a JSON export, then re-import is a no-op", async ({ page }) => {
  const file = {
    name: "mylist-export.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(buildExport())),
  };

  await page.goto("/es/settings");
  const fileInput = page.locator('input[accept*="json"]');
  await fileInput.setInputFiles(file);

  // Local parse feedback, then dry-run preview.
  await expect(page.getByText("2 títulos · 2 visualizaciones en el archivo")).toBeVisible();
  await page.getByRole("button", { name: "Analizar" }).click();
  await expect(page.getByText("2 títulos nuevos")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("2 visualizaciones nuevas")).toBeVisible();

  // Commit and check the success state.
  await page.getByRole("button", { name: "Importar ahora" }).click();
  await expect(page.getByText("Importación completada")).toBeVisible({ timeout: 30_000 });

  // The library actually shows the imported titles.
  await page.goto("/es/library");
  await expect(page.getByRole("link", { name: /Interstellar/i }).first()).toBeVisible({
    timeout: 30_000,
  });

  // Idempotency: same file again -> nothing new, everything duplicate.
  await page.goto("/es/settings");
  await page.locator('input[accept*="json"]').setInputFiles(file);
  await page.getByRole("button", { name: "Analizar" }).click();
  await expect(page.getByText("0 títulos nuevos")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("2 duplicadas (se ignoran)")).toBeVisible();
});
