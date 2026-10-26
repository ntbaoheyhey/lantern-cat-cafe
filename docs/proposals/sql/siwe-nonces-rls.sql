-- PROPOSAL ONLY: do not apply as part of S2. No browser may read or write SIWE nonces.
-- RLS with no policies is already default-deny, NOT a missing-public-access vulnerability.
-- The restrictive false policy documents the intent and prevents a future permissive policy
-- from accidentally exposing challenges. Grants are a second independent boundary.
-- Auth's create/consume RPCs run only as service_role, which bypasses RLS; retain those grants.
begin;
alter table public.siwe_nonces enable row level security;
revoke all on table public.siwe_nonces from public, anon, authenticated;
drop policy if exists siwe_nonces_server_only on public.siwe_nonces;
create policy siwe_nonces_server_only on public.siwe_nonces
  as restrictive for all to anon, authenticated
  using (false) with check (false);
grant select, insert, update, delete on table public.siwe_nonces to service_role;
comment on table public.siwe_nonces is
  'Server-only single-use SIWE challenges. Deny all client access; service_role RPCs issue and consume nonces.';
commit;
