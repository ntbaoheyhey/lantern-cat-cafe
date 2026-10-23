-- Taskbar Hero B2: wallet sign-in (SIWE) helpers, called by the auth-* Edge Functions
-- with the service role through PostgREST RPC. Not callable by anon/authenticated.

-- Mark a nonce used. Single atomic UPDATE: concurrent callers serialize on the row lock and
-- the loser re-checks `used_at is null`, so this returns true exactly once per nonce, and
-- only within 10 minutes of issue (keep in sync with NONCE_TTL_SECONDS in packages/auth).
create function public.consume_siwe_nonce(p_nonce text) returns boolean
language sql volatile security invoker set search_path = '' as $$
  with used as (
    update public.siwe_nonces
       set used_at = now()
     where nonce = p_nonce
       and used_at is null
       and created_at > now() - interval '10 minutes'
    returning 1
  )
  select exists (select 1 from used);
$$;

-- Return the player id for a lowercase wallet, creating the player and its idle_state on
-- first sign-in. One statement, so both rows are created together or not at all.
create function public.upsert_player_by_wallet(p_wallet text) returns uuid
language sql volatile security invoker set search_path = '' as $$
  with p as (
    insert into public.players (wallet) values (p_wallet)
    on conflict (wallet) do update set wallet = excluded.wallet
    returning id
  ), s as (
    insert into public.idle_state (player_id) select id from p
    on conflict (player_id) do nothing
  )
  select id from p;
$$;

revoke all on function public.consume_siwe_nonce(text) from public, anon, authenticated;
revoke all on function public.upsert_player_by_wallet(text) from public, anon, authenticated;
grant execute on function public.consume_siwe_nonce(text) to service_role;
grant execute on function public.upsert_player_by_wallet(text) to service_role;
