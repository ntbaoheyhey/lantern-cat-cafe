-- Default-off service-owned V3 ledger. No browser save or direct client writes.
create sequence public.chain_v3_deed_ids start 30001 maxvalue 33000 no cycle;
-- Operators allocate a finite prefunded envelope before enabling. Never reset
-- reserved_net: it includes paid and still redeemable vouchers for this issuer.
create table public.chain_v3_budget(singleton boolean primary key default true check(singleton),enabled boolean not null default false,ceiling numeric(78,0) not null default 0,reserved_net numeric(78,0) not null default 0,check(ceiling>=reserved_net and reserved_net>=0));
insert into public.chain_v3_budget(singleton) values(true);
alter table public.chain_v3_budget enable row level security;
revoke all on public.chain_v3_budget from public,anon,authenticated,service_role;
create table public.chain_v3_accounts (
 player_id uuid primary key references public.players(id), wallet text not null unique,
 revision integer not null default 0, state jsonb not null,
 check(jsonb_typeof(state)='object' and octet_length(state::text)<2097152)
);
create table public.chain_v3_actions (
 player_id uuid references public.chain_v3_accounts(player_id),id uuid not null,
 request_hash text not null,result jsonb not null,primary key(player_id,id)
);
create table public.chain_v3_burns (
 tx text primary key check(tx ~ '^0x[0-9a-f]{64}$'),
 player_id uuid references public.chain_v3_accounts(player_id),intent uuid not null
);
create table public.chain_v3_deeds (
 token integer primary key check(token between 30001 and 33000),
 player_id uuid unique not null references public.chain_v3_accounts(player_id)
);
alter table public.chain_v3_accounts enable row level security;
alter table public.chain_v3_actions enable row level security;
alter table public.chain_v3_burns enable row level security;
alter table public.chain_v3_deeds enable row level security;
revoke all on public.chain_v3_accounts,public.chain_v3_actions,public.chain_v3_burns,public.chain_v3_deeds from public,anon,authenticated,service_role;
revoke all on sequence public.chain_v3_deed_ids from public,anon,authenticated,service_role;

