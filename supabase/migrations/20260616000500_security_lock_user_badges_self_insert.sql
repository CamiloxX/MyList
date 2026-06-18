-- 20260616000500 — SECURITY (PHASE B): stop client-side self-grant of badges
--
-- ⚠️ DEPLOY ORDER: apply this ONLY AFTER the app code that persists auto-earned
-- badges via the service-role client (evaluator.ts) is live in production.
-- Applying it earlier breaks badge auto-unlock for every user, because the
-- previously-deployed evaluator inserts user_badges under the per-user client and
-- relies on user_badges_insert_own.
--
-- user_badges_insert_own (002) let a user INSERT any badge_id for themselves
-- directly from the browser client, claiming badges they never earned. After this
-- drop, the only INSERT paths are:
--   * user_badges_admin_insert (20260607000000) — admin manual grant, and
--   * the service-role client used by the badge evaluator, which has already
--     validated the criterion server-side.

drop policy if exists "user_badges_insert_own" on public.user_badges;
