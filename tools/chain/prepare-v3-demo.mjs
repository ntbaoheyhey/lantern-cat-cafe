// User-run preparation only: emits reviewable SQL; never connects to a database,
// signs a transaction, reads a private key, or changes a hosted service.
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const pool=process.argv.find(a=>a.startsWith('--pool-wei='))?.slice(11);
if(!pool||!/^[0-9]{1,28}$/.test(pool))throw Error('Supply a fresh public SeasonRewards balance with --pool-wei=<integer>.');
const unit=10n**18n,v3=600n*unit,testers=1000n*unit;
if(BigInt(pool)<v3+testers)throw Error('Pool is below the 1,600 YARN demo envelope; no SQL written.');
const registry=JSON.parse(readFileSync(resolve(root,'packages/chain/deployments/43113.json'),'utf8'));
const hash=readFileSync(resolve(root,'supabase/functions/_shared/chain-campaign-manifest.ts'),'utf8').match(/CAMPAIGN_RULES_HASH='([0-9a-f]{64})'/)?.[1];
if(!hash||!/^0x[0-9a-fA-F]{40}$/.test(registry.SeasonRewards))throw Error('Check the committed registry and campaign manifest.');
const contract=registry.SeasonRewards.toLowerCase(),prepared=new Date().toISOString();
const evidence=createHash('sha256').update(JSON.stringify({hash,contract,pool,prepared,v3:String(v3),testers:String(testers)})).digest('hex');
const sql=`-- Prepared ${prepared}; review and run within 10 minutes, with issuers disabled.
-- 600 YARN total v3 net withdrawals; 1,000 YARN total tester grants.
-- Existing larger ceilings, paid/pending reservations and player states are preserved.
begin;
select pg_advisory_xact_lock(431150);
do $v3_demo$
declare v numeric; t public.chain_tester_budgets; routine numeric;
begin
 if clock_timestamp()>timestamptz '${prepared}'+interval '10 minutes' then
  raise exception 'Refresh the public pool balance and regenerate this SQL';
 end if;
 if exists(select 1 from public.chain_campaigns where rules_hash<>'${hash}') then
  raise exception 'Existing campaigns require a reviewed rules migration; no player was reset';
 end if;
 update public.chain_v3_budget set ceiling=greatest(ceiling,${v3}) where singleton returning ceiling into v;
 if v is null then raise exception 'Apply the v3 migration first';end if;
 insert into public.chain_tester_budgets(contract,ceiling,protected_yarn,evidence_hash,enabled)
 values('${contract}','${testers}',v::text,'${evidence}',false) on conflict do nothing;
 select * into t from public.chain_tester_budgets where contract='${contract}' for update;
 select coalesce(sum(ceiling::numeric),0) into routine from public.chain_reward_budgets where contract='${contract}';
 if t.ceiling::numeric+greatest(t.protected_yarn::numeric,v)+routine>${pool} then
  raise exception 'Pool does not cover existing envelopes plus v3; fund it and regenerate';
 end if;
 update public.chain_tester_budgets set protected_yarn=greatest(protected_yarn::numeric,v)::text,enabled=true where contract='${contract}';
 update public.chain_v3_budget set enabled=true where singleton;
 insert into public.chain_source_policies(source_id,rules_hash,enabled) values('campaign-journal-v1','${hash}',true)
 on conflict(source_id) do update set rules_hash=excluded.rules_hash,enabled=true;
end;$v3_demo$;
commit;
select enabled,ceiling,reserved_net from public.chain_v3_budget;
select contract,ceiling,protected_yarn,enabled from public.chain_tester_budgets where contract='${contract}';
`;
const dir=resolve(root,'work/v3-shell');mkdirSync(dir,{recursive:true});
const output=resolve(dir,'activate-demo.sql');writeFileSync(output,sql);
console.log(`Prepared ${output}. Review in Supabase SQL Editor; no SQL was executed.`);
