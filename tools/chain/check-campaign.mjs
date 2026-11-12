// Server-owned starter -> real campaign actions -> earned Epic -> atomic export.
// Disposable PGlite, no server endpoint, injected items, public RPC or signing.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadModules} from './local.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const m=await loadModules(),db=await m.buildMigratedDb();
try {
 const h=createHash('sha256');
 const collect=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?collect(resolve(dir,e.name)):[resolve(dir,e.name)]);
 for(const f of collect(resolve(root,'packages/game-rules/src')).filter(f=>f.endsWith('.ts')&&!f.endsWith('.test.ts')).sort())h.update(f.slice(root.length)).update(readFileSync(f));
 h.update(readFileSync(resolve(root,'supabase/functions/_shared/chain-campaign.ts')));
 const rules=h.digest('hex'),wallet='0x'+'b'.repeat(40);
 const one=async(sql,args)=>(await db.query(sql,args)).rows[0].r;
 const player=await one('select upsert_player_by_wallet($1) r',[wallet]);
 await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',[m.CAMPAIGN_SOURCE,rules]);
 const store={boot:(p,w,r,s)=>one('select chain_campaign_boot($1,$2,$3,$4) r',[p,w,r,JSON.stringify(s)]),
  receipt:(p,w,i)=>one('select chain_campaign_receipt($1,$2,$3) r',[p,w,i]),
  commit:c=>one('select chain_campaign_commit($1,$2,$3,$4,$5,$6,$7,$8) r',[c.player,c.wallet,c.rules,c.id,c.requestHash,c.revision,JSON.stringify(c.state),c.exportInstance])};
 let sequence=0,revision=0,latest;const log=[];
 // Fixed test seed is injected on the SERVER; there is no client seed field.
 const authority=m.createCampaign({enabled:true,rulesHash:rules,store,seed:()=>43113});
 const send=async command=>{
  const input={id:'c0000000-0000-4000-8000-'+(++sequence).toString(16).padStart(12,'0'),revision,command};
  const r=await authority(player,wallet,input);assert.deepEqual(await authority(player,wallet,input),r);
  revision=r.snapshot.revision;latest=r;log.push({revision,command,inventory:r.inventory_id});return r;
 };
 // Starter resources fund these ordinary upgrades, without a currency fixture.
 for(const cat of ['mochi','soot','clover'])await send({type:'level',cat});
 let won=0,losses=0;
 for(let route=0;route<6;route++){
  await send({type:'start',chapter:1});
  for(let step=0;step<40&&!latest.snapshot.state.game.run.complete;step++){
   const run=latest.snapshot.state.game.run;let command;
   if(run.battle)command={type:'fight'};
   else if(run.rewardChoices.length)command={type:'reward',choice:run.rewardChoices[0]};
   else if(!run.current){const last=run.nodes.find(x=>x.id===run.visited.at(-1));command={type:'enter',node:run.nodes.find(x=>last?last.next.includes(x.id):x.depth===0).id};}
   else {const node=run.nodes.find(x=>x.id===run.current);command={type:'resolve',choice:node.kind==='event'?({'chipped-cup':'recycle','lost-seed':'brew','quiet-bell':'leave'}[node.eventId]):node.kind==='treasure'?'points':node.kind==='campfire'?'heal':'leave'};}
   await send(command);
  }
  const game=latest.snapshot.state.game;assert(game.run.complete);game.run.won?won++:losses++;
  const earned=game.gear.find(g=>m.TRADE_RULES.find(t=>t.id===g.templateId)?.tradable&&latest.snapshot.state.origins[g.id]?.level>=2);
  if(earned){
   const r=await send({type:'export',instance:earned.id,normalization:'depth-min-roll-v1'});
   assert(r.inventory_id);assert(!r.snapshot.state.game.gear.some(g=>g.id===earned.id));
   const rows=(await db.query('select * from chain_inventory where id=$1',[r.inventory_id])).rows;
   assert.equal(rows.length,1);assert.equal(rows[0].item_id,earned.templateId);
   const sources=(await db.query('select * from chain_source_receipts where player_id=$1',[player])).rows;
   assert.equal(sources.length,1);assert.equal(sources[0].instance_id,player+':'+earned.id);
   const completions=(await db.query('select * from chain_campaign_results where player_id=$1',[player])).rows;
   assert.equal(completions.length,won,'Each won route records one immutable boss fact in the same transaction');
   assert(completions.every(f=>f.wallet===wallet&&f.rules_hash===rules&&f.chapter===1));
   const result={version:2,pass:true,rulesHash:rules,serverSeed:43113,routeWins:won,routeLosses:losses,recordedBossFacts:completions.length,
    stateRevision:revision,earnedTemplate:earned.templateId,earnedLevel:sources[0].earned_level,
    inventoryId:r.inventory_id,actions:log,publicTransactions:0,
    limitations:'One deterministic locally executed starter profile, no injected items/currency. Not population supply, public campaign integration, human telemetry or bot identity.'};
   writeFileSync(resolve(root,'reports/chain/CAMPAIGN-LOCAL.json'),JSON.stringify(result,null,2)+'\n');
   console.log(JSON.stringify({...result,actions:log.length},null,2));break;
  }
 }
 assert(latest.inventory_id,'No eligible earned drop in this fixed six-route proof; retain the failure, do not inject an item.');
} finally {await db.close();await m.close();}
