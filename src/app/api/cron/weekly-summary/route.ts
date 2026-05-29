import { withCronAuth } from "@/features/notifications/cron-auth";
import { dispatchWeeklySummary } from "@/features/notifications/weekly-summary";

// Always run fresh — never cache a cron tick.
export const dynamic = "force-dynamic";

/**
 * Weekly "your week in MyList" digest. Meant to be hit once a week by pg_cron
 * (Sundays 20:00 Chile = Mondays 00:00 UTC). Auth via the shared bearer guard.
 */
const handle = withCronAuth(dispatchWeeklySummary);

export const GET = handle;
export const POST = handle;
