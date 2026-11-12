import {beforeAll,afterAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {as,migratedDb} from './game-db.ts';
import {createCampaign,campaignRequest,campaignStep,CAMPAIGN_SOURCE,type CampaignStore,type CampaignSnapshot,type CampaignReceipt,type CampaignState,type CampaignCommand} from '../../functions/_shared/chain-campaign.ts';
import {createDepthAccount} from '../../../packages/game-rules/src/cardrpg/depth/state.ts';
import {setGameplayA6} from '../../../packages/game-rules/src/cardrpg/depth/gameplay-a6.ts';
import {availableNodes,EVENTS} from '../../../packages/game-rules/src/cardrpg/depth/run.ts';
import {makeGear} from '../../../packages/game-rules/src/cardrpg/depth/equipment.ts';
import {TRADE_RULES} from '../../../packages/game-rules/src/cardrpg/trade.ts';
let db:PGlite,player:string;
const wallet='0x'+'7'.repeat(40),rules='c'.repeat(64);
const id=(n:number)=>'a0000000-0000-4000-8000-'+n.toString(16).padStart(12,'0');
const one=async<T>(sql:string,args:unknown[]):Promise<T>=>(await db.query<{r:T}>(sql,args)).rows[0]!.r;
const store:CampaignStore={
 boot:(p,w,r,s)=>one<CampaignSnapshot>('select chain_campaign_boot($1,$2,$3,$4) r',[p,w,r,JSON.stringify(s)]),
 receipt:(p,w,i)=>one<CampaignReceipt|null>('select chain_campaign_receipt($1,$2,$3) r',[p,w,i]),
 commit:c=>one<CampaignReceipt>('select chain_campaign_commit($1,$2,$3,$4,$5,$6,$7,$8) r',[c.player,c.wallet,c.rules,c.id,c.requestHash,c.revision,JSON.stringify(c.state),c.exportInstance]),
};
const campaign=createCampaign({enabled:true,rulesHash:rules,store,seed:()=>43113});
const request=(n:number,revision:number,command:CampaignCommand)=>({id:id(n),revision,command});
beforeAll(async()=>{db=await migratedDb();player=await one<string>('select upsert_player_by_wallet($1) r',[wallet]);await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',[CAMPAIGN_SOURCE,rules]);});
afterAll(async()=>{await db?.close();});
it('rejects browser saves, seeds, clocks, victory, unknown actions and malformed commands',()=>{
 const valid=request(1,0,{type:'start',chapter:1});
 for(const patch of [{state:{}},{seed:1},{now:Date.now()},{won:true},{revision:-1},{revision:0.5},{id:'bad'},
  {command:{type:'start',chapter:4}},{command:{type:'fight',won:true}},{command:{type:'advanceLocalDay'}},
  {command:{type:'export',instance:'x',normalization:'keep-rolls'}}])expect(()=>campaignRequest({...valid,...patch})).toThrow('campaign_request');
 expect(campaignRequest(valid)).toEqual(valid);
});
it('defaults disabled before any storage operation',async()=>{
 const off=createCampaign({rulesHash:rules,store:{...store,receipt:async()=>{throw new Error('storage touched');}}});
 await expect(off(player,wallet,request(1,0,{type:'start',chapter:1}))).rejects.toThrow('campaign_disabled');
});
it('creates a server starter; response-loss retries preserve seed and revision',async()=>{
 const r=request(2,0,{type:'start',chapter:1}),first=await campaign(player,wallet,r);
 expect(first.snapshot.revision).toBe(1);expect(first.snapshot.state.game.run?.seed).toBe(43113);
 expect(first.snapshot.state.game.relics).toEqual([]);expect(first.inventory_id).toBeNull();
 expect(await campaign(player,wallet,r)).toEqual(first);
 await expect(campaign(player,'0x'+'8'.repeat(40),r)).rejects.toThrow('unauthenticated');
 await expect(campaign(player,wallet,{...r,command:{type:'start',chapter:2}})).rejects.toThrow('campaign_conflict');
 await expect(campaign(player,wallet,request(3,0,{type:'abandon'}))).rejects.toThrow('campaign_stale');
});
it('fights the existing engine from stored state and cannot settle the same fight twice',async()=>{
 const entered=await campaign(player,wallet,request(4,1,{type:'enter',node:'0-0'}));
 const fought=await campaign(player,wallet,request(5,2,{type:'fight'}));
 expect(fought.snapshot.revision).toBe(3);expect(fought.snapshot.state.game.run?.battle).toBeNull();
 expect(fought.snapshot.state.game.lastChoices.length).toBeGreaterThan(0);
 expect(entered.snapshot.state.game.run?.battle?.choices).toHaveLength(0);
 expect(await campaign(player,wallet,request(5,2,{type:'fight'}))).toEqual(fought);
 await expect(campaign(player,wallet,request(6,3,{type:'fight'}))).rejects.toThrow('campaign_rule:');
});
it('CAS rejects competing stale revisions (PGlite serialization, not multi-session proof)',async()=>{
 const current=(await store.receipt(player,wallet,id(5)))!;
 const inputs=[7,8].map(n=>({player,wallet,rules,id:id(n),requestHash:n.toString().repeat(64),revision:3,state:current.snapshot.state,exportInstance:null}));
 const outcomes=await Promise.allSettled(inputs.map(c=>store.commit(c)));
 expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(outcomes.find(r=>r.status==='rejected')).toMatchObject({reason:expect.objectContaining({message:expect.stringContaining('campaign_stale')})});
});
it('rules upgrades fail closed without resetting progress; saved responses remain recoverable',async()=>{
 await db.query('update chain_source_policies set rules_hash=$1 where source_id=$2',['d'.repeat(64),CAMPAIGN_SOURCE]);
 const next=createCampaign({enabled:true,rulesHash:'d'.repeat(64),store});
 await expect(next(player,wallet,request(9,4,{type:'abandon'}))).rejects.toThrow('campaign_rules_changed');
 expect((await campaign(player,wallet,request(5,2,{type:'fight'}))).snapshot.revision).toBe(3);
 await db.query('update chain_source_policies set rules_hash=$1 where source_id=$2',[rules,CAMPAIGN_SOURCE]);
});
it('browser roles cannot access the journal; service cannot rewrite history directly',async()=>{
 for(const role of ['anon','authenticated'] as const){
  for(const table of ['chain_campaigns','chain_campaign_actions'])await expect(as(db,role,null,()=>db.query(`select * from ${table}`))).rejects.toThrow('permission denied');
  await expect(as(db,role,null,()=>store.receipt(player,wallet,id(5)))).rejects.toThrow('permission denied');
  await expect(as(db,role,null,()=>store.boot(player,wallet,rules,{game:createDepthAccount(),origins:{}}))).rejects.toThrow('permission denied');
 }
 await expect(as(db,'service_role',null,()=>db.query('update chain_campaigns set revision=0'))).rejects.toThrow('permission denied');
 await expect(as(db,'service_role',null,()=>db.query('delete from chain_campaign_actions'))).rejects.toThrow('permission denied');
});
it('export removes one authoritative item atomically; equipped, repeated and level-one exports fail',async()=>{
 // Explicit trusted fixture for export boundaries, separate from earning proof.
 const w='0x'+'9'.repeat(40),p=await one<string>('select upsert_player_by_wallet($1) r',[w]);
 const game=setGameplayA6(createDepthAccount(43113,Date.now()-10000),true);
 const item=TRADE_RULES.find(r=>r.kind==='equipment'&&r.tradable&&r.rarity==='epic')!;
 const gear=makeGear(game,item.id,12);game.gear.push(gear);
 const state:CampaignState={game,origins:{[gear.id]:{item:item.id,level:2,at:new Date(Date.now()-5000).toISOString()}}};
 await store.boot(p,w,rules,state);
 const r=request(20,0,{type:'export',instance:gear.id,normalization:'depth-min-roll-v1'});
 await db.query('update chain_source_policies set enabled=false where source_id=$1',[CAMPAIGN_SOURCE]);
 await expect(campaign(p,w,r)).rejects.toThrow('campaign_disabled');
 expect((await db.query<{state:CampaignState}>('select state from chain_campaigns where player_id=$1',[p])).rows[0]!.state.game.gear.some(x=>x.id===gear.id)).toBe(true);
 await db.query('update chain_source_policies set enabled=true where source_id=$1',[CAMPAIGN_SOURCE]);
 const exported=await as(db,'service_role',null,()=>campaign(p,w,r));
 expect(exported.inventory_id).toBeTruthy();expect(exported.snapshot.state.game.gear.some(x=>x.id===gear.id)).toBe(false);
 expect(await campaign(p,w,r)).toEqual(exported);
 await expect(campaign(p,w,request(21,1,r.command))).rejects.toThrow('campaign_source');
 await expect(campaign(p,w,request(22,1,{type:'salvage',instance:gear.id}))).rejects.toThrow('campaign_rule:');
 expect((await db.query('select * from chain_source_receipts where player_id=$1',[p])).rows).toHaveLength(1);
 const equipped=structuredClone(state);equipped.game.equipment[game.team[0]!]!.weapon=gear.id;
 expect(()=>campaignStep(equipped,r.command,Date.now(),1)).toThrow('campaign_equipped');
 const low=structuredClone(state);low.origins[gear.id]!.level=1;
 expect(()=>campaignStep(low,r.command,Date.now(),1)).toThrow('campaign_level');
});
it('a whole route uses real rules and retains losses instead of forcing a scripted win',()=>{
 let state:CampaignState={game:setGameplayA6(createDepthAccount(43113,Date.now()),true),origins:{}};
 state=campaignStep(state,{type:'start',chapter:1},Date.now(),43113);
 for(let i=0;i<40&&!state.game.run!.complete;i++){
  const run=state.game.run!;let command:CampaignCommand;
  if(run.battle)command={type:'fight'};
  else if(run.rewardChoices.length)command={type:'reward',choice:run.rewardChoices[0]!};
  else if(!run.current)command={type:'enter',node:availableNodes(run)[0]!.id};
  else {const node=run.nodes.find(x=>x.id===run.current)!;command={type:'resolve',choice:node.kind==='event'?EVENTS.find(e=>e.id===node.eventId)!.choices.find(x=>x.cost===0)!.id:node.kind==='treasure'?'points':node.kind==='campfire'?'heal':'leave'};}
  state=campaignStep(state,command,Date.now(),43113);
 }
 expect(state.game.run!.complete).toBe(true);expect(state.game.claimedRuns).toEqual([1]);
 for(const [instance,origin] of Object.entries(state.origins))expect(state.game.gear.find(g=>g.id===instance)?.templateId).toBe(origin.item);
});
it('abandoning exposed seeds consumes the six daily starts; only server day rollover restores them',()=>{
 const now=Date.now();let state:CampaignState={game:setGameplayA6(createDepthAccount(43113,now),true),origins:{}};
 for(let i=0;i<6;i++){state=campaignStep(state,{type:'start',chapter:1},now,i);state=campaignStep(state,{type:'abandon'},now,i);}
 expect(()=>campaignStep(state,{type:'start',chapter:1},now,99)).toThrow('campaign_daily_starts');
 const tomorrow=campaignStep(state,{type:'start',chapter:1},now+86400000,99);
 expect(tomorrow.starts?.count).toBe(1);expect(tomorrow.game.account.day).toBe(2);
});
