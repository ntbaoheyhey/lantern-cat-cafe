-- Approved from docs/proposals/rate-limit-v2.md (U-3), per-player budgets only. Apply by hand; idempotent.
-- Per-IP budgets and the proxy envelope are NOT part of this migration: no trusted IP header contract is verified yet.
-- Counters live in a private table; only the service_role RPC can touch it. GCRA, no fixed-window boundary doubling.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.v2_request_budgets (
  bucket text primary key check (length(bucket) between 1 and 240),
  tat timestamptz not null,
  expires_at timestamptz not null
);
create index if not exists v2_request_budgets_expiry on private.v2_request_budgets (expires_at);
alter table private.v2_request_budgets enable row level security;
revoke all on private.v2_request_budgets from public, anon, authenticated;

-- At most four SERVER-CONSTRUCTED {key, perMinute, burst} budgets per call; keys are locked in sorted order.
-- A denied later budget can conservatively charge earlier budgets; this is intentional.
create or replace function public.v2_take_budgets(p_budgets jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  b jsonb;
  k text;
  rate integer;
  burst integer;
  step interval;
  tolerance interval;
  now_at timestamptz := clock_timestamp();
  accepted_at timestamptz;
  current_tat timestamptz;
begin
  if jsonb_typeof(p_budgets) is distinct from 'array'
     or jsonb_array_length(p_budgets) not between 1 and 4 then
    raise exception 'invalid budgets';
  end if;
  for b in select value from jsonb_array_elements(p_budgets) order by value->>'key' loop
    k := b->>'key'; rate := (b->>'perMinute')::integer; burst := (b->>'burst')::integer;
    if k is null or length(k) not between 1 and 240 or rate is null or burst is null
       or rate not between 1 and 10000 or burst not between 1 and 1000 then
      raise exception 'invalid budget';
    end if;
    step := interval '60 seconds' / rate;
    tolerance := (burst - 1) * step;
    accepted_at := null;
    insert into private.v2_request_budgets as limits (bucket, tat, expires_at)
      values (k, now_at + step, now_at + interval '1 day')
    on conflict (bucket) do update
      set tat = greatest(limits.tat, now_at) + step,
          expires_at = now_at + interval '1 day'
      where limits.tat <= now_at + tolerance
    returning tat into accepted_at;
    if accepted_at is null then
      select tat into current_tat from private.v2_request_budgets where bucket = k;
      return jsonb_build_object('allowed', false, 'retryAfter',
        greatest(1, ceil(extract(epoch from current_tat - tolerance - now_at))::integer));
    end if;
  end loop;
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.v2_take_budgets(jsonb) from public, anon, authenticated;
grant execute on function public.v2_take_budgets(jsonb) to service_role;

create or replace function public.v2_cleanup_budgets() returns void
language sql volatile security definer set search_path = '' as $$
  delete from private.v2_request_budgets where bucket in (
    select bucket from private.v2_request_budgets where expires_at < now()
    order by expires_at limit 1000
  );
$$;
revoke all on function public.v2_cleanup_budgets() from public, anon, authenticated;
grant execute on function public.v2_cleanup_budgets() to service_role;
commit;
