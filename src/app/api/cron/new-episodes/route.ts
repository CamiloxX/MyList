import { withCronAuth } from "@/features/notifications/cron-auth";
import { dispatchNewEpisodes } from "@/features/notifications/new-episodes";

// Always run fresh — never cache a cron tick.
export const dynamic = "force-dynamic";

/**
 * Daily new-episode check for shows the user is watching (TV via TMDB, anime
 * via Jikan). Meant to be hit once a day by pg_cron (10:00 Chile = 14:00 UTC).
 * Auth via the shared bearer guard.
 */
const handle = withCronAuth(dispatchNewEpisodes);

export const GET = handle;
export const POST = handle;
