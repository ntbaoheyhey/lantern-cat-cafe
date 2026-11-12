-- Earned campaign facts, not token promises. No program or payout is enabled.
create table public.chain_campaign_results (
  player_id uuid not null references public.chain_campaigns(player_id),
  run_id integer not null check(run_id>0),
  revision integer not null check(revision>0),
  wallet text not null check(wallet ~ '^0x[0-9a-f]{40}$'),
  rules_hash text not null check(rules_hash ~ '^[0-9a-f]{64}$'),
  chapter integer not null check(chapter between 1 and 3),
  completed_at timestamptz not null,
  primary key(player_id,run_id),
  foreign key(player_id,revision) references public.chain_campaign_actions(player_id,revision) deferrable initially deferred
);
create index chain_campaign_results_period on public.chain_campaign_results(rules_hash,completed_at);
create table public.chain_campaign_reward_programs (
  contract text primary key check(contract ~ '^0x[0-9a-f]{40}$'),
  epoch bigint not null check(epoch>=345600 and (epoch-345600)%604800=0),
  rules_hash text not null check(rules_hash ~ '^[0-9a-f]{64}$'),
  first_season integer not null check(first_season>=0),
  last_season integer not null check(last_season=first_season),
  enabled boolean not null default false
);
create table public.chain_campaign_rank_snapshots (
  contract text not null references public.chain_campaign_reward_programs(contract),
  season integer not null check(season>=0),
  rules_hash text not null check(rules_hash ~ '^[0-9a-f]{64}$'),
  closed_at timestamptz not null,
  scores jsonb not null check(jsonb_typeof(scores)='array'),
  primary key(contract,season)
);
alter table public.chain_campaign_results enable row level security;
alter table public.chain_campaign_reward_programs enable row level security;
alter table public.chain_campaign_rank_snapshots enable row level security;
revoke all on public.chain_campaign_results,public.chain_campaign_reward_programs,public.chain_campaign_rank_snapshots from public,anon,authenticated,service_role;
grant select on public.chain_campaign_results,public.chain_campaign_reward_programs,public.chain_campaign_rank_snapshots to service_role;
-- Configuration is installed explicitly by the database owner after verifying
-- seasonEpoch/rules and funding. The service can pause, not replace its terms.
grant update(enabled) on public.chain_campaign_reward_programs to service_role;

create function public.chain_campaign_record_result() returns trigger
language plpgsql security definer set search_path='' as $$
declare prior jsonb:=old.state#>'{game,run}'; current_run jsonb:=new.state#>'{game,run}';
begin
  if new.revision=old.revision+1 and prior->>'complete'='false' and
     current_run->>'complete'='true' and current_run->>'won'='true' and
     current_run->>'mode'='campaign' and prior->>'id'=current_run->>'id' then
    if not exists(select 1 from jsonb_array_elements(prior->'nodes') n
      where n->>'id'=prior->>'current' and n->>'kind'='boss') then
      raise exception 'campaign_boss_evidence';end if;
    -- A close and an in-flight win use the same lock. Completion time is sampled
    -- AFTER acquiring it: a waiting transaction cannot backdate an old season.
    perform pg_advisory_xact_lock(431160);
    insert into public.chain_campaign_results(player_id,run_id,revision,wallet,rules_hash,chapter,completed_at)
      values(new.player_id,(current_run->>'id')::integer,new.revision,new.wallet,new.rules_hash,
        (current_run->>'chapter')::integer,clock_timestamp());
  end if;
  return new;
end;$$;
create trigger chain_campaign_result after update on public.chain_campaigns
for each row execute function public.chain_campaign_record_result();
revoke all on function public.chain_campaign_record_result() from public,anon,authenticated,service_role;

