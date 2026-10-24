-- Test fixture, NOT a migration: undoes supabase/migrations/20261101000000_v2_cat_rpg.sql.
-- Drops the v2_* functions and the six v2 tables; shared tables and v1 objects are untouched.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'v2\_%'
  loop
    execute 'drop function ' || r.sig;
  end loop;
end $$;
drop table public.boss_fights, public.boss_clears, public.founder_grants, public.items,
  public.player_stacks, public.cat_state;
