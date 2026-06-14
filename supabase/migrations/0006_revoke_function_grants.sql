-- =====================================================================
-- GarageFlow C — 0006 revoke function EXECUTE grants (security advisor)
-- Supabase default privileges grant EXECUTE to anon/authenticated explicitly,
-- so revoking from PUBLIC alone is not enough. Trigger functions never need an
-- EXECUTE grant to fire, and PostgREST never exposes trigger-returning functions
-- as RPC — this is pure least-privilege hardening.
-- =====================================================================
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_request_transition() from public, anon, authenticated;

-- RLS helpers: anon needs is_garage_member (referenced by public-read policies,
-- returns false for anon); has_garage_role is staff-only. They remain SECURITY
-- DEFINER but only ever reveal the CALLER's own membership.
revoke all on function public.is_garage_member(uuid) from public, anon, authenticated;
revoke all on function public.has_garage_role(uuid, text[]) from public, anon, authenticated;
grant execute on function public.is_garage_member(uuid) to anon, authenticated;
grant execute on function public.has_garage_role(uuid, text[]) to authenticated;
