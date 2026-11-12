// Paired diagnostic of the EXISTING A6 relic bonus. Never edits C2 rules.
// A selected grid is not a population estimate or certification of every build.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadRules,root} from '../cardrpg-sim/load.mjs';
const walk=dir=>readdirSync(resolve(root,dir),{withFileTypes:true}).flatMap(e=>
 e.isDirectory()?walk(`${dir}/${e.name}`):e.name.endsWith('.ts')?[`${dir}/${e.name}`]:[]);
const files=walk('packages/game-rules/src');
const sourceHash=createHash('sha256');
for(const file of files.sort())sourceHash.update(file).update(readFileSync(resolve(root,file)));
sourceHash.update(readFileSync(new URL(import.meta.url)));
const fingerprint=sourceHash.digest('hex');
const {load,vite}=await loadRules();
try{
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const row=(scenario,seeds)=>{
  const state=R.setGameplayA6(R.createDepthAccount(43113,0),true);
  for(const card of state.account.cards)card.level=scenario.level;
  const map=R.generateMap(1907,scenario.chapter);
  const node=map.find(n=>scenario.kind==='boss'?n.kind==='boss':n.kind==='battle'&&n.depth===5);
  assert(node,'Missing authored encounter');
  const enemyStats=R.campaignEnemyStatsA6({gameplayA6:true,mode:'campaign',chapter:scenario.chapter,challengeLevel:scenario.band},node);
  const cats=Array.from({length:5},(_,id)=>{
   const account=structuredClone(state);account.relics=id?[id]:[];account.selectedRelic=id||null;
   return R.battleCats(account);
  });
  const wins=[0,0,0,0,0],gains=[0,0,0,0,0],losses=[0,0,0,0,0],rounds=[0,0,0,0,0];
  const outcomeHash=createHash('sha256');
  for(const seed of seeds){
   let base=false;
   for(let id=0;id<5;id++){
    const b=R.playBattle(R.createBattle({seed,chapter:scenario.chapter,cats:cats[id],enemies:node.enemies,
     gameplayA6:true,gameplayV4:true,skillsV5:true,challengeLevel:scenario.band,enemyStats}),'auto');
    assert(b.result,'Unfinished battle');
    const won=b.result==='party';if(!id)base=won;
    wins[id]+=Number(won);gains[id]+=Number(won&&!base);losses[id]+=Number(!won&&base);rounds[id]+=b.round;
    outcomeHash.update(JSON.stringify([seed,id,b.result,b.round,b.choices]));
   }
  }
  return {...scenario,enemies:node.enemies,seedCount:seeds.length,seedStart:seeds[0],seedEnd:seeds.at(-1),
   resultHash:outcomeHash.digest('hex'),baselinePower:R.teamPowerV4(state),
   variants:wins.slice(1).map((n,i)=>({relicId:i+1,statBonusBps:(i+1)*200,
    baselineWins:wins[0],relicWins:n,winDeltaPp:100*(n-wins[0])/seeds.length,
    gained:gains[i+1],lost:losses[i+1],meanRounds:rounds[i+1]/seeds.length,
    observedWithin3Pp:n-wins[0]<=.03*seeds.length}))};
 };
 const exploration=[];
 for(const chapter of [1,2,3])for(const level of [1,4,10])for(const band of [1,6])for(const kind of ['battle','boss']){
  const result=row({chapter,level,band,kind},Array.from({length:64},(_,i)=>830003+i*37));
  exploration.push(result);console.log(JSON.stringify({phase:'exploration',chapter,level,band,kind,
   deltas:result.variants.map(v=>v.winDeltaPp)}));
 }
 // Deliberately select sensitive cases, then test DISJOINT seeds. No claim of
 // random scenario selection, representative player weighting or optimum bonus.
 const chosen=[...exploration].sort((a,b)=>Math.max(...b.variants.map(v=>v.winDeltaPp))-Math.max(...a.variants.map(v=>v.winDeltaPp))).slice(0,6);
 const holdout=[];
 for(const s of chosen){const result=row({chapter:s.chapter,level:s.level,band:s.band,kind:s.kind},Array.from({length:512},(_,i)=>1900003+i*41));
  holdout.push(result);console.log(JSON.stringify({phase:'holdout',chapter:s.chapter,level:s.level,band:s.band,kind:s.kind,
   deltas:result.variants.map(v=>v.winDeltaPp)}));}
 const result={version:1,fingerprint,sourceFiles:files.length,chainId:43113,sourceChanged:false,
  scope:'Existing A6 optional relic bonus; starter trio/equipment, fixed authored late-street/boss snapshots, full starting HP, automatic policy. Not a route, population win rate, PvP or manual-skill model.',
  interpretation:'Paired seeds within each scenario; six sensitive exploration cases chosen before disjoint holdout. Observed deltas are diagnostics, not confidence-certified population bounds. No fees, battle stats or C2 source changed. CHAIN Treasure/styles/ornaments remain cosmetic and do not select legacy relics.',
  battles:exploration.reduce((n,r)=>n+r.seedCount*5,0)+holdout.reduce((n,r)=>n+r.seedCount*5,0),
  exploration,holdout,maximumHoldoutDeltaPp:Math.max(...holdout.flatMap(r=>r.variants.map(v=>v.winDeltaPp))),
  legacyIntegrationAllowed:false};
 writeFileSync(resolve(root,'docs/chain/relic-power-study.json'),JSON.stringify(result,null,2)+'\n');
 const lines=holdout.flatMap(r=>r.variants.map(v=>`|${r.chapter}/${r.kind}|${r.level}/${r.band}|${v.relicId}|${v.baselineWins}/${r.seedCount}|${v.relicWins}/${r.seedCount}|${v.winDeltaPp.toFixed(2)}|${v.gained}/${v.lost}|`)).join('\n');
 writeFileSync(resolve(root,'reports/chain/RELIC-POWER-STUDY.md'),`# Paired legacy Relic diagnostic — 2026-11-12\n\n${result.scope}\n\n${result.interpretation}\n\n${result.battles} battles: 36 exploration cells ×64 seeds ×5 variants, then six selected cells ×512 different seeds ×5 variants. Holdings quantities never stack. The baseline and four rarities share each battle seed, enemy snapshot, progression and equipment. Threshold is 3 **percentage points**, not 3% relative win rate or 3% stats.\n\n|Chapter/encounter|Level/band|Relic|Baseline wins|With relic|Delta pp|Paired gain/loss|\n|---|---|---|---|---|---|---|\n${lines}\n\nLargest observed holdout increase: **${result.maximumHoldoutDeltaPp.toFixed(2)} pp**. This is not evidence to wire tradable ownership into the old stat bonus. The current CHAIN features add zero combat stats. C2 owns any combat rework; retain cosmetic-only ownership until a reviewed replacement meets the rule across relevant builds and progression.\n\nReproduce: \`node tools/chain/relic-power-study.mjs\`. Data: \`docs/chain/relic-power-study.json\`; source fingerprint: ${fingerprint}. No token transactions, network RPC, source changes or deployment.\n`);
 console.log(JSON.stringify({battles:result.battles,maximumHoldoutDeltaPp:result.maximumHoldoutDeltaPp,legacyIntegrationAllowed:false}));
}finally{await vite.close();}
