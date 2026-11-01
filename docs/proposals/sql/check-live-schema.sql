-- Read-only catalog inventory. Paste the whole query into the Supabase SQL editor.
-- All rows must be true before the function deployment. No application RPC is called.
select 'table ' || expected.name as object, exists (
  select 1 from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname || '.' || c.relname = expected.name and c.relkind in ('r', 'p')
) as present
from (values
  ('public.cat_state'), ('public.items'), ('public.player_stacks'),
  ('public.boss_clears'), ('public.boss_fights'), ('public.founder_grants'),
  ('public.v2_action_results'), ('private.v2_request_budgets')
) as expected(name)
union all
select 'function ' || expected.signature, pg_catalog.to_regprocedure(expected.signature) is not null
from (values
  ('public.v2_craft_once(uuid,uuid,jsonb,jsonb,jsonb,integer)'),
  ('public.v2_boss_fight_once(uuid,uuid,jsonb,jsonb,jsonb)'),
  ('public.v2_action_result(uuid,text,uuid,jsonb)'),
  ('public.v2_take_budgets(jsonb)'),
  ('public.v2_cleanup_budgets()'),
  ('public.game_voucher_cancel_reissue(uuid,bigint,timestamptz)'),
  ('public.game_voucher_reissue_resolve(uuid,bigint,uuid,boolean)')
) as expected(signature)
union all
select 'policy public.siwe_nonces.siwe_nonces_server_only', exists (
  select 1 from pg_catalog.pg_policy p
  join pg_catalog.pg_class c on c.oid = p.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'siwe_nonces'
    and p.polname = 'siwe_nonces_server_only' and not p.polpermissive
    and pg_catalog.pg_get_expr(p.polqual, p.polrelid) = 'false'
    and pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) = 'false'
)
union all
select 'constraint public.relic_vouchers.relic_vouchers_status_check allows cancelled', exists (
  select 1 from pg_catalog.pg_constraint c
  join pg_catalog.pg_class t on t.oid = c.conrelid
  join pg_catalog.pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relname = 'relic_vouchers'
    and c.conname = 'relic_vouchers_status_check' and c.contype = 'c' and c.convalidated
    and pg_catalog.pg_get_constraintdef(c.oid) like '%''cancelled''%'
)
order by object;
