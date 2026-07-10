import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendPushToAll, sendPushToUserAdmin } from "./send";

export type DispatchSummary = {
  /** How many scheduled rows were due and processed this run. */
  processed: number;
  /** Total device sends that succeeded across all processed rows. */
  sent: number;
  failed: number;
  pruned: number;
};

/**
 * Finds every scheduled notification whose time has come and that hasn't been
 * sent yet, dispatches each (broadcast or single-user), and stamps sent_at +
 * result so it never fires twice. Runs with the service-role client because
 * the cron caller has no user session.
 *
 * We claim each row by writing sent_at BEFORE sending — if two cron ticks
 * overlap, the second sees sent_at already set and skips it. The downside is a
 * row that crashes mid-send won't retry, which is the right trade-off for
 * notifications (a missed one beats a duplicate one). The actual send is
 * soft-failing anyway, so partial delivery still records its real counts.
 */
export async function dispatchDueNotifications(): Promise<DispatchSummary> {
  const admin = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await admin
    .from("scheduled_notifications")
    .select("id, title, body, url, target_user_id")
    .is("sent_at", null)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error || !due || due.length === 0) {
    return { processed: 0, sent: 0, failed: 0, pruned: 0 };
  }

  const summary: DispatchSummary = { processed: 0, sent: 0, failed: 0, pruned: 0 };

  for (const row of due) {
    // Claim first so an overlapping tick won't re-send it.
    const { data: claimed } = await admin
      .from("scheduled_notifications")
      .update({ sent_at: nowIso })
      .eq("id", row.id)
      .is("sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue; // another tick grabbed it

    const payload = {
      title: row.title,
      body: row.body,
      url: row.url || "/library",
      tag: `scheduled:${row.id}`,
    };

    const stats = row.target_user_id
      ? await sendPushToUserAdmin(row.target_user_id, payload)
      : await sendPushToAll(payload);

    await admin.from("scheduled_notifications").update({ result: stats }).eq("id", row.id);

    summary.processed += 1;
    summary.sent += stats.sent;
    summary.failed += stats.failed;
    summary.pruned += stats.pruned;
  }

  return summary;
}
