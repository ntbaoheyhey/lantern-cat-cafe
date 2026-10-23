-- Taskbar Hero B1: initial schema.
-- Off-chain state (gold, gear, shards, Boss Key) is decided by the server.
-- Only the service role (Edge Functions) writes; players can only SELECT their own rows.
--
-- RLS ownership rule: a row belongs to the caller when its player_id (players.id for
-- `players`) equals auth.uid(), i.e. the JWT `sub` claim. The B2 SIWE session JWT sets
-- sub = players.id. The `wallet` claim is NOT used for RLS (no join needed, pk-indexed).

create table public.players (
  id uuid primary key default gen_random_uuid(),
  wallet text not null unique check (wallet = lower(wallet) and wallet ~ '^0x[0-9a-f]{40}$'),
  created_at timestamptz not null default now()
);

create table public.idle_state (
  player_id uuid primary key references public.players (id) on delete cascade,
  gold bigint not null default 0 check (gold >= 0),
  shards integer not null default 0 check (shards >= 0),
  last_claim_at timestamptz not null default now()
);

create table public.gear (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  item_key text not null,
  slot text not null,
  power integer not null default 0 check (power >= 0),
  equipped boolean not null default false,
  created_at timestamptz not null default now()
);
create index gear_player_id_idx on public.gear (player_id);
-- at most one equipped item per slot per player
create unique index gear_one_equipped_per_slot on public.gear (player_id, slot) where equipped;

create table public.boss_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  day date not null,
  won boolean not null,
  created_at timestamptz not null default now()
);
create index boss_attempts_player_day_idx on public.boss_attempts (player_id, day);

create table public.boss_keys (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  day date not null,
  spent_at timestamptz,
  unique (player_id, day)
);

create table public.relic_vouchers (
  nonce bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  relic_id integer not null check (relic_id >= 0),
  rarity text not null,
  status text not null default 'issued' check (status in ('issued', 'minted', 'expired')),
  tx_hash text check (tx_hash is null or tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > created_at)
);
create index relic_vouchers_player_id_idx on public.relic_vouchers (player_id);

-- B2 (SIWE login). Server-only: no policies, no grants for anon/authenticated.
create table public.siwe_nonces (
  nonce text primary key,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

-- Row level security on every table.
alter table public.players enable row level security;
alter table public.idle_state enable row level security;
alter table public.gear enable row level security;
alter table public.boss_attempts enable row level security;
alter table public.boss_keys enable row level security;
alter table public.relic_vouchers enable row level security;
alter table public.siwe_nonces enable row level security;

-- Read-only own-row policies for signed-in players. No INSERT/UPDATE/DELETE policies exist.
create policy players_select_own on public.players
  for select to authenticated using (id = auth.uid());
create policy idle_state_select_own on public.idle_state
  for select to authenticated using (player_id = auth.uid());
create policy gear_select_own on public.gear
  for select to authenticated using (player_id = auth.uid());
create policy boss_attempts_select_own on public.boss_attempts
  for select to authenticated using (player_id = auth.uid());
create policy boss_keys_select_own on public.boss_keys
  for select to authenticated using (player_id = auth.uid());
create policy relic_vouchers_select_own on public.relic_vouchers
  for select to authenticated using (player_id = auth.uid());

-- Defense in depth: Supabase default privileges grant everything to anon/authenticated.
-- Strip it and grant back only SELECT (to authenticated, on player tables).
revoke all on all tables in schema public from anon, authenticated;
grant select on public.players, public.idle_state, public.gear, public.boss_attempts,
  public.boss_keys, public.relic_vouchers to authenticated;
