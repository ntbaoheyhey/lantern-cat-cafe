-- Disabled integration seam. This does not turn a browser save into authority.
-- A trusted producer must consume/lock the original instance in the SAME transaction
-- as chain_source_ingest, or supply an irreversible upstream consumption receipt.
create table public.chain_source_policies (
  source_id text primary key check (source_id ~ '^[a-z][a-z0-9-]{1,63}$'),
  rules_hash text not null check (rules_hash ~ '^[0-9a-f]{64}$'),
  enabled boolean not null default false
);
create table public.chain_source_receipts (
  source_id text not null references public.chain_source_policies(source_id),
  receipt_id text not null check (length(receipt_id) between 1 and 160),
  instance_id text not null check (length(instance_id) between 1 and 160),
  player_id uuid not null references public.players(id),
  wallet text not null check (wallet ~ '^0x[0-9a-f]{40}$'),
  item_id text not null check (length(item_id) between 1 and 160),
  earned_level integer not null check (earned_level >= 2),
  rules_hash text not null check (rules_hash ~ '^[0-9a-f]{64}$'),
  consumption_hash text not null check (consumption_hash ~ '^[0-9a-f]{64}$'),
  normalization_version text not null check (normalization_version='depth-min-roll-v1'),
  earned_at timestamptz not null,
  consumed_at timestamptz not null check (consumed_at>=earned_at),
  inventory_id uuid not null unique references public.chain_inventory(id),
  created_at timestamptz not null default now(),
  primary key(source_id,receipt_id),
  unique(source_id,instance_id),
  unique(source_id,consumption_hash)
);
alter table public.chain_source_policies enable row level security;
alter table public.chain_source_receipts enable row level security;
revoke all on public.chain_source_policies,public.chain_source_receipts from public,anon,authenticated,service_role;
grant select,insert,update on public.chain_source_policies to service_role;
-- Receipts are append-only through a trusted function. No browser RPC can write.
grant select on public.chain_source_receipts to service_role;

create function public.chain_source_ingest(
 p_source text,p_receipt text,p_instance text,p_player uuid,p_wallet text,p_item text,
 p_level integer,p_rules text,p_consumption text,p_normalization text,
 p_earned timestamptz,p_consumed timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare prior public.chain_source_receipts; policy public.chain_source_policies; inventory uuid;
begin
  -- Serialize across wallets: one upstream instance cannot be credited twice.
  perform pg_advisory_xact_lock(hashtextextended(p_source,431140));
  select * into policy from public.chain_source_policies where source_id=p_source for share;
  if policy.source_id is null or not policy.enabled then raise exception 'source_disabled';end if;
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  select * into prior from public.chain_source_receipts where source_id=p_source and receipt_id=p_receipt;
  if prior.receipt_id is not null then
    if row(prior.instance_id,prior.player_id,prior.wallet,prior.item_id,prior.earned_level,prior.rules_hash,
           prior.consumption_hash,prior.normalization_version,prior.earned_at,prior.consumed_at)
       is distinct from row(p_instance,p_player,p_wallet,p_item,p_level,p_rules,p_consumption,p_normalization,p_earned,p_consumed)
    then raise exception 'source_conflict';end if;
    return to_jsonb(prior);
  end if;
  if p_rules is distinct from policy.rules_hash then raise exception 'source_rules_changed';end if;
  if p_earned>now() or p_consumed>now() then raise exception 'source_future';end if;
  if exists(select 1 from public.chain_source_receipts where source_id=p_source and
     (instance_id=p_instance or consumption_hash=p_consumption)) then raise exception 'source_reused';end if;
  -- UUID namespace avoids ambiguous receipt-string concatenation or collisions
  -- with the original judge source. No upsert of an already-spent source.
  inventory:=gen_random_uuid();
  insert into public.chain_inventory(id,player_id,item_id,source,earned_level)
    values(inventory,p_player,p_item,'authority:'||inventory::text,p_level);
  insert into public.chain_source_receipts(source_id,receipt_id,instance_id,player_id,wallet,item_id,earned_level,
    rules_hash,consumption_hash,normalization_version,earned_at,consumed_at,inventory_id)
    values(p_source,p_receipt,p_instance,p_player,p_wallet,p_item,p_level,p_rules,p_consumption,p_normalization,p_earned,p_consumed,inventory)
    returning * into prior;
  return to_jsonb(prior);
end;
$$;
revoke all on function public.chain_source_ingest(text,text,text,uuid,text,text,integer,text,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.chain_source_ingest(text,text,text,uuid,text,text,integer,text,text,text,timestamptz,timestamptz) to service_role;
