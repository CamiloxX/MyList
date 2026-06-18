-- 20260616000600 — SECURITY: tighten EXECUTE grants on the new functions
--
-- Supabase auto-grants EXECUTE on every public-schema function to anon,
-- authenticated and service_role. That default is wrong for:
--   * resolve_authors(): author-card data must not be callable by anonymous
--     (logged-out) clients via /rest/v1/rpc/resolve_authors — only signed-in
--     users and the service-role (the public profile page) need it.
--   * the trigger guard/throttle functions: they are only ever invoked by their
--     own triggers and must not sit in the public RPC API surface at all.
--
-- Triggers still fire after these revokes: trigger invocation does NOT require
-- the calling role to hold EXECUTE on the trigger function.

revoke execute on function public.resolve_authors(uuid[]) from anon;

revoke execute on function public.guard_profile_privileged() from public, anon, authenticated;
revoke execute on function public.title_comment_throttle() from public, anon, authenticated;
revoke execute on function public.enforce_featured_badges_earned() from public, anon, authenticated;
