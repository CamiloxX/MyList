import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { dispatchDueNotifications } from "@/features/notifications/dispatch";

// Always run fresh — never cache a cron tick.
export const dynamic = "force-dynamic";

/**
 * Dispatches any due scheduled notifications. Trigger-agnostic: Supabase
 * pg_cron (via pg_net, every minute — free on Hobby) or Vercel Cron (Pro) can
 * both call it. Auth is a shared bearer secret (CRON_SECRET); without that env
 * var set the endpoint is inert (503) so it can't be abused before it's wired.
 *
 * pg_net issues POST, Vercel Cron issues GET — we accept both.
 */
async function handle(request: Request): Promise<Response> {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Cron not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = await dispatchDueNotifications();
  return NextResponse.json({ ok: true, ...summary });
}

export const GET = handle;
export const POST = handle;
