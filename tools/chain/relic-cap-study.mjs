// Counterfactual candidate stats only: no C2 source edits or live bonus changes.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadRules,root} from '../cardrpg-sim/load.mjs';
const prior=JSON.parse(readFileSync(resolve(root,'docs/chain/relic-power-study.json'),'utf8'));
const walk=dir=>readdirSync(resolve(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):e.name.endsWith('.ts')?[`${dir}/${e.name}`]:[]);
const files=walk('packages/game-rules/src').sort(),sourceHash=createHash('sha256');
for(const file of files)sourceHash.update(file).update(readFileSync(resolve(root,file)));
const rulesHash=sourceHash.copy().digest('hex');
sourceHash.update(readFileSync(resolve(root,'tools/chain/relic-power-study.mjs')));
assert.equal(sourceHash.digest('hex'),prior.fingerprint,'Original sensitive-case selection must match current rules');
const {load,vite,rules}=await loadRules();
try{
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {crewStats}=await load('packages/game-rules/src/cardrpg/depth/gameplay-v4.ts');
 const bps=[0,25,50,100,200,400,800],seeds=Array.from({length:1024},(_,i)=>2900011+i*43);
 // Scenarios were selected by the previous study; these seeds were never used there.
 const scenarios=prior.holdout.map(({chapter,level,band,kind})=>({chapter,level,band,kind}));
 const hash=createHash('sha256').update(rulesHash).update(JSON.stringify({bps,seeds,scenarios})).update(readFileSync(new URL(import.meta.url))).digest('hex');
 const rows=[];
 for(const scenario of scenarios){
  const state=R.setGameplayA6(R.createDepthAccount(43113,0),true);
  for(const card of state.account.cards)card.level=scenario.level;
  const baselineCats=R.battleCats(state),map=R.generateMap(1907,scenario.chapter);
  const node=map.find(n=>scenario.kind==='boss'?n.kind==='boss':n.kind==='battle'&&n.depth===5);
  assert(node);
  const cats=bps.map(bonus=>baselineCats.map(c=>{
   const stats=R.depthStats(state,c.id);
   for(const stat of ['hp','attack','defense'])stats[stat]=Math.min(rules.CARD_RPG_CONFIG.statCaps[stat],Math.floor(stats[stat]*(1+bonus/10000)));
   return {...c,stats:crewStats(stats,state.team)};
  }));
  assert.deepEqual(cats[0],baselineCats,'Zero bonus is exact combat-input identity');
  for(const [bonus,id] of [[200,1],[400,2],[800,4]]){
   const live=structuredClone(state);live.relics=[id];live.selectedRelic=id;
   assert.deepEqual(cats[bps.indexOf(bonus)],R.battleCats(live),'Candidate transformation matches original stat/crew rounding');
  }
  const enemyStats=R.campaignEnemyStatsA6({gameplayA6:true,mode:'campaign',chapter:scenario.chapter,challengeLevel:scenario.band},node);
  const win=bps.map(()=>0),gain=bps.map(()=>0),loss=bps.map(()=>0),outcomes=createHash('sha256');
  for(const seed of seeds){
   let base=false;
   for(let i=0;i<bps.length;i++){
    const b=R.playBattle(R.createBattle({seed,chapter:scenario.chapter,cats:cats[i],enemies:node.enemies,
     gameplayA6:true,gameplayV4:true,skillsV5:true,challengeLevel:scenario.band,enemyStats}),'auto');
    assert(b.result);const won=b.result==='party';if(i===0)base=won;
    win[i]+=Number(won);gain[i]+=Number(won&&!base);loss[i]+=Number(!won&&base);
    outcomes.update(JSON.stringify([seed,bps[i],b.result,b.round,b.choices]));
   }
  }
  // Paired differences lie in[-1,1]. Hoeffding + Bonferroni is intentionally
  // conservative and covers only these36 nonzero candidate/scenario cells.
  const radiusPp=100*Math.sqrt(2*Math.log((scenarios.length*(bps.length-1))/.05)/seeds.length);
  const result={...scenario,seeds:seeds.length,seedStart:seeds[0],seedEnd:seeds.at(-1),outcomeHash:outcomes.digest('hex'),
   variants:bps.map((bonus,i)=>({bonusBps:bonus,baselineWins:win[0],wins:win[i],gain:gain[i],loss:loss[i],
    deltaPp:100*(win[i]-win[0])/seeds.length,statsEqual:JSON.stringify(cats[i])===JSON.stringify(baselineCats),
    upperPp:bonus===0?0:Math.min(100,100*(win[i]-win[0])/seeds.length+radiusPp),
    observedWithin3Pp:100*(win[i]-win[0])/seeds.length<=3}))};
  rows.push(result);console.log(JSON.stringify(result));
 }
 const result={version:1,modelHash:hash,rulesHash,sourceChanged:false,liveCandidate:0,activation:false,
  battles:rows.length*seeds.length*bps.length,scenarios,bps,seeds,rows,
  scope:'Six previously selected sensitive starter-party snapshots,1024 fresh paired seeds, automatic policy. Not population-weighted, not PvP, not all builds or progressive routes.',
  uncertainty:'One-sided95% simultaneous Hoeffding/Bonferroni upper bounds across36 nonzero cells; assumptions: independent seed draws as an engine-randomness model. Fixed pseudo-random seeds are reproducible; they do not validate player behavior or all possible scenarios. Zero is structurally identical at combat input, not statistically inferred.',
  decision:'Keep tradable CHAIN ownership purely cosmetic. No nonzero stat cap is certified globally. C2 receives these candidates and failed cases; no C2 stat/drop source edited.'};
 writeFileSync(resolve(root,'docs/chain/relic-cap-study.json'),JSON.stringify(result,null,2)+'\n');
 const table=bps.map(bonus=>{const vs=rows.map(r=>r.variants.find(v=>v.bonusBps===bonus));return `|${bonus}|${Math.max(...vs.map(v=>v.deltaPp)).toFixed(2)}|${Math.max(...vs.map(v=>v.upperPp)).toFixed(2)}|${vs.filter(v=>v.statsEqual).length}/6|`;}).join('\n');
 writeFileSync(resolve(root,'reports/chain/RELIC-CAP-STUDY.md'),`# Relic cap counterfactual — 2026-11-12\n\n${result.battles} battles; six cases selected in the previous diagnostic,1024 different paired seeds,7 candidates. The200/400/800bps transformations exactly match C2's existing stat rounding before crew synergy. Candidate0 exactly reproduces baseline combat inputs. No source changes.\n\n|Bonus bps|Worst observed delta pp|Worst simultaneous upper pp|Identical stats in tested cases|\n|---|---:|---:|---:|\n${table}\n\n${result.uncertainty}\n\n${result.scope}\n\n**Decision:0 paid combat bonus.** Small observed deltas are not a guarantee across progression or builds. Positive percentages can cross integer damage, survival and turn thresholds. Zero stat change preserves combat exactly. Keep visuals, collection display and original permanent ornaments; no YARN payout, XP, odds or reward multiplier for ownership. C2 owns any ordinary achievement progression changes.\n\nReproduce: \`node tools/chain/relic-cap-study.mjs\`. Data:\`docs/chain/relic-cap-study.json\`; fingerprint:${hash}.\n`);
 console.log(JSON.stringify({battles:result.battles,decision:result.decision}));
}finally{await vite.close();}