create function public.chain_v3_read(p_player uuid,p_wallet text,p_initial jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.chain_v3_accounts; created timestamptz; c public.chain_campaigns;
begin
 if not exists(select 1 from public.chain_v3_budget where enabled) then raise exception 'campaign_disabled';end if;
 select created_at into created from public.players where id=p_player and wallet=p_wallet;
 if created is null then raise exception 'unauthenticated';end if;
 insert into public.chain_v3_accounts(player_id,wallet,state) values(p_player,p_wallet,p_initial) on conflict do nothing;
 select * into a from public.chain_v3_accounts where player_id=p_player;
 if a.wallet is distinct from p_wallet then raise exception 'unauthenticated';end if;
 select * into c from public.chain_campaigns where player_id=p_player and wallet=p_wallet;
 return jsonb_build_object('state',a.state,'revision',a.revision,'createdAt',created,
  'judge',exists(select 1 from public.chain_entitlements where player_id=p_player and source='judge-boss'),
  'campaign',case when c.player_id is null then null else jsonb_build_object('state',c.state,'revision',c.revision) end,
  'wins',coalesce((select jsonb_agg(jsonb_build_object('id',run_id,'at',completed_at,'chapter',chapter)) from public.chain_campaign_results where player_id=p_player and wallet=p_wallet),'[]'::jsonb),
  'ranks',coalesce((select jsonb_agg(to_jsonb(scores)) from (
   select floor(extract(epoch from completed_at-timestamptz '2026-11-13 00:00:00+00')/2419200)::integer season,player_id::text player,sum(chapter)::integer score
   from public.chain_campaign_results where completed_at>=timestamptz '2026-11-13 00:00:00+00'
   and completed_at < timestamptz '2026-11-13 00:00:00+00'+floor(extract(epoch from clock_timestamp()-timestamptz '2026-11-13 00:00:00+00')/2419200)*interval '28 days'
   group by season,player_id) scores),'[]'::jsonb));
end;$$;

create function public.chain_v3_receipt(p_player uuid,p_wallet text,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
 return (select result from public.chain_v3_actions where player_id=p_player and id=p_id);
end;$$;

create function public.chain_v3_commit(p_player uuid,p_wallet text,p_id uuid,p_hash text,p_revision integer,p_state jsonb,
 p_deed boolean default false,p_burn text default null,p_intent uuid default null,p_import text default null,p_campaign_revision integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.chain_v3_accounts; old public.chain_v3_actions; d integer; c public.chain_campaigns; g jsonb; output jsonb; net numeric(78,0);
begin
 select * into a from public.chain_v3_accounts where player_id=p_player for update;
 if a.player_id is null or a.wallet is distinct from p_wallet then raise exception 'unauthenticated';end if;
 select * into old from public.chain_v3_actions where player_id=p_player and id=p_id;
 if old.id is not null then
  if old.request_hash<>p_hash then raise exception 'campaign_conflict';end if;return old.result;
 end if;
 if a.revision<>p_revision then raise exception 'campaign_stale';end if;
 select coalesce(sum((i->>'net')::numeric),0) into net from jsonb_array_elements(p_state->'intents') i where i->>'kind'='withdraw' and not exists(select 1 from jsonb_array_elements(a.state->'intents') old_i where old_i->>'id'=i->>'id');
 update public.chain_v3_budget set reserved_net=reserved_net+net where enabled and ceiling-reserved_net>=net;
 if not found then raise exception 'routine_budget';end if;
 if p_deed and a.state->>'deed' is null then
  d:=nextval('public.chain_v3_deed_ids');
  insert into public.chain_v3_deeds values(d,p_player);
  p_state:=jsonb_set(p_state,'{deed}',to_jsonb(d));
 end if;
 if p_burn is not null then insert into public.chain_v3_burns values(lower(p_burn),p_player,p_intent);end if;
 if p_import is not null then
  select * into c from public.chain_campaigns where player_id=p_player and wallet=p_wallet for update;
  if c.revision is distinct from p_campaign_revision then raise exception 'campaign_stale';end if;
  select value into g from jsonb_array_elements(c.state#>'{game,gear}') where value->>'id'=p_import;
  if g is null or not (c.state->'origins' ? p_import)
   or (c.state#>'{game,run}'<>'null'::jsonb and c.state#>>'{game,run,complete}' is distinct from 'true')
   or exists(select 1 from jsonb_each(c.state#>'{game,equipment}') cat,lateral jsonb_each_text(cat.value) slot where slot.value=p_import)
  then raise exception 'campaign_source';end if;
  update public.chain_campaigns set state=jsonb_set(c.state,'{game,gear}',coalesce((select jsonb_agg(value) from jsonb_array_elements(c.state#>'{game,gear}') where value->>'id'<>p_import),'[]'::jsonb)),revision=revision+1,updated_at=clock_timestamp() where player_id=p_player;
 end if;
 update public.chain_v3_accounts set state=p_state,revision=revision+1 where player_id=p_player returning * into a;
 output:=jsonb_build_object('hash',p_hash,'state',a.state,'revision',a.revision);
 insert into public.chain_v3_actions values(p_player,p_id,p_hash,output);
 return output;
end;$$;
revoke all on function public.chain_v3_read(uuid,text,jsonb),public.chain_v3_receipt(uuid,text,uuid),public.chain_v3_commit(uuid,text,uuid,text,integer,jsonb,boolean,text,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.chain_v3_read(uuid,text,jsonb),public.chain_v3_receipt(uuid,text,uuid),public.chain_v3_commit(uuid,text,uuid,text,integer,jsonb,boolean,text,uuid,text,integer) to service_role;
