-- Fuji-only sponsor reservations. Apply only by the user after review.
create table public.chain_guest_drips (
  wallet text primary key check (wallet ~ '^0x[0-9a-f]{40}$'),
  player_id uuid not null references public.players(id),
  ip_hash text not null check (length(ip_hash) = 64),
  created_at timestamptz not null default now(),
  sponsor text not null check (sponsor ~ '^0x[0-9a-f]{40}$'),
  nonce bigint not null check (nonce >= 0),
  gas_price numeric(78,0) not null check (gas_price > 0 and gas_price <= 200000000000),
  raw_tx text,
  tx_hash text check (tx_hash is null or tx_hash ~ '^0x[0-9a-f]{64}$'),
  status text not null default 'reserved' check (status in ('reserved','pending','confirmed','failed')),
  unique(sponsor, nonce)
);
alter table public.chain_guest_drips enable row level security;
revoke all on public.chain_guest_drips from public, anon, authenticated;
grant select, insert, update on public.chain_guest_drips to service_role;
create index chain_guest_drips_day on public.chain_guest_drips(created_at);

create function public.chain_drip_reserve(p_player uuid, p_wallet text, p_ip text, p_sponsor text,
  p_nonce bigint, p_gas_price numeric, p_balance numeric) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare r public.chain_guest_drips; next_nonce bigint; pending numeric; day_start timestamptz;
begin
  -- One global lock makes both the daily budget and sponsor nonce allocation atomic.
  perform pg_advisory_xact_lock(43113, 5981);
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then
    raise exception 'unauthenticated';
  end if;
  select * into r from public.chain_guest_drips where wallet=p_wallet;
  if found then return to_jsonb(r); end if;
  day_start := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if (select count(*) from public.chain_guest_drips where created_at >= day_start) >= 50 then raise exception 'daily_limit'; end if;
  if (select count(*) from public.chain_guest_drips where ip_hash=p_ip and created_at > now()-interval '24 hours') >= 3 then raise exception 'ip_limit'; end if;
  if p_nonce < 0 or p_gas_price <= 0 or p_gas_price > 200000000000 then raise exception 'gas_unavailable'; end if;
  select coalesce(sum(50000000000000000 + 21000*gas_price),0) into pending
    from public.chain_guest_drips where sponsor=p_sponsor and status in ('reserved','pending');
  -- Keep at least 1 AVAX after all outstanding reservations, including this one.
  if p_balance - pending - 50000000000000000 - 21000*p_gas_price < 1000000000000000000 then raise exception 'sponsor_low'; end if;
  select greatest(p_nonce, coalesce(max(nonce)+1,p_nonce)) into next_nonce from public.chain_guest_drips where sponsor=p_sponsor;
  insert into public.chain_guest_drips(wallet,player_id,ip_hash,sponsor,nonce,gas_price)
    values(p_wallet,p_player,p_ip,p_sponsor,next_nonce,p_gas_price) returning * into r;
  return to_jsonb(r);
end;
$$;
create function public.chain_drip_signed(p_wallet text, p_raw text, p_hash text) returns boolean
language sql security invoker set search_path = '' as $$
  with changed as (
    update public.chain_guest_drips set raw_tx=p_raw, tx_hash=p_hash, status='pending'
    where wallet=p_wallet and (raw_tx is null or raw_tx=p_raw) and status in ('reserved','pending') returning 1
  ) select exists(select 1 from changed);
$$;
create function public.chain_drip_result(p_wallet text, p_hash text, p_success boolean) returns boolean
language sql security invoker set search_path = '' as $$
  with changed as (
    update public.chain_guest_drips set status=case when p_success then 'confirmed' else 'failed' end
    where wallet=p_wallet and tx_hash=p_hash and status='pending' returning 1
  ) select exists(select 1 from changed);
$$;
revoke all on function public.chain_drip_reserve(uuid,text,text,text,bigint,numeric,numeric) from public,anon,authenticated;
revoke all on function public.chain_drip_signed(text,text,text) from public,anon,authenticated;
revoke all on function public.chain_drip_result(text,text,boolean) from public,anon,authenticated;
grant execute on function public.chain_drip_reserve(uuid,text,text,text,bigint,numeric,numeric) to service_role;
grant execute on function public.chain_drip_signed(text,text,text) to service_role;
grant execute on function public.chain_drip_result(text,text,boolean) to service_role;
