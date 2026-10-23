-- B2 security review fixes.

-- 1. Bounded nonce table: creating a nonce first deletes up to 1000 used or expired rows
-- (keep the 10 minutes in sync with NONCE_TTL_SECONDS in packages/auth), then inserts.
create function public.create_siwe_nonce(p_nonce text) returns void
language sql volatile security invoker set search_path = '' as $$
  with stale as (
    delete from public.siwe_nonces
     where ctid in (
       select ctid from public.siwe_nonces
        where used_at is not null or created_at < now() - interval '10 minutes'
        limit 1000
     )
  )
  insert into public.siwe_nonces (nonce) values (p_nonce);
$$;

revoke all on function public.create_siwe_nonce(text) from public, anon, authenticated;
grant execute on function public.create_siwe_nonce(text) to service_role;

-- 2. Objects created later (by the role running migrations) get no default grants for the
-- API roles; every new table or function must grant explicitly. Existing objects are unchanged.
alter default privileges in schema public revoke all on tables from anon, authenticated, public;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;
-- PostgreSQL grants EXECUTE to PUBLIC on new functions by default, and a schema-scoped
-- default-privilege REVOKE cannot remove that built-in grant. The role-wide form can, so
-- functions this role creates in any schema are no longer executable by PUBLIC until granted.
alter default privileges revoke execute on functions from public;
