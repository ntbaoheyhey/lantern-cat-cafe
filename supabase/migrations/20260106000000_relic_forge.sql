-- Taskbar Hero B5: Relic forge and mint report (docs/api.md, docs/contracts.md).
-- The relic-forge Edge Function rolls the rarity and signs the EIP-712 voucher; these functions
-- pay for the forge and keep the voucher rows. Executable by service_role only.

-- One paid forge per player per game day (UTC+7). Its Relic (relic_id, rarity) never changes:
-- every voucher re-signed for it carries the same values.
create table public.relic_forges (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  day date not null,
  relic_id integer not null check (relic_id >= 1),
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  created_at timestamptz not null default now(),
  unique (player_id, day)
);

alter table public.relic_forges enable row level security;
create policy relic_forges_select_own on public.relic_forges
  for select to authenticated using (player_id = auth.uid());
grant select on public.relic_forges to authenticated;

-- Each voucher belongs to a forge; re-signing an expired voucher adds a row for the same forge.
-- signature: the server's 65-byte EIP-712 signature (not secret; it only lets voucher.player mint).
alter table public.relic_vouchers
  add column forge_id uuid references public.relic_forges (id) on delete cascade,
  add column signature text check (signature is null or signature ~ '^0x[0-9a-f]{130}$'),
  add constraint relic_vouchers_rarity_check check (rarity in ('common', 'rare', 'epic', 'legendary'));
-- At most one live (issued) voucher per forge.
create unique index relic_vouchers_one_issued_per_forge on public.relic_vouchers (forge_id) where status = 'issued';
create index relic_vouchers_player_status_idx on public.relic_vouchers (player_id, status);

-- A voucher as the API returns it (RelicVoucher in apps/web/src/api/GameApi.ts, minus the derived
-- rarity index). Internal helper.
create function public.game_voucher_json(v public.relic_vouchers)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'player', (select wallet from public.players where id = v.player_id),
    'relicId', v.relic_id::text,
    'rarityName', v.rarity,
    'nonce', v.nonce::text,
    'expiry', extract(epoch from v.expires_at)::bigint,
    'signature', v.signature,
    'status', v.status
  );
$$;

