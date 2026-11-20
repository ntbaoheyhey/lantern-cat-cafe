-- Authoritative testnet inventory only. Imported/offline saves are never read here.
create table public.chain_inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  item_id text not null,
  source text not null,
  earned_level integer not null check (earned_level>=1),
  state text not null default 'available' check(state in ('available','reserved','consumed')),
  unique(player_id,source)
);
create table public.chain_seals (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null unique references public.chain_inventory(id),
  player_id uuid not null references public.players(id),
  item_id text not null,
  token_id integer not null check(token_id>=10000),
  rarity integer not null check(rarity between 0 and 3),
  cost text not null check(cost ~ '^[1-9][0-9]*$'),
  paid boolean not null default false,
  created_at timestamptz not null default now()
);
create index chain_seals_day on public.chain_seals(player_id,created_at);
alter table public.chain_inventory enable row level security;
alter table public.chain_seals enable row level security;
revoke all on public.chain_inventory,public.chain_seals from public,anon,authenticated;
grant select,insert,update on public.chain_inventory,public.chain_seals to service_role;

-- The fixed server-run boss is the only live source. Future campaign issuance needs C2 authority.
create function public.chain_item_inventory(p_player uuid,p_wallet text) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  if exists(select 1 from public.chain_entitlements where player_id=p_player and source='judge-boss') then
    insert into public.chain_inventory(player_id,item_id,source,earned_level) values(p_player,'star-thread','judge-boss-material',2)
      on conflict(player_id,source) do nothing;
  end if;
  return (select coalesce(jsonb_agg(to_jsonb(i)||jsonb_build_object('seal',to_jsonb(s)) order by i.id),'[]'::jsonb)
    from public.chain_inventory i left join public.chain_seals s on s.inventory_id=i.id where i.player_id=p_player);
end;
$$;
create function public.chain_seal_reserve(p_player uuid,p_wallet text,p_inventory uuid,p_token integer,p_rarity integer,p_cost text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare item public.chain_inventory; intent public.chain_seals;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_player::text,43113));
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  select * into item from public.chain_inventory where id=p_inventory and player_id=p_player for update;
  if item.id is null then raise exception 'no_item';end if;
  select * into intent from public.chain_seals where inventory_id=item.id;
  if intent.id is not null then return to_jsonb(intent);end if;
  if item.state<>'available' or item.earned_level<2 then raise exception 'level_or_inventory';end if;
  if (select count(*) from public.chain_seals where player_id=p_player and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=3 then raise exception 'daily_limit';end if;
  insert into public.chain_seals(player_id,inventory_id,item_id,token_id,rarity,cost)
    values(p_player,p_inventory,item.item_id,p_token,p_rarity,p_cost) returning * into intent;
  update public.chain_inventory set state='reserved' where id=item.id;
  return to_jsonb(intent);
end;
$$;
-- Called only after checking the immutable YARN payment record on chain 43113.
create function public.chain_seal_finalize(p_player uuid,p_intent uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare intent public.chain_seals;
begin
  select * into intent from public.chain_seals where id=p_intent and player_id=p_player for update;
  if intent.id is null then raise exception 'no_intent';end if;
  update public.chain_seals set paid=true where id=intent.id returning * into intent;
  update public.chain_inventory set state='consumed' where id=intent.inventory_id;
  return to_jsonb(intent);
end;
$$;
revoke all on function public.chain_item_inventory(uuid,text),public.chain_seal_reserve(uuid,text,uuid,integer,integer,text),public.chain_seal_finalize(uuid,uuid) from public,anon,authenticated;
grant execute on function public.chain_item_inventory(uuid,text),public.chain_seal_reserve(uuid,text,uuid,integer,integer,text),public.chain_seal_finalize(uuid,uuid) to service_role;
