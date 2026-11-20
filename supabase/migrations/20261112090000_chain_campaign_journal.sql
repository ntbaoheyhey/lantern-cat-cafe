-- Optional server-owned campaign. No browser writes and no live activation.
create table public.chain_campaigns (
  player_id uuid primary key references public.players(id),
  wallet text not null check(wallet ~ '^0x[0-9a-f]{40}$'),
  rules_hash text not null check(rules_hash ~ '^[0-9a-f]{64}$'),
  revision integer not null default 0 check(revision>=0),
  state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<=2097152),
  updated_at timestamptz not null default clock_timestamp()
);
create table public.chain_campaign_actions (
  player_id uuid not null references public.chain_campaigns(player_id),
  action_id uuid not null,
  request_hash text not null check(request_hash ~ '^[0-9a-f]{64}$'),
  revision integer not null check(revision>0),
  result jsonb not null,
  primary key(player_id,action_id),unique(player_id,revision)
);
alter table public.chain_campaigns enable row level security;
alter table public.chain_campaign_actions enable row level security;
revoke all on public.chain_campaigns,public.chain_campaign_actions from public,anon,authenticated,service_role;
grant select on public.chain_campaigns,public.chain_campaign_actions to service_role;

create function public.chain_campaign_receipt(p_player uuid,p_wallet text,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  return (select result from public.chain_campaign_actions where player_id=p_player and action_id=p_id);
end;$$;

create function public.chain_campaign_boot(p_player uuid,p_wallet text,p_rules text,p_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare saved public.chain_campaigns;
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  if not exists(select 1 from public.chain_source_policies where source_id='campaign-journal-v1' and enabled and rules_hash=p_rules) then raise exception 'campaign_disabled';end if;
  insert into public.chain_campaigns(player_id,wallet,rules_hash,state) values(p_player,p_wallet,p_rules,p_state) on conflict(player_id) do nothing;
  select * into saved from public.chain_campaigns where player_id=p_player;
  if saved.wallet is distinct from p_wallet then raise exception 'unauthenticated';end if;
  return jsonb_build_object('revision',saved.revision,'rules_hash',saved.rules_hash,'state',saved.state,'updated_at',saved.updated_at);
end;$$;

create function public.chain_campaign_commit(p_player uuid,p_wallet text,p_rules text,p_id uuid,
  p_request text,p_revision integer,p_state jsonb,p_export text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare saved public.chain_campaigns; previous public.chain_campaign_actions; receipt jsonb;
  gear jsonb; origin jsonb; inventory uuid; stamp timestamptz:=now(); snapshot jsonb; output jsonb;
begin
  if not exists(select 1 from public.players where id=p_player and wallet=p_wallet) then raise exception 'unauthenticated';end if;
  -- One state transition wins, including export versus equip/salvage.
  select * into saved from public.chain_campaigns where player_id=p_player for update;
  if saved.player_id is null or saved.wallet is distinct from p_wallet then raise exception 'unauthenticated';end if;
  select * into previous from public.chain_campaign_actions where player_id=p_player and action_id=p_id;
  if previous.action_id is not null then
    if previous.request_hash is distinct from p_request then raise exception 'campaign_conflict';end if;
    return previous.result;
  end if;
  if saved.rules_hash is distinct from p_rules then raise exception 'campaign_rules_changed';end if;
  if not exists(select 1 from public.chain_source_policies where source_id='campaign-journal-v1' and enabled and rules_hash=p_rules) then raise exception 'campaign_disabled';end if;
  if saved.revision is distinct from p_revision then raise exception 'campaign_stale';end if;
  if p_export is not null then
    select value into gear from jsonb_array_elements(saved.state#>'{game,gear}') where value->>'id'=p_export;
    origin:=saved.state->'origins'->p_export;
    if gear is null or origin is null or origin->>'item' is distinct from gear->>'templateId'
      or exists(select 1 from jsonb_array_elements(p_state#>'{game,gear}') where value->>'id'=p_export)
      or (saved.state#>'{game,run}'<>'null'::jsonb and saved.state#>>'{game,run,complete}' is distinct from 'true')
      or exists(select 1 from jsonb_each(saved.state#>'{game,equipment}') cat,
                 lateral jsonb_each_text(cat.value) slot where slot.value=p_export)
    then raise exception 'campaign_source';end if;
    -- Source-instance removal, immutable receipt and sealable inventory share
    -- this transaction. An ingest/constraint failure rolls all of them back.
    receipt:=public.chain_source_ingest('campaign-journal-v1',p_id::text,p_player::text||':'||p_export,
      p_player,p_wallet,gear->>'templateId',(origin->>'level')::integer,p_rules,p_request,
      'depth-min-roll-v1',(origin->>'at')::timestamptz,stamp);
    inventory:=(receipt->>'inventory_id')::uuid;
  end if;
  update public.chain_campaigns set state=p_state,revision=revision+1,updated_at=stamp where player_id=p_player returning * into saved;
  snapshot:=jsonb_build_object('revision',saved.revision,'rules_hash',saved.rules_hash,'state',saved.state,'updated_at',saved.updated_at);
  output:=jsonb_build_object('request_hash',p_request,'snapshot',snapshot,'inventory_id',inventory);
  insert into public.chain_campaign_actions(player_id,action_id,request_hash,revision,result) values(p_player,p_id,p_request,saved.revision,output);
  return output;
end;$$;
revoke all on function public.chain_campaign_receipt(uuid,text,uuid),public.chain_campaign_boot(uuid,text,text,jsonb),
  public.chain_campaign_commit(uuid,text,text,uuid,text,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.chain_campaign_receipt(uuid,text,uuid),public.chain_campaign_boot(uuid,text,text,jsonb),
  public.chain_campaign_commit(uuid,text,text,uuid,text,integer,jsonb,text) to service_role;
