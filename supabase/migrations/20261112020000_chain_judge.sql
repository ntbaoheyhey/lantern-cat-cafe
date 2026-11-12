-- Testnet judge allocation only. Service role owns issuance; wallets cannot write entitlements.
create table public.chain_judge_passes (
  wallet text primary key references public.players(wallet),
  player_id uuid not null unique references public.players(id),
  ip_hash text not null check (length(ip_hash)=64),
  created_at timestamptz not null default now()
);
create table public.chain_entitlements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  relic_id integer not null check (relic_id between 1 and 4),
  rarity_index integer not null check (rarity_index between 0 and 3),
  source text not null check (source in ('judge-1','judge-2','judge-boss')),
  created_at timestamptz not null default now(),
  unique(player_id,source)
);
alter table public.chain_judge_passes enable row level security;
alter table public.chain_entitlements enable row level security;
revoke all on public.chain_judge_passes,public.chain_entitlements from public,anon,authenticated;
grant select,insert on public.chain_judge_passes,public.chain_entitlements to service_role;
create index chain_judge_passes_day on public.chain_judge_passes(created_at);
create function public.chain_judge_reserve(p_player uuid,p_wallet text,p_ip text,p_boss boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(43113,5982);
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  if not exists(select 1 from public.chain_judge_passes where wallet=p_wallet) then
    if (select count(*) from public.chain_judge_passes where created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=50 then raise exception 'daily_limit';end if;
    if (select count(*) from public.chain_judge_passes where ip_hash=p_ip and created_at>now()-interval '24 hours')>=3 then raise exception 'ip_limit';end if;
    insert into public.chain_judge_passes(wallet,player_id,ip_hash) values(p_wallet,p_player,p_ip);
    insert into public.chain_entitlements(player_id,relic_id,rarity_index,source) values(p_player,1,0,'judge-1'),(p_player,2,1,'judge-2');
  end if;
  if p_boss then insert into public.chain_entitlements(player_id,relic_id,rarity_index,source)
    values(p_player,3,2,'judge-boss') on conflict(player_id,source) do nothing;end if;
  return (select coalesce(jsonb_agg(to_jsonb(e) order by e.relic_id),'[]'::jsonb) from public.chain_entitlements e where player_id=p_player);
end;
$$;
revoke all on function public.chain_judge_reserve(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.chain_judge_reserve(uuid,text,text,boolean) to service_role;
