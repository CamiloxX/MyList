-- 20260616000400 — SECURITY (PHASE B): drop the blanket profiles read
--
-- ⚠️ DEPLOY ORDER: apply this ONLY AFTER the app code that resolves cross-user
-- author cards via public.resolve_authors() (migration 20260616000100) is live in
-- production. Applying it earlier makes chat/comment authors render as anonymous,
-- because the previously-deployed code reads profiles directly under the per-user
-- client and relies on this policy.
--
-- Removes profiles_select_authenticated (007), which exposed username and
-- is_public (and is_admin / featured_badge_ids) of every user to any logged-in
-- client. Owner self-reads keep working via profiles_select_own (001); cross-user
-- author cards go through resolve_authors(); the public /u/<username> page reads
-- via the service-role client gated by is_public.
--
-- user_badges_select_authenticated (007) intentionally stays: earned-badge chips
-- are public display data and carry no authorization.

drop policy if exists "profiles_select_authenticated" on public.profiles;
