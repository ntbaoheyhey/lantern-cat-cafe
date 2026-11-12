-- Optional Fuji cosmetic pilot. Permanent, bound, finite; no game-state writes.
create table public.chain_cosmetic_orders (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  wallet text not null check(wallet ~ '^0x[0-9a-f]{40}$'),
  sku text not null check(sku in ('fern','tide','ember')),
  token text not null check(token ~ '^0x[0-9a-f]{40}$'),
  cost text not null default '4000000000000000000' check(cost='4000000000000000000'),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(player_id,sku)
);
create table public.chain_cosmetic_preferences (
  player_id uuid primary key references public.players(id),
  active text check(active in ('fern','tide','ember'))
);
alter table public.chain_cosmetic_orders enable row level security;
alter table public.chain_cosmetic_preferences enable row level security;
revoke all on public.chain_cosmetic_orders,public.chain_cosmetic_preferences from public,anon,authenticated,service_role;
grant select on public.chain_cosmetic_orders,public.chain_cosmetic_preferences to service_role;

create function public.chain_cosmetic_state(p_player uuid,p_wallet text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  return jsonb_build_object('orders',(select coalesce(jsonb_agg(to_jsonb(o) order by o.sku),'[]'::jsonb)
    from public.chain_cosmetic_orders o where o.player_id=p_player and o.wallet=p_wallet),
    'active',(select active from public.chain_cosmetic_preferences where player_id=p_player));
end;
$$;
create function public.chain_cosmetic_reserve(p_player uuid,p_wallet text,p_sku text,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare intent public.chain_cosmetic_orders;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_player::text,43113));
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  if p_sku is null or p_sku not in ('fern','tide','ember') then raise exception 'invalid_request';end if;
  select * into intent from public.chain_cosmetic_orders where player_id=p_player and sku=p_sku;
  if intent.id is not null then
    if intent.token<>p_token or intent.wallet<>p_wallet then raise exception 'invalid_request';end if;
    return to_jsonb(intent);
  end if;
  insert into public.chain_cosmetic_orders(player_id,wallet,sku,token) values(p_player,p_wallet,p_sku,p_token) returning * into intent;
  return to_jsonb(intent);
end;
$$;
-- Only the authenticated Edge Function calls this after reading sealPayments.
create function public.chain_cosmetic_finalize(p_player uuid,p_wallet text,p_intent uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  update public.chain_cosmetic_orders set paid_at=coalesce(paid_at,now()) where id=p_intent and player_id=p_player and wallet=p_wallet;
  if not found then raise exception 'no_intent';end if;
  return public.chain_cosmetic_state(p_player,p_wallet);
end;
$$;
create function public.chain_cosmetic_equip(p_player uuid,p_wallet text,p_sku text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  if p_sku is null or (p_sku<>'none' and not exists(select 1 from public.chain_cosmetic_orders
    where player_id=p_player and wallet=p_wallet and sku=p_sku and paid_at is not null)) then raise exception 'cosmetic_locked';end if;
  insert into public.chain_cosmetic_preferences(player_id,active) values(p_player,nullif(p_sku,'none'))
    on conflict(player_id) do update set active=excluded.active;
  return public.chain_cosmetic_state(p_player,p_wallet);
end;
$$;
revoke all on function public.chain_cosmetic_state(uuid,text),public.chain_cosmetic_reserve(uuid,text,text,text),public.chain_cosmetic_finalize(uuid,text,uuid),public.chain_cosmetic_equip(uuid,text,text) from public,anon,authenticated;
grant execute on function public.chain_cosmetic_state(uuid,text),public.chain_cosmetic_reserve(uuid,text,text,text),public.chain_cosmetic_finalize(uuid,text,uuid),public.chain_cosmetic_equip(uuid,text,text) to service_role;
