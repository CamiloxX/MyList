import { expect, test } from "@playwright/test";
import { adminClient, clearLibrary, e2eUserId, seedInterstellar } from "./helpers";

test.beforeEach(async () => {
  const userId = await e2eUserId();
  await clearLibrary(userId);
  const admin = adminClient();
  await admin.from("wrapped_shares").delete().eq("user_id", userId);
  const itemId = await seedInterstellar(userId);
  const { error } = await admin.from("watch_entries").insert({
    user_id: userId,
    media_item_id: itemId,
    watched_on: "2026-02-14",
    rating: 10,
    platform: "Netflix",
  });
  if (error) throw error;
});

test("wrapped renders, shares publicly and serves an OG image", async ({ page, browser }) => {
  await page.goto("/es/wrapped/2026");
  await expect(page.getByText("Este año viste")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("MyList Wrapped 2026")).toBeVisible();

  // Publish. Headless clipboard/native-share may fail AFTER the row exists,
  // so assert on the DB instead of the toast.
  await page.getByRole("button", { name: "Compartir" }).click();
  const admin = adminClient();
  const userId = await e2eUserId();
  await expect
    .poll(
      async () => {
        const { data } = await admin
          .from("wrapped_shares")
          .select("id")
          .eq("user_id", userId)
          .eq("year", 2026)
          .maybeSingle();
        return data?.id ?? null;
      },
      { timeout: 15_000 },
    )
    .not.toBeNull();
  const { data: share } = await admin
    .from("wrapped_shares")
    .select("id")
    .eq("user_id", userId)
    .eq("year", 2026)
    .single();
  if (!share) throw new Error("share row missing");

  // Anonymous context: the public page renders without any session.
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(`http://localhost:3210/es/wrapped/share/${share.id}`);
  await expect(anonPage.getByText("MyList Wrapped 2026")).toBeVisible({ timeout: 30_000 });

  // The OG image route answers with a PNG.
  const res = await anonPage.request.get(
    `http://localhost:3210/es/wrapped/share/${share.id}/opengraph-image`,
  );
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  await anon.close();
});