-- game_snapshot (B3) plus forgedToday and pending: the player's live (issued) voucher, if any.
create or replace function public.game_snapshot(p_player uuid, p_day date, p_starter jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s public.idle_state;
  v public.relic_vouchers;
begin
  if not exists (select 1 from public.gear where player_id = p_player) then
    -- Serialize first-time setup per player so two calls cannot both insert starters.
    perform 1 from public.players where id = p_player for update;
    if not found then
      return null;
    end if;
    if not exists (select 1 from public.gear where player_id = p_player) then
      perform public.game_insert_gear(p_player, p_starter, true);
    end if;
  end if;

  insert into public.idle_state (player_id) values (p_player) on conflict (player_id) do nothing;
  select * into s from public.idle_state where player_id = p_player;
  if not found then
    return null;
  end if;

  select * into v from public.relic_vouchers
   where player_id = p_player and status = 'issued'
   order by nonce desc limit 1;

  return jsonb_build_object(
    'gold', s.gold,
    'shards', s.shards,
    'bossLevel', s.boss_level,
    -- Exact microseconds since the epoch, for the claim seed and game_claim's compare-and-set.
    'lastClaimMicros', public.game_epoch_micros(s.last_claim_at),
    'bossKeys', (select count(*) from public.boss_keys where player_id = p_player and spent_at is null),
    'attemptsToday', (select count(*) from public.boss_attempts where player_id = p_player and day = p_day),
    'keyEarnedToday', exists (select 1 from public.boss_keys where player_id = p_player and day = p_day),
    'gear', (
      select coalesce(
        jsonb_agg(jsonb_build_object('id', id, 'slot', slot, 'rarity', rarity, 'level', level, 'equipped', equipped)
                  order by created_at, id),
        '[]'::jsonb)
      from public.gear where player_id = p_player
    ),
    'forgedToday', exists (select 1 from public.relic_forges where player_id = p_player and day = p_day),
    'pending', case when v.nonce is null then null else public.game_voucher_json(v) end
  );
end;
$$;

-- Pay for today's forge, in one transaction with the player row locked. Returns jsonb:
--   {"status": "pending", "voucher": ...}  a live voucher exists (any day): nothing spent;
--   {"status": "blocked", "reason": ...}   daily_limit | no_boss_key | not_enough_shards
--                                           (game-rules forgeBlock order): nothing spent;
--   {"status": "new", "voucher": ...}      shards and the oldest unspent Boss Keys spent, forge and
--                                           an unsigned issued voucher inserted.
-- p_relic_id and p_rarity were rolled by the caller with the day's server seed.
create function public.game_forge(
  p_player uuid,
  p_day date,
  p_relic_id integer,
  p_rarity text,
  p_shard_cost integer,
  p_key_cost integer,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v public.relic_vouchers;
  v_forge uuid;
  v_shards integer;
begin
  perform 1 from public.players where id = p_player for update;
  if not found then
    raise exception 'game_forge: no player %', p_player;
  end if;

  select * into v from public.relic_vouchers
   where player_id = p_player and status = 'issued'
   order by nonce desc limit 1;
  if found then
    return jsonb_build_object('status', 'pending', 'voucher', public.game_voucher_json(v));
  end if;

  if exists (select 1 from public.relic_forges where player_id = p_player and day = p_day) then
    return jsonb_build_object('status', 'blocked', 'reason', 'daily_limit');
  end if;
  if (select count(*) from public.boss_keys where player_id = p_player and spent_at is null) < p_key_cost then
    return jsonb_build_object('status', 'blocked', 'reason', 'no_boss_key');
  end if;
  select shards into v_shards from public.idle_state where player_id = p_player for update;
  if coalesce(v_shards, 0) < p_shard_cost then
    return jsonb_build_object('status', 'blocked', 'reason', 'not_enough_shards');
  end if;

  update public.idle_state set shards = shards - p_shard_cost where player_id = p_player;
  update public.boss_keys set spent_at = now()
   where id in (
     select id from public.boss_keys
      where player_id = p_player and spent_at is null
      order by day, id
      limit p_key_cost
   );
  insert into public.relic_forges (player_id, day, relic_id, rarity)
  values (p_player, p_day, p_relic_id, p_rarity)
  returning id into v_forge;
  insert into public.relic_vouchers (player_id, forge_id, relic_id, rarity, expires_at)
  values (p_player, v_forge, p_relic_id, p_rarity, p_expires_at)
  returning * into v;
  return jsonb_build_object('status', 'new', 'voucher', public.game_voucher_json(v));
end;
$$;

-- Store the signature of the player's issued voucher. Signing is deterministic (RFC 6979), so a
-- second caller signing the same voucher writes the same value; an existing signature is kept.
create function public.game_voucher_sign(p_player uuid, p_nonce bigint, p_signature text)
returns boolean
language sql volatile security definer set search_path = '' as $$
  with u as (
    update public.relic_vouchers set signature = coalesce(signature, lower(p_signature))
     where player_id = p_player and nonce = p_nonce and status = 'issued'
    returning 1
  )
  select exists (select 1 from u);
$$;

-- Replace the player's issued voucher p_nonce, which expired before p_now, with a new unsigned
-- voucher for the same forge (same relic_id and rarity, new nonce, expiry p_expires_at). The old row
-- becomes 'expired'. Returns the new voucher as jsonb, or null when p_nonce is not the player's
-- issued voucher or has not expired yet.
create function public.game_voucher_reissue(p_player uuid, p_nonce bigint, p_now timestamptz, p_expires_at timestamptz)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  old public.relic_vouchers;
  v public.relic_vouchers;
begin
  perform 1 from public.players where id = p_player for update;
  select * into old from public.relic_vouchers
   where player_id = p_player and nonce = p_nonce and status = 'issued' and expires_at < p_now;
  if not found then
    return null;
  end if;
  update public.relic_vouchers set status = 'expired' where nonce = old.nonce;
  insert into public.relic_vouchers (player_id, forge_id, relic_id, rarity, expires_at)
  values (p_player, old.forge_id, old.relic_id, old.rarity, p_expires_at)
  returning * into v;
  return public.game_voucher_json(v);
end;
$$;

-- The player's voucher p_nonce (any status) as jsonb, or null if it is not theirs.
create function public.game_voucher(p_player uuid, p_nonce bigint)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select public.game_voucher_json(v) from public.relic_vouchers v where v.player_id = p_player and v.nonce = p_nonce;
$$;

-- Mark the player's voucher p_nonce minted (from issued or expired; the chain is the truth) with
-- the tx hash when known. Already minted: unchanged. Returns false if the voucher is not theirs.
create function public.game_voucher_minted(p_player uuid, p_nonce bigint, p_tx_hash text)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform 1 from public.players where id = p_player for update;
  if not exists (select 1 from public.relic_vouchers where player_id = p_player and nonce = p_nonce) then
    return false;
  end if;
  update public.relic_vouchers set status = 'minted', tx_hash = p_tx_hash
   where player_id = p_player and nonce = p_nonce and status <> 'minted';
  return true;
end;
$$;

-- Internal helper: not callable by any API role.
revoke all on function public.game_voucher_json(public.relic_vouchers) from public, anon, authenticated, service_role;
revoke all on function public.game_forge(uuid, date, integer, text, integer, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.game_voucher_sign(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.game_voucher_reissue(uuid, bigint, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.game_voucher(uuid, bigint) from public, anon, authenticated;
revoke all on function public.game_voucher_minted(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.game_forge(uuid, date, integer, text, integer, integer, timestamptz) to service_role;
grant execute on function public.game_voucher_sign(uuid, bigint, text) to service_role;
grant execute on function public.game_voucher_reissue(uuid, bigint, timestamptz, timestamptz) to service_role;
grant execute on function public.game_voucher(uuid, bigint) to service_role;
grant execute on function public.game_voucher_minted(uuid, bigint, text) to service_role;