create function public.chain_campaign_close_season(p_contract text,p_season integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cfg public.chain_campaign_reward_programs; saved public.chain_campaign_rank_snapshots;
  starts bigint; ends bigint; stamp timestamptz; scores jsonb;
begin
  perform pg_advisory_xact_lock(431160);
  stamp:=clock_timestamp();
  select * into cfg from public.chain_campaign_reward_programs where contract=p_contract for share;
  if cfg.contract is null or not cfg.enabled then raise exception 'routine_disabled';end if;
  if p_season is null or p_season<cfg.first_season or p_season>cfg.last_season then raise exception 'routine_period';end if;
  starts:=cfg.epoch+p_season::bigint*7862400;ends:=starts+7862400;
  if extract(epoch from stamp)<ends then raise exception 'routine_unfinalized';end if;
  select * into saved from public.chain_campaign_rank_snapshots where contract=p_contract and season=p_season;
  if saved.contract is not null then return to_jsonb(saved);end if;
  -- Best chapter per Monday week, maximum39/season. Repeating an already-won
  -- chapter, trading, payment and inventory wealth never increase this score.
  with weekly as (
    select player_id,wallet,floor((extract(epoch from completed_at)-345600)/604800) as week,max(chapter) as best
    from public.chain_campaign_results
    where rules_hash=cfg.rules_hash and completed_at>=to_timestamp(starts) and completed_at<to_timestamp(ends)
    group by player_id,wallet,week
  ), totals as (
    select player_id,wallet,sum(best)::integer as score,count(*)::integer as weeks from weekly group by player_id,wallet
  ) select coalesce(jsonb_agg(jsonb_build_object('player',player_id,'wallet',wallet,'score',score,'weeks',weeks)
      order by player_id),'[]'::jsonb) into scores from totals;
  insert into public.chain_campaign_rank_snapshots values(p_contract,p_season,cfg.rules_hash,stamp,scores) returning * into saved;
  return to_jsonb(saved);
end;$$;

create function public.chain_campaign_reward_evidence(p_player uuid,p_wallet text,p_contract text,p_kind text,p_period integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.chain_campaign_reward_programs; b public.chain_reward_budgets; earned public.chain_reward_budgets;
  fact public.chain_campaign_results; rank_snapshot jsonb; stamp bigint:=floor(extract(epoch from clock_timestamp()));
  week integer; claim_season integer; earned_season integer;
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  select * into cfg from public.chain_campaign_reward_programs where contract=p_contract for share;
  if cfg.contract is null or not cfg.enabled then raise exception 'routine_disabled';end if;
  if not exists(select 1 from public.chain_source_policies where source_id='campaign-journal-v1' and rules_hash=cfg.rules_hash and enabled)
    then raise exception 'routine_disabled';end if;
  if stamp<cfg.epoch then raise exception 'routine_period';end if;
  week:=floor((stamp-345600)::numeric/604800);claim_season:=floor((stamp-cfg.epoch)::numeric/7862400);
  if p_kind='weekly-boss' then
    if p_period is distinct from week then raise exception 'routine_period';end if;
    earned_season:=claim_season;
  elsif p_kind='season-rank' then
    if p_period is distinct from claim_season-1 then raise exception 'routine_period';end if;
    earned_season:=p_period;
  else raise exception 'routine_kind';end if;
  if earned_season<cfg.first_season or earned_season>cfg.last_season then raise exception 'routine_period';end if;
  select * into b from public.chain_reward_budgets where contract=p_contract and season=claim_season;
  if b.id is null or not b.enabled or b.source_id<>'campaign-journal-v1' or b.rules_hash<>cfg.rules_hash then raise exception 'routine_disabled';end if;
  if p_kind='weekly-boss' then
    select * into fact from public.chain_campaign_results where player_id=p_player and wallet=p_wallet and rules_hash=cfg.rules_hash
      and completed_at>=to_timestamp(345600+week::bigint*604800) and completed_at<to_timestamp(345600+(week::bigint+1)*604800)
      order by completed_at,run_id limit 1;
    if fact.player_id is null then raise exception 'routine_unearned';end if;
  else
    -- Rank terms belong to the earning season, not the later settlement budget.
    -- A closed/paused old budget still describes the immutable earned terms.
    select * into earned from public.chain_reward_budgets where contract=p_contract and season=earned_season;
    if earned.id is null or earned.source_id<>'campaign-journal-v1' or earned.rules_hash<>cfg.rules_hash
      then raise exception 'routine_earning_budget';end if;
    rank_snapshot:=public.chain_campaign_close_season(p_contract,p_period);
  end if;
  return jsonb_build_object('program',to_jsonb(cfg),'budget',to_jsonb(b),'earningBudget',case when earned.id is null then null else to_jsonb(earned) end,
    'boss',case when fact.player_id is null then null else to_jsonb(fact) end,'rank',rank_snapshot);
end;$$;
revoke all on function public.chain_campaign_close_season(text,integer),public.chain_campaign_reward_evidence(uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.chain_campaign_close_season(text,integer),public.chain_campaign_reward_evidence(uuid,text,text,text,integer) to service_role;
