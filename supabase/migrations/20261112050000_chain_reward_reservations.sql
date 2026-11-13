-- Disabled, service-only preparation ledger. No HTTP endpoint and no signer.
-- Budget rows must come from reviewed, funded, disjoint closed-period plans.
-- Reservations are conservative: even unsigned/expired rows retain their budget.
-- No delete/refund/reissue function exists; expiry alone is never payment evidence.
create table public.chain_reward_budgets (
  id text primary key check (length(id) between 1 and 160),
  contract text not null check (contract ~ '^0x[0-9a-f]{40}$'),
  season integer not null check (season>=0),
  source_id text not null references public.chain_source_policies(source_id),
  rules_hash text not null check (rules_hash ~ '^[0-9a-f]{64}$'),
  evidence_hash text not null check (evidence_hash ~ '^[0-9a-f]{64}$'),
  ceiling text not null check (ceiling ~ '^[1-9][0-9]{0,27}$' and ceiling::numeric<=1000000000000000000000000000),
  boss_max text not null check (boss_max ~ '^(0|[1-9][0-9]{0,19})$' and boss_max::numeric<=12000000000000000000),
  rank_max text not null check (rank_max ~ '^(0|[1-9][0-9]{0,19})$' and rank_max::numeric<=12000000000000000000),
  weekly_cap text not null check (weekly_cap ~ '^(0|[1-9][0-9]{0,19})$' and weekly_cap::numeric<=12000000000000000000),
  enabled boolean not null default false,
  unique(contract,season)
);
create table public.chain_reward_reservations (
  source_id text not null references public.chain_source_policies(source_id),
  receipt_id text not null check (length(receipt_id) between 1 and 160),
  player_id uuid not null references public.players(id),
  wallet text not null check (wallet ~ '^0x[0-9a-f]{40}$'),
  kind text not null check (kind in ('weekly-boss','season-rank')),
  earning_period integer not null check (earning_period>=0),
  rules_hash text not null check (rules_hash ~ '^[0-9a-f]{64}$'),
  evidence_hash text not null check (evidence_hash ~ '^[0-9a-f]{64}$'),
  budget_id text not null references public.chain_reward_budgets(id),
  contract text not null check (contract ~ '^0x[0-9a-f]{40}$'),
  policy_cap text not null check (policy_cap ~ '^(0|[1-9][0-9]{0,19})$' and policy_cap::numeric<=12000000000000000000),
  amount text not null check (amount ~ '^[1-9][0-9]{0,19}$' and amount::numeric<=12000000000000000000),
  season integer not null check (season>=0),
  week integer not null check (week>=0),
  nonce text not null unique check (nonce ~ '^(0|[1-9][0-9]{0,77})$' and nonce::numeric<115792089237316195423570985008687907853269984665640564039457584007913129639936),
  expiry bigint not null check (expiry>=0),
  observed_at bigint not null check (observed_at>=0 and expiry>=observed_at and expiry<=observed_at+600),
  primary key(source_id,receipt_id),
  -- Different source names/receipt IDs cannot pay one earned event twice.
  unique(player_id,kind,earning_period)
);
alter table public.chain_reward_budgets enable row level security;
alter table public.chain_reward_reservations enable row level security;
revoke all on public.chain_reward_budgets,public.chain_reward_reservations from public,anon,authenticated,service_role;
grant select,insert on public.chain_reward_budgets to service_role;
grant update(enabled) on public.chain_reward_budgets to service_role;
grant select on public.chain_reward_reservations to service_role;

create function public.chain_reward_reserve(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.chain_reward_reservations; prior public.chain_reward_reservations;
  b public.chain_reward_budgets; policy public.chain_source_policies;
  committed numeric; weekly numeric; maximum numeric;
begin
  r:=jsonb_populate_record(null::public.chain_reward_reservations,p);
  -- One lock across all sources, budgets and wallets makes the ceilings atomic.
  perform pg_advisory_xact_lock(431150);
  select * into b from public.chain_reward_budgets where id=r.budget_id for share;
  select * into policy from public.chain_source_policies where source_id=r.source_id for share;
  if b.id is null or not b.enabled or policy.source_id is null or not policy.enabled then
    raise exception 'routine_disabled';end if;
  if not exists(select 1 from public.players where id=r.player_id and wallet=r.wallet) then
    raise exception 'unauthenticated';end if;
  select * into prior from public.chain_reward_reservations where source_id=r.source_id and receipt_id=r.receipt_id;
  if prior.receipt_id is not null then
    -- Retry returns the original claim/expiry, not a fresh promise or budget.
    if (to_jsonb(prior)-'expiry'-'observed_at') is distinct from (to_jsonb(r)-'expiry'-'observed_at') then
      raise exception 'routine_conflict';end if;
    return to_jsonb(prior);
  end if;
  if r.source_id is distinct from b.source_id or r.rules_hash is distinct from b.rules_hash or
     r.rules_hash is distinct from policy.rules_hash or r.season is distinct from b.season or
     r.contract is distinct from b.contract then
    raise exception 'routine_policy';end if;
  if (r.kind='weekly-boss' and r.earning_period<>r.week) or
     (r.kind='season-rank' and r.earning_period<>r.season-1) then
    raise exception 'routine_period';end if;
  -- UTC Monday boundary matches SeasonRewards.currentWeek. A voucher cannot
  -- shift a reserved week's allowance into a different claim week.
  if r.week<>floor((r.observed_at-345600)::numeric/604800) or
     r.expiry>=345600+(r.week::bigint+1)*604800 then raise exception 'routine_week';end if;
  maximum:=case r.kind when 'weekly-boss' then b.boss_max::numeric when 'season-rank' then b.rank_max::numeric else 0 end;
  if r.amount::numeric>maximum then raise exception 'routine_amount';end if;
  select coalesce(sum(amount::numeric),0) into committed from public.chain_reward_reservations where budget_id=b.id;
  if committed+r.amount::numeric>b.ceiling::numeric then raise exception 'routine_budget';end if;
  select coalesce(sum(amount::numeric),0) into weekly from public.chain_reward_reservations
    where wallet=r.wallet and week=r.week;
  if weekly+r.amount::numeric>least(b.weekly_cap::numeric,r.policy_cap::numeric) then raise exception 'routine_cap';end if;
  insert into public.chain_reward_reservations select r.*;
  return to_jsonb(r);
end;
$$;
revoke all on function public.chain_reward_reserve(jsonb) from public,anon,authenticated;
grant execute on function public.chain_reward_reserve(jsonb) to service_role;
