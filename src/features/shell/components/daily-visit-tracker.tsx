"use client";

import { useEffect } from "react";
import { recordDailyVisit } from "@/features/stats/actions";

/**
 * Fire-and-forget: records today's visit once when the app shell mounts, so the
 * usage streak counts days the user opened the app. Renders nothing.
 */
export function DailyVisitTracker() {
  useEffect(() => {
    void recordDailyVisit();
  }, []);
  return null;
}
