-- An expired authorization may be renewed, but its economic promise is never
-- released or changed. Keep the original reservation and append only validity
-- windows for the SAME nonce/amount/week. The signer verifies fresh Fuji state.
create table public.chain_reward_renewals (
  source_id text not null,
  receipt_id text not null,
  observed_at bigint not null check (observed_at>=0),
  expiry bigint not null check (expiry>=observed_at+15 and expiry<=observed_at+600),
  primary key(source_id,receipt_id,expiry),
  foreign key(source_id,receipt_id) references public.chain_reward_reservations(source_id,receipt_id)
);
alter table public.chain_reward_renewals enable row level security;
revoke all on public.chain_reward_renewals from public,anon,authenticated,service_role;
grant select on public.chain_reward_renewals to service_role;

create function public.chain_reward_renew(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.chain_reward_reservations; prior public.chain_reward_reservations;
  latest public.chain_reward_renewals;
begin
  r:=jsonb_populate_record(null::public.chain_reward_reservations,p);
  perform pg_advisory_xact_lock(431150);
  select * into prior from public.chain_reward_reservations
    where source_id=r.source_id and receipt_id=r.receipt_id;
  if prior.receipt_id is null then raise exception 'routine_unearned';end if;
  if (to_jsonb(prior)-'expiry'-'observed_at') is distinct from (to_jsonb(r)-'expiry'-'observed_at') then
    raise exception 'routine_conflict';end if;
  if not exists(select 1 from public.players where id=r.player_id and wallet=r.wallet) then
    raise exception 'unauthenticated';end if;
  if not exists(select 1 from public.chain_reward_budgets b join public.chain_source_policies s on s.source_id=b.source_id
    where b.id=r.budget_id and b.enabled and s.enabled and b.rules_hash=r.rules_hash and s.rules_hash=r.rules_hash) then
    raise exception 'routine_disabled';end if;
  if r.observed_at is null or r.expiry is null or r.observed_at<prior.observed_at or
    r.expiry<r.observed_at+15 or r.expiry>r.observed_at+600 then raise exception 'routine_expired';end if;
  if r.week<>floor((r.observed_at-345600)::numeric/604800) or
    r.expiry>=345600+(r.week::bigint+1)*604800 then raise exception 'routine_week';end if;
  select * into latest from public.chain_reward_renewals
    where source_id=r.source_id and receipt_id=r.receipt_id order by expiry desc limit 1;
  if latest.receipt_id is not null then
    prior.expiry:=latest.expiry;prior.observed_at:=latest.observed_at;
  end if;
  -- Concurrent retries share the latest window. No new nonce, liability,
  -- weekly allowance, enabled budget or allocation is created by renewal.
  if prior.expiry>=r.observed_at+15 then return to_jsonb(prior);end if;
  insert into public.chain_reward_renewals values(r.source_id,r.receipt_id,r.observed_at,r.expiry);
  return to_jsonb(r);
end;
$$;
revoke all on function public.chain_reward_renew(jsonb) from public,anon,authenticated;
grant execute on function public.chain_reward_renew(jsonb) to service_role;
