import "server-only";

import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";

/**
 * Wraps a cron job's work function with the shared bearer-secret guard used by
 * every /api/cron/* route. Without CRON_SECRET configured the endpoint is inert
 * (503) so it can't be abused before it's wired; with it set, the caller must
 * present `Authorization: Bearer <secret>` or get 401.
 *
 * Trigger-agnostic: pg_net issues POST, Vercel Cron issues GET — wire both to
 * the returned handler. The work function's result is spread into the JSON
 * response alongside `ok: true`.
 */
export function withCronAuth<T extends object>(
  work: () => Promise<T>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const secret = serverEnv.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Cron not configured" }, { status: 503 });
    }

    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await work();
    return NextResponse.json({ ok: true, ...result });
  };
}
