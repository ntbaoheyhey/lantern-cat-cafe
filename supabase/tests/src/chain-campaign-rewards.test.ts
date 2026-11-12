import {beforeAll,afterAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import type {Address} from 'viem';
import {as,migratedDb} from './game-db.ts';
import {campaignRankAwards,createCampaignRewardAuthority,type CampaignRewardEvidence} from '../../functions/_shared/chain-campaign-rewards.ts';
import {createRoutinePreparation,type RoutineReservation} from '../../functions/_shared/chain-routine.ts';
let db:PGlite,serial=0;
const rules='e'.repeat(64),U=10n**18n,now=Math.floor(Date.now()/1000),week=Math.floor((now-345600)/604800),monday=345600+week*604800;
const uuid=(n:number)=>'b0000000-0000-4000-8000-'+n.toString(16).padStart(12,'0');
const addr=(n:number)=>('0x'+n.toString(16).padStart(40,'0')) as Address;
const one=async<T>(sql:string,args:unknown[]=[])=> (await db.query<{r:T}>(sql,args)).rows[0]!.r;
beforeAll(async()=>{db=await migratedDb();await db.query("insert into chain_source_policies values('campaign-journal-v1',$1,true)",[rules]);});
afterAll(async()=>{await db?.close();});

it('splits tied slots without inflating the advertised rank envelope; singleton has no top50% slot',()=>{
 const scores=Array.from({length:100},(_,i)=>({player:uuid(i),wallet:addr(i),score:39,weeks:13}));
 const awards=campaignRankAwards(scores,(15n*U/10n).toString());
 expect(new Set(awards.map(a=>a.amount))).toEqual(new Set(['242500000000000000']));
 expect(awards.reduce((n,a)=>n+BigInt(a.amount),0n)).toBe(2425n*U/100n);
 expect(campaignRankAwards(scores.slice(0,1),'1500000000000000000')[0]!.amount).toBe('0');
 expect(campaignRankAwards([...scores].reverse(),'1500000000000000000')).toEqual(awards);
});
it('preserves tier caps, exact wei and equal treatment for300 diverse population/tie patterns',()=>{
 for(let n=1;n<=300;n++){
  const scores=Array.from({length:n},(_,i)=>{const score=1+(i*7)%39;return {player:uuid(i),wallet:addr(i),score,weeks:Math.ceil(score/3)};});
  const cap=1500000000000000001n,awards=campaignRankAwards(scores,cap.toString());
  let expected=0n;
  for(let j=1;j<=n;j++)expected+=cap*BigInt(j*100<=n?6:j*10<=n?4:j*4<=n?2:j*2<=n?1:0)/6n;
  const paid=awards.reduce((x,a)=>x+BigInt(a.amount),0n);
  expect(paid<=expected).toBe(true);expect(expected-paid<BigInt(n)).toBe(true);
  for(const a of awards){expect(BigInt(a.amount)<=cap).toBe(true);expect(awards.filter(b=>b.score===a.score).every(b=>b.amount===a.amount)).toBe(true);}
 }
});
it('rejects duplicate identities, impossible scores and unsafe amounts',()=>{
 const score={player:uuid(1),wallet:addr(1),score:3,weeks:1};
 for(const bad of [{...score,score:4},{...score,weeks:0},{...score,weeks:14},{...score,wallet:'bad'}])expect(()=>campaignRankAwards([bad],'1')).toThrow('routine_scores');
 expect(()=>campaignRankAwards([score,score],'1')).toThrow('routine_scores');
 expect(()=>campaignRankAwards([score,{...score,player:uuid(2)}],'1')).toThrow('routine_scores');
 for(const bad of ['-1','1.5','01','12000000000000000001'])expect(()=>campaignRankAwards([score],bad)).toThrow('routine_amount');
});
async function setup(closed=false){
 const i=++serial,contract=addr(10000+i),epoch=monday-(closed?13*604800:0),budget='campaign-budget-'+i;
 await db.query('insert into chain_campaign_reward_programs values($1,$2,$3,0,0,true)',[contract,epoch,rules]);
 await db.query(`insert into chain_reward_budgets(id,contract,season,source_id,rules_hash,evidence_hash,ceiling,boss_max,rank_max,weekly_cap,enabled)
 values($1,$2,$3,'campaign-journal-v1',$4,$5,$6,$7,$7,$8,true)`,[budget,contract,closed?1:0,rules,'f'.repeat(64),(100n*U).toString(),(15n*U/10n).toString(),(12n*U).toString()]);
 if(closed)await db.query(`insert into chain_reward_budgets(id,contract,season,source_id,rules_hash,evidence_hash,ceiling,boss_max,rank_max,weekly_cap,enabled)
 values($1,$2,0,'campaign-journal-v1',$3,$4,$5,$6,$6,$7,false)`,[budget+'-earned',contract,rules,'f'.repeat(64),(100n*U).toString(),(15n*U/10n).toString(),(12n*U).toString()]);
 const read=(player:string,wallet:string,c:string,kind:'weekly-boss'|'season-rank',period:number)=>one<CampaignRewardEvidence>('select chain_campaign_reward_evidence($1,$2,$3,$4,$5) r',[player,wallet,c,kind,period]);
 const authority=createCampaignRewardAuthority({enabled:true,contract,epoch,rulesHash:rules,read});
 return {contract,epoch,budget,read,authority};
}
// Explicit trusted fixture for historical seasons; no claim of live human play.
async function historicalPlayer(n:number){
 const wallet=addr(20000+n),player=await one<string>('select upsert_player_by_wallet($1) r',[wallet]);
 await db.query('insert into chain_campaigns(player_id,wallet,rules_hash,state) values($1,$2,$3,$4)',[player,wallet,rules,JSON.stringify({game:{run:null},origins:{}})]);
 return {player,wallet};
}
async function result(p:{player:string;wallet:string},run:number,at:number,chapter:number){
 await db.query('insert into chain_campaign_actions(player_id,action_id,request_hash,revision,result) values($1,$2,$3,$4,$5)',[p.player,uuid(10000+run),rules,run,'{}']);
 await db.query('insert into chain_campaign_results values($1,$2,$2,$3,$4,$5,to_timestamp($6))',[p.player,run,p.wallet,rules,chapter,at]);
}
it('reads actual stored weekly evidence, preserves identities and feeds the funded reservation path',async()=>{
 const f=await setup(),p=await historicalPlayer(1),id=p.player+':weekly-boss:'+week;
 await expect(f.authority(p.player,p.wallet,id)).rejects.toThrow('routine_unearned');
 await result(p,1,now-1,1);await result(p,2,now,1);
 const evidence=await f.authority(p.player,p.wallet,id);
 expect(evidence.amount).toBe('1500000000000000000');expect(evidence.finalizedAt).toBe(now-1);
 const prepare=createRoutinePreparation({enabled:true,contract:f.contract,authority:f.authority,
  snapshot:async()=>({chainId:43113,contract:f.contract,block:1,blockHash:'0x'+'a'.repeat(64),timestamp:now,epoch:f.epoch,season:0,week,routineCap:(12n*U).toString()}),
  reserve:r=>one<RoutineReservation>('select chain_reward_reserve($1::jsonb) r',[JSON.stringify(r)])});
 const first=await prepare(p.player,p.wallet,id);expect(await prepare(p.player,p.wallet,id)).toEqual(first);
 expect((await db.query('select * from chain_reward_reservations where player_id=$1',[p.player])).rows).toHaveLength(1);
 await expect(f.authority(p.player,p.wallet,p.player+':weekly-boss:'+(week-1))).rejects.toThrow('routine_period');
 await expect(f.authority(p.player,p.wallet,uuid(999)+':weekly-boss:'+week)).rejects.toThrow('routine_identity');
});
it('archives only a closed season, counts max chapter once per week, and recovers the immutable snapshot',async()=>{
 const f=await setup(true),a=await historicalPlayer(2),b=await historicalPlayer(3);
 await result(a,1,f.epoch+1,1);await result(a,2,f.epoch+2,3);await result(a,3,f.epoch+604800+1,2);
 await result(b,1,f.epoch+1,1);await result(b,2,monday,3); // exact end belongs to NEXT season
 const snapshot=await one<{scores:Array<{player:string;score:number;weeks:number}>}>('select chain_campaign_close_season($1,0) r',[f.contract]);
 expect(snapshot.scores.find(s=>s.player===a.player)).toMatchObject({score:5,weeks:2});
 expect(snapshot.scores.find(s=>s.player===b.player)).toMatchObject({score:1,weeks:1});
 expect(await one('select chain_campaign_close_season($1,0) r',[f.contract])).toEqual(snapshot);
 const receipt=await f.authority(a.player,a.wallet,a.player+':season-rank:0');
 expect(receipt.kind).toBe('season-rank');expect(receipt.amount).toBe((U/4n).toString());
 // Changing settlement policy cannot multiply the historical award.
 await db.query('update chain_reward_budgets set rank_max=$1 where id=$2',[(6n*U).toString(),f.budget]);
 expect((await f.authority(a.player,a.wallet,a.player+':season-rank:0')).amount).toBe(receipt.amount);
 const prepare=createRoutinePreparation({enabled:true,contract:f.contract,authority:f.authority,
   snapshot:async()=>({chainId:43113,contract:f.contract,block:1,blockHash:'0x'+'a'.repeat(64),timestamp:now,epoch:f.epoch,season:1,week,routineCap:(U/10n).toString()}),
   reserve:async()=>{throw new Error('must not reserve a partial claim');}});
 await expect(prepare(a.player,a.wallet,a.player+':season-rank:0')).rejects.toThrow('routine_cap');
 await expect(as(db,'service_role',null,()=>db.query('update chain_reward_budgets set rank_max=$1 where id=$2',[(6n*U).toString(),f.budget+'-earned']))).rejects.toThrow('permission denied');
 await expect(f.authority(b.player,b.wallet,b.player+':season-rank:0')).rejects.toThrow('routine_zero_award');
 // The one-season program allows prior rank settlement, never renewed boss earning.
 await expect(f.authority(b.player,b.wallet,b.player+':weekly-boss:'+week)).rejects.toThrow('routine_period');
 const open=await setup();await expect(one('select chain_campaign_close_season($1,0) r',[open.contract])).rejects.toThrow('routine_unfinalized');
});
it('does not invent prior rank terms when only a later payout budget exists',async()=>{
 const f=await setup(true),a=await historicalPlayer(80),b=await historicalPlayer(81);
 await result(a,1,f.epoch+1,3);await result(b,1,f.epoch+1,1);
 await db.query('delete from chain_reward_budgets where id=$1',[f.budget+'-earned']);
 await expect(f.authority(a.player,a.wallet,a.player+':season-rank:0')).rejects.toThrow('routine_earning_budget');
});
it('fails closed for missing/paused programs, source rules and budgets before authorizing a claim',async()=>{
 const f=await setup(),p=await historicalPlayer(4);await result(p,1,now-1,1);const id=p.player+':weekly-boss:'+week;
 const off=createCampaignRewardAuthority({contract:f.contract,epoch:f.epoch,rulesHash:rules,read:async()=>{throw new Error('read called');}});
 await expect(off(p.player,p.wallet,id)).rejects.toThrow('routine_disabled');
 await db.query('update chain_campaign_reward_programs set enabled=false where contract=$1',[f.contract]);
 await expect(f.authority(p.player,p.wallet,id)).rejects.toThrow('routine_disabled');
 await db.query('update chain_campaign_reward_programs set enabled=true where contract=$1',[f.contract]);
 await db.query('update chain_reward_budgets set enabled=false where id=$1',[f.budget]);
 await expect(f.authority(p.player,p.wallet,id)).rejects.toThrow('routine_disabled');
});
it('browser roles cannot read/finalize evidence; service cannot invent, rewrite or delete wins or snapshots',async()=>{
 const f=await setup(),p=await historicalPlayer(5);
 for(const role of ['anon','authenticated','service_role'] as const){
  for(const table of ['chain_campaign_results','chain_campaign_rank_snapshots']){
   await expect(as(db,role,null,()=>db.query(`delete from ${table}`))).rejects.toThrow('permission denied');
   await expect(as(db,role,null,()=>db.query(`insert into ${table} default values`))).rejects.toThrow('permission denied');
  }
  if(role!=='service_role'){
   await expect(as(db,role,null,()=>db.query('select * from chain_campaign_results'))).rejects.toThrow('permission denied');
   await expect(as(db,role,null,()=>f.read(p.player,p.wallet,f.contract,'weekly-boss',week))).rejects.toThrow('permission denied');
  }
 }
 await expect(as(db,'service_role',null,()=>db.query('update chain_campaign_reward_programs set epoch=345600'))).rejects.toThrow('permission denied');
});
