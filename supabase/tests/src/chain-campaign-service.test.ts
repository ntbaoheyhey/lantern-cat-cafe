import {afterAll,beforeAll,it,expect} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {migratedDb} from './game-db.ts';
import {createCampaignService,campaignView} from '../../functions/_shared/chain-campaign-service.ts';
import {CAMPAIGN_SOURCE,type CampaignStore,type CampaignSnapshot,type CampaignReceipt} from '../../functions/_shared/chain-campaign.ts';
import {readChainBody,chainFailure,chainStoreError} from '../../functions/_shared/chain-http.ts';
import {createDepthAccount} from '../../../packages/game-rules/src/cardrpg/depth/state.ts';
import {setGameplayA6} from '../../../packages/game-rules/src/cardrpg/depth/gameplay-a6.ts';
let db:PGlite,player:string;
const wallet='0x'+'6'.repeat(40),rules='a'.repeat(64);
const one=async<T>(sql:string,args:unknown[]):Promise<T>=>{try{return (await db.query<{r:T}>(sql,args)).rows[0]!.r;}catch(error){throw chainStoreError(error);}};
const store:CampaignStore={
 boot:(p,w,r,s)=>one<CampaignSnapshot>('select chain_campaign_boot($1,$2,$3,$4) r',[p,w,r,JSON.stringify(s)]),
 receipt:(p,w,i)=>one<CampaignReceipt|null>('select chain_campaign_receipt($1,$2,$3) r',[p,w,i]),
 commit:c=>one<CampaignReceipt>('select chain_campaign_commit($1,$2,$3,$4,$5,$6,$7,$8) r',[c.player,c.wallet,c.rules,c.id,c.requestHash,c.revision,JSON.stringify(c.state),c.exportInstance]),
};
const service=createCampaignService({enabled:true,rulesHash:rules,store,seed:()=>43113});
beforeAll(async()=>{db=await migratedDb();player=await one<string>('select upsert_player_by_wallet($1) r',[wallet]);await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',[CAMPAIGN_SOURCE,rules]);});
afterAll(async()=>{await db?.close();});
it('returns only a public projection and no mutation on repeated state reads',async()=>{
 const a=await service(player,wallet,{action:'state'}),b=await service(player,wallet,{action:'state'});
 expect(b).toEqual(a);expect(a.view.revision).toBe(0);
 const serialized=JSON.stringify(a);for(const hidden of ['seed','origins','lastBattle','rolls','snapshot','request_hash'])expect(serialized).not.toContain('"'+hidden+'"');
 expect(a.view.choices).toContainEqual({label:'Start 1',command:{type:'start',chapter:1}});
});
it('does not accept client-authoritative fields in state or command requests',async()=>{
 await expect(service(player,wallet,{action:'state',seed:1})).rejects.toThrow('invalid_request');
 await expect(service(player,wallet,{action:'command',id:crypto.randomUUID(),revision:0,command:{type:'start',chapter:1,won:true}})).rejects.toThrow('invalid_request');
 const request=new Request('http://local',{method:'POST',body:JSON.stringify({action:'state',state:{}})});
 await expect(readChainBody(request,'chain-campaign')).rejects.toThrow('invalid_request');
});
it('projects cached receipts after response loss and exposes only the next route choices',async()=>{
 const input={action:'command',id:crypto.randomUUID(),revision:0,command:{type:'start',chapter:1}};
 const a=await service(player,wallet,input);expect(await service(player,wallet,input)).toEqual(a);
 expect(a.view.phase).toBe('route');expect(a.view.remaining).toBe(5);
 expect(a.view.choices.every(c=>c.command.type==='enter'&&c.command.node.startsWith('0-'))).toBe(true);
 expect(JSON.stringify(a)).not.toContain('"seed"');
 await expect(service(player,wallet,{...input,id:crypto.randomUUID()})).rejects.toThrow('campaign_stale');
});
it('keeps identity binding and safe failure messages through SQL',async()=>{
 await expect(service(player,'0x'+'5'.repeat(40),{action:'state'})).rejects.toThrow('unauthenticated');
 try{await service(player,wallet,{action:'command',id:crypto.randomUUID(),revision:1,command:{type:'fight'}});throw new Error('unexpected success');}
 catch(e){expect(chainFailure(e,'campaign_unavailable')).toEqual({status:409,body:{error:'campaign_choice'}});}
});
it('disabled campaigns do not create or reset a save',async()=>{
 const off=createCampaignService({rulesHash:rules,store:{...store,boot:async()=>{throw new Error('storage touched');}}});
 await expect(off(player,wallet,{action:'state'})).rejects.toThrow('campaign_disabled');
});
it('opts authoritative campaigns into v3 and refuses the legacy export route',async()=>{
 const v3Wallet='0x'+'9'.repeat(40),p=await one<string>('select upsert_player_by_wallet($1) r',[v3Wallet]);
 const v3=createCampaignService({enabled:true,economyV3:true,rulesHash:rules,store,seed:()=>43113});
 await v3(p,v3Wallet,{action:'state'});
 expect(await one<boolean>("select (state#>>'{game,economyV3}')::boolean r from chain_campaigns where player_id=$1",[p])).toBe(true);
 await expect(v3(p,v3Wallet,{action:'command',id:crypto.randomUUID(),revision:0,command:{type:'export',instance:'invented',normalization:'depth-min-roll-v1'}})).rejects.toThrow('campaign_source');
});
it('never makes starter gear exportable by catalog eligibility alone',()=>{
 const state={game:setGameplayA6(createDepthAccount(43113,Date.now()),true),origins:{}};
 const v=campaignView({revision:0,rules_hash:rules,state,updated_at:new Date().toISOString()},Date.now());
 expect(v.gear.length).toBeGreaterThan(0);expect(v.gear.every(g=>!g.eligible)).toBe(true);
});
it('projects both boons and skill-upgrade rewards after a real battle without losing the committed receipt',async()=>{
 await service(player,wallet,{action:'command',id:crypto.randomUUID(),revision:1,command:{type:'enter',node:'0-0'}});
 const input={action:'command',id:crypto.randomUUID(),revision:2,command:{type:'fight'}};
 const r=await service(player,wallet,input);expect(r.view.phase).toBe('reward');expect(r.view.choices).toHaveLength(3);
 expect(r.view.choices.some(c=>c.label==='Upgrade'&&c.command.type==='reward'&&c.command.choice.startsWith('skill:'))).toBe(true);
 expect(await service(player,wallet,input)).toEqual(r);
});
