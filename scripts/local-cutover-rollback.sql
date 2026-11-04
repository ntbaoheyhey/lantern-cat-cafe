-- DISPOSABLE LOCAL REHEARSAL ONLY. Never execute against a hosted project.
-- Removes v2 gameplay after the integrity rollback; preserves shared security.
-- Drops gameplay RPCs and six gameplay tables; keeps budget RPCs and shared objects.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'v2\_%'
       and p.proname not in ('v2_take_budgets', 'v2_cleanup_budgets')
  loop
    execute 'drop function ' || r.sig;
  end loop;
end $$;
drop table public.boss_fights, public.boss_clears, public.founder_grants, public.items,
  public.player_stacks, public.cat_state;
