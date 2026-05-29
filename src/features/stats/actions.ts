"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Records that the signed-in user opened the app today (Colombia time). Used by
 * the "usage" streak so a day counts when the user shows up, not only when they
 * log a view. Idempotent per day via the (user_id, active_on) primary key.
 */
export async function recordDailyVisit(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  await supabase
    .from("user_activity")
    .upsert(
      { user_id: user.id, active_on: today },
      { onConflict: "user_id,active_on", ignoreDuplicates: true },
    );
}
