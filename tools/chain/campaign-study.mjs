// Actual server transition engine, seeded agents and finite source budgets.
// No injected wins, items, currencies, production policy or human-uptake claim.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadRules,root} from '../cardrpg-sim/load.mjs';
const loaded=await loadRules();
try{
 const {campaignStep}=await loaded.load('supabase/functions/_shared/chain-campaign.ts');
 const {CAMPAIGN_RULES_HASH}=await loaded.load('supabase/functions/_shared/chain-campaign-manifest.ts');
 const {createDepthAccount}=await loaded.load('packages/game-rules/src/cardrpg/depth/state.ts');
 const {setGameplayA6}=await loaded.load('packages/game-rules/src/cardrpg/depth/gameplay-a6.ts');
 const {availableNodes,EVENTS}=await loaded.load('packages/game-rules/src/cardrpg/depth/run.ts');
 const {GEAR_BY_ID}=await loaded.load('packages/game-rules/src/cardrpg/depth/equipment.ts');
 const {TRADE_BY_ID}=await loaded.load('packages/game-rules/src/cardrpg/trade.ts');
 const {deriveSeed}=await loaded.load('packages/game-rules/src/rng.ts');
 const seeds=Array.from({length:24},(_,i)=>43113+7919*i),days=14;
 const schedules=[{name:'casual',days:[0,2,4],routes:1},{name:'regular',days:[0,1,2,3,4,5,6],routes:3},{name:'heavy',days:[0,1,2,3,4,5,6],routes:6}];
 const policies=['starter-only','equip-earned'];
 const rows=[];const epoch=Date.UTC(2026,10,9),rank={common:0,rare:1,epic:2,legendary:3};
 for(const policy of policies)for(const schedule of schedules){
  for(const seed of seeds){
   let state={game:setGameplayA6(createDepthAccount(seed,epoch),true),origins:{}},clock=epoch,sequence=0;
   const counters={starts:0,wins:0,losses:0,epic:0,legendary:0,earnedBelowLevel2:0,exported:0,exportEpic:0,exportLegendary:0,firstEligibleDay:null};
   const seen=new Set(),daily=[];
   const step=command=>{
    state=campaignStep(state,command,clock,deriveSeed(seed,++sequence));
    for(const [id,origin] of Object.entries(state.origins))if(!seen.has(id)){
     seen.add(id);const rule=TRADE_BY_ID[origin.item];
     if(rule?.tradable){counters[rule.rarity]++;if(origin.level<2)counters.earnedBelowLevel2++;else counters.firstEligibleDay??=Math.floor((clock-epoch)/86400000)+1;}
    }
   };
   // Upgrade with starter funds through the same command the browser uses.
   for(const cat of state.game.team)step({type:'level',cat});
   for(let day=0;day<days;day++){
    if(!schedule.days.includes(day%7))continue;
    clock=epoch+day*86400000;if(day>0)step({type:'idle'});
    const before={...counters},beforeSequence=sequence;
    for(let route=0;route<schedule.routes;route++){
     if(policy==='equip-earned'){
      for(const cat of state.game.team){
       // Keep starter level2 to isolate loadout policy from training decisions.
       for(const slot of ['weapon','outfit','charm','relic']){
        const occupied=new Set(Object.entries(state.game.equipment).filter(([id])=>id!==cat).flatMap(([,slots])=>Object.values(slots)));
        const candidates=state.game.gear.filter(g=>GEAR_BY_ID[g.templateId].slot===slot&&!occupied.has(g.id))
          .sort((a,b)=>rank[GEAR_BY_ID[b.templateId].rarity]-rank[GEAR_BY_ID[a.templateId].rarity]||GEAR_BY_ID[b.templateId].value-GEAR_BY_ID[a.templateId].value);
        const best=candidates[0];if(best&&state.game.equipment[cat]?.[slot]!==best.id)step({type:'equip',cat,slot,instance:best.id});
       }
      }
     }
     step({type:'start',chapter:1});counters.starts++;
     for(let turns=0;turns<50&&!state.game.run.complete;turns++){
      const run=state.game.run;let command;
      if(run.battle)command={type:'fight'};
      else if(run.rewardChoices.length)command={type:'reward',choice:run.rewardChoices[0]};
      else if(!run.current)command={type:'enter',node:availableNodes(run)[0].id};
      else {
       const node=run.nodes.find(n=>n.id===run.current);
       command={type:'resolve',choice:node.kind==='event'?EVENTS.find(e=>e.id===node.eventId).choices.find(c=>c.cost===0).id:node.kind==='treasure'?'points':node.kind==='campfire'?'heal':'leave'};
      }
      step(command);
     }
     assert(state.game.run.complete,'Retain unfinished battle as failure');
     state.game.run.won?counters.wins++:counters.losses++;
    }
    // Candidate source budget: offer at most the existing three seals/day.
    // Export does NOT imply payment, mint or market demand.
    const equipped=new Set(Object.values(state.game.equipment).flatMap(Object.values));
    const available=state.game.gear.filter(g=>!equipped.has(g.id)&&TRADE_BY_ID[g.templateId]?.tradable&&state.origins[g.id]?.level>=2).slice(0,3);
    for(const gear of available){step({type:'export',instance:gear.id,normalization:'depth-min-roll-v1'});counters.exported++;counters[GEAR_BY_ID[gear.templateId].rarity==='epic'?'exportEpic':'exportLegendary']++;assert(!state.game.gear.some(g=>g.id===gear.id));}
    assert(state.starts.count<=6);assert(state.game.account.daily.battles<=6);
    daily.push({day:day+1,starts:counters.starts-before.starts,wins:counters.wins-before.wins,epic:counters.epic-before.epic,legendary:counters.legendary-before.legendary,exports:counters.exported-before.exported,
      exportEpic:counters.exportEpic-before.exportEpic,exportLegendary:counters.exportLegendary-before.exportLegendary,commands:sequence-beforeSequence});
   }
   const owned=new Set(state.game.gear.map(g=>g.id));
   assert.equal(seen.size,counters.exported+[...seen].filter(id=>owned.has(id)).length,'Every generated instance is held or exported exactly once');
   const remainingEligible=state.game.gear.filter(g=>TRADE_BY_ID[g.templateId]?.tradable&&state.origins[g.id]?.level>=2).length;
   const seal1000=counters.exportEpic*10+counters.exportLegendary*30,seal500=seal1000/2;
   rows.push({policy,profile:schedule.name,seed,...counters,remainingEligible,seal1000,seal500,daily});
  }
  console.log(`campaign ${policy}/${schedule.name}:24 seeds completed`);
 }
 const stats=values=>{const v=[...values].sort((a,b)=>a-b);return {mean:v.reduce((a,b)=>a+b,0)/v.length,p05:v[Math.floor((v.length-1)*.05)],median:v[Math.floor((v.length-1)*.5)],p95:v[Math.floor((v.length-1)*.95)]};};
 const groups=policies.flatMap(policy=>schedules.map(s=>{const rs=rows.filter(r=>r.policy===policy&&r.profile===s.name);return {policy,profile:s.name,accounts:rs.length,starts:stats(rs.map(r=>r.starts)),winRate:stats(rs.map(r=>r.wins/r.starts)),
  epicWeek:stats(rs.map(r=>r.epic/2)),legendaryWeek:stats(rs.map(r=>r.legendary/2)),exportWeek:stats(rs.map(r=>r.exported/2)),
  seal1000:stats(rs.map(r=>r.seal1000)),seal500:stats(rs.map(r=>r.seal500)),withEligible:rs.filter(r=>r.firstEligibleDay!==null).length,
  firstEligibleDay:stats(rs.filter(r=>r.firstEligibleDay!==null).map(r=>r.firstEligibleDay))};}));
 const modelHash=createHash('sha256').update(CAMPAIGN_RULES_HASH).update(readFileSync(fileURL())).digest('hex');
 const data={version:2,rulesHash:CAMPAIGN_RULES_HASH,modelHash,seeds,days,epoch,accounts:rows.length,groups,rows,
  assumptions:['Same server campaignStep as the optional endpoint; no injected resources or victories. Independent deterministic seeds, not humans.','All profiles use actual starter funds to reach level2; no later training, invitations, craft or chapter advancement.','Starter-only retains starter loadout; equip-earned chooses by rarity then base main value, with no duplicate equipment.','Same first available route, first reward and first free event choice; no hidden-seed lookahead.','At most3 unused eligible instances exported per active day. Export is source removal, not token demand or a paid seal.','YARN costs are full eligible export costs without a balance ceiling. Judge grant20 can fund two10-YARN or four5-YARN Epics only; income from resale is not guaranteed.','This new server campaign is separate from existing browser saves and from the C2 600-account supply study. Public activation remains off.']};
 writeFileSync(resolve(root,'docs/chain/campaign-study.json'),JSON.stringify(data,null,2)+'\n');
 const fields=Object.keys(rows[0]).filter(k=>k!=='daily');writeFileSync(resolve(root,'docs/chain/campaign-study.csv'),fields.join(',')+'\n'+rows.map(r=>fields.map(k=>r[k]??'').join(',')).join('\n')+'\n');
 const f=n=>n.toFixed(2);
 writeFileSync(resolve(root,'reports/chain/CAMPAIGN-STUDY.md'),`# Server campaign source calibration

144 accounts ×14 days,24 deterministic seeds for each profile/loadout pair. Uses actual starter, battles, losses, daily quota and atomic-export transition rules. Rules hash: \`${CAMPAIGN_RULES_HASH}\`. This is a source experiment, not observed human behavior, verified bot identity, paid seals or a healthy token economy.

| Loadout | Profile | Win rate mean | Epic/week mean | Legendary/week mean | Export/week mean | Full14d seal cost10% /5% | First eligible day median /p95 |
|---|---|---:|---:|---:|---:|---:|---:|
${groups.map(g=>`|${g.policy}|${g.profile}|${f(g.winRate.mean*100)}%|${f(g.epicWeek.mean)}|${f(g.legendaryWeek.mean)}|${f(g.exportWeek.mean)}|${f(g.seal1000.mean)} / ${f(g.seal500.mean)}|${g.firstEligibleDay.median} / ${g.firstEligibleDay.p95}|`).join('\n')}

${data.assumptions.map(s=>'- '+s).join('\n')}

Conservation checked for every account: each generated instance remains in inventory or has exactly one export; equipped gear cannot export. Daily starts and rewarded-route counters never exceed6. Week values divide total14-calendar-day production by2; casual plays three days/week, regular three routes/day, heavy six routes/day.

The6-start cap bounds seed sampling and computation. It is not a population-level supply control: more wallets can still add source. The3-seal/day cap cannot establish affordability. Do not increase rewards merely to absorb all exports. Keep candidate5% and routine issuance disabled pending their separate gates; use earned surplus for optional cosmetics while preserving scarce gameplay loadouts.
`);
 console.log(JSON.stringify({accounts:rows.length,groups,rulesHash:CAMPAIGN_RULES_HASH},null,2));
}finally{await loaded.vite.close();}
function fileURL(){return new URL(import.meta.url);}
