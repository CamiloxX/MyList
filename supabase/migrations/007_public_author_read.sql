-- 007 — Public read for comment authors
-- title_comments is public-read (title_com_select_all), but profiles and
-- user_badges only had owner-scoped SELECT policies. So when a comment thread
-- joined to those tables under the viewer's session, RLS filtered out every
-- other user's row and each non-self comment rendered as "anonymous" with no
-- avatar, badges or verified check.
--
-- Open SELECT on these two author-facing tables to authenticated users so
-- public comment threads resolve real authors. No sensitive data lives here:
-- emails and credentials are in auth.users, not in profiles. Anonymous (not
-- signed-in) clients are still blocked, since the new policies target the
-- `authenticated` role only and the comments feature sits behind login.

-- profiles: keep profiles_select_own (still valid) and add a broader read.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- user_badges: same — badge chips next to author names need cross-user read.
create policy "user_badges_select_authenticated"
  on public.user_badges for select
  to authenticated
  using (true);
