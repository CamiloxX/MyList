import { withCronAuth } from "@/features/notifications/cron-auth";
import { dispatchDueNotifications } from "@/features/notifications/dispatch";

// Always run fresh — never cache a cron tick.
export const dynamic = "force-dynamic";

/**
 * Dispatches any due scheduled notifications. Trigger-agnostic: Supabase
 * pg_cron (via pg_net, every minute — free on Hobby) or Vercel Cron (Pro) can
 * both call it. Auth handled by the shared {@link withCronAuth} guard.
 */
const handle = withCronAuth(dispatchDueNotifications);

export const GET = handle;
export const POST = handle;
