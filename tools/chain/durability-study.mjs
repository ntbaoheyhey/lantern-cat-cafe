// Long-horizon falsification of the same cohort, not a forecast of retention.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mixes,simulate,summarize} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),supply=loadSourceSupply();
const policies=[
  {name:'fixed6',options:{}},{name:'fixed3',options:{entitlementBps:5000}},
  {name:'fixed1.5',options:{entitlementBps:2500}},
  {name:'closed50',options:{rewardPolicy:'closed-burn'}},
  {name:'closed75',options:{rewardPolicy:'closed-burn',burnBudgetBps:7500}},
  {name:'carry50',options:{rewardPolicy:'burn-credit'}},
];
// These targets and seeds are declared before the study; no post-result selection.
const seeds=[120011,150031,180043,210067,240089],demands=[1,.5,.25,.1],weeks=260;
const targets={cheapReachWeek:13,cheapPrice:2,cheapShare:.75,epicReachWeek:26,epicPrice:10,epicShare:.5,
  tailSeasons:4,minimumTailRoutine:1,minimumTailBurn:1};
const hash=createHash('sha256').update(JSON.stringify({supply,policies,seeds,demands,weeks,targets}));
for(const path of ['durability-study.mjs','token-sim.mjs','season-budget.mjs','grant-headroom.mjs','forge-preparation.mjs','allocation-envelope.mjs','feature-plan.mjs','supply-snapshot.mjs','../../packages/chain/src/cosmetics.ts','../../packages/chain/src/forge.ts'])hash.update(readFileSync(resolve(root,'tools/chain',path)));
const modelHash=hash.digest('hex'),out=resolve(root,'docs/chain/durability-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(out,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale durability study; rerun');
const rows=cached?.rows??[];
if(!cached)for(const policy of policies)for(const demand of demands){
  for(const mix of mixes)for(const seed of seeds){
    const s=simulate({...mix,seed},{supply,weeks,demand,...policy.options});
    const casual=s.affordability.find(p=>p.type==='casual'),tail=s.seasons.slice(-targets.tailSeasons);
    const cheapReach=casual.features[targets.cheapPrice].reachByWeek[targets.cheapReachWeek];
    const epicReach=casual.features[targets.epicPrice].reachByWeek[targets.epicReachWeek];
    const utilityTargetMet=cheapReach>=targets.cheapShare&&epicReach>=targets.epicShare;
    const tailActive=tail.every(q=>q.routine>=targets.minimumTailRoutine&&q.burn>=targets.minimumTailBurn);
    const summary=summarize(s);
    rows.push({policy:policy.name,demand,seed,...summary,cheapReach,epicReach,utilityTargetMet,tailActive,
      fiveYearClaims:s.rows.at(-1).inclusiveEmission,fiveYearBurn:s.rows.at(-1).cumulativeBurn,
      nextWeeklyCap:s.seasons.at(-1).nextWeeklyCap,tailRoutine:tail.reduce((n,q)=>n+q.routine,0),
      tailBurn:tail.reduce((n,q)=>n+q.burn,0),healthySeasons:s.seasons.filter(q=>q.healthTargetMet).length,
      zeroClaimSeasons:s.seasons.filter(q=>q.claims===0).length,
      tailCasualMedianMinimum:Math.min(...tail.map(q=>q.casualRoutineMedian)),
      allModelTargetsMet:summary.flowPass&&summary.farmingPass&&utilityTargetMet&&tailActive,
      seasons:s.seasons});
  }
  console.log(`Completed five-year ${policy.name}, demand ${demand}`);
}
const groups=policies.flatMap(p=>demands.map(demand=>{
  const rs=rows.filter(r=>r.policy===p.name&&r.demand===demand);
  return {policy:p.name,demand,runs:rs.length,flowPass:rs.filter(r=>r.flowPass&&r.farmingPass).length,
    utilityPass:rs.filter(r=>r.utilityTargetMet).length,tailActive:rs.filter(r=>r.tailActive).length,
    allPass:rs.filter(r=>r.allModelTargetsMet).length,
    worstClaimsBurn:Math.max(...rs.map(r=>r.emissionBurn??Infinity)),
    cheapReachMinimum:Math.min(...rs.map(r=>r.cheapReach)),epicReachMinimum:Math.min(...rs.map(r=>r.epicReach)),
    tailRoutineMinimum:Math.min(...rs.map(r=>r.tailRoutine)),tailBurnMinimum:Math.min(...rs.map(r=>r.tailBurn)),
    maxHealthySeasons:Math.max(...rs.map(r=>r.healthySeasons))};
}));
const result={version:1,modelHash,supply,seeds,weeks,policies,demands,targets,runs:rows.length,
  assumptions:{scope:'Same1000-wallet cohort for5years, no arrivals, no churn, no new item utility. This optimistic retention stress isolates stock saturation; it is not a forecast.',
    utility:'Design hypotheses:75% casuals can save2 routine YARN by week13;50% can save10 by week26. Excludes grants and resale; only one feature and no other spending. Rename is unshipped; Epic source requires authority. No source establishes these exact thresholds.',
    tail:'Each of the last4 seasons must have at least1 aggregate YARN of routine claims and1 of burns. This deliberately weak liveness check is not proof of meaningful engagement. Zero/zero is not healthy activity.',
    carry:'Cumulative reviewed organic burn credit less paid routine claims; unused expired allocations can carry. The model settles all outstanding season promises before credit reuse. Production would have to subtract surviving signed and unpaid liabilities atomically.',
    supply:'Current-source conditional supply continues, with finite item stock. Real bot classification, preferences, willingness and source authority remain unmeasured.',
    allocation:'Unchanged shares.52-week model years,13-week quarters; post-cliff linear releases and each bucket ceiling. Distributor custody is not vesting enforcement. External unlocked tokens do not magically buy player items.',
    authority:'No production signer, deployment, fee change, entitlement change, or evidence of real demand.'},
  acceptance:{activation:false,measuredDemand:false,allCasesPass:groups.every(g=>g.allPass===g.runs)},groups,rows};
if(!cached){
  writeFileSync(out,JSON.stringify(result,null,2)+'\n');
  const keys=Object.keys(rows[0]).filter(k=>k!=='seasons');
  writeFileSync(resolve(root,'docs/chain/durability-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
}
const n=v=>v===null?'n/a':Number(v).toFixed(2),pct=v=>Math.round(v*100)+'%';
const table=groups.map(g=>`<tr><td>${g.policy}</td><td>${pct(g.demand)}</td><td>${g.flowPass}/${g.runs}</td><td>${g.utilityPass}/${g.runs}</td><td>${g.tailActive}/${g.runs}</td><td>${g.allPass}/${g.runs}</td><td>${n(g.worstClaimsBurn)}×</td><td>${pct(g.cheapReachMinimum)}</td><td>${pct(g.epicReachMinimum)}</td></tr>`).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Five-year YARN durability</title><style>body{margin:32px auto;padding:0 20px;max-width:1100px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}h2{font-size:25px}a{color:#72d9bd}.scroll{overflow:auto}table{border-collapse:collapse;min-width:980px;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #40506b}.status{color:#ffbc83}section{border-top:1px solid #40506b;padding:20px 0}</style><p>Fuji43113 · Testnet — no real value</p><h1>A healthy-looking first year can hide a stopped economy</h1><p>${rows.length} five-year stress runs: six policies,four adoption assumptions,three player mixes,five fresh seeds. The original 52-week acceptance is retained separately.</p><p class="status">Production calibration: NOT MET. Routine rewards remain disabled. These are simulated behavioral assumptions.</p><section><h2>Three separate checks</h2><p>Flow: cumulative claims/burn≤2 and farmer rewards/hour≤3×casual. Utility:75% of casuals can save2 by week13 and50% can save10 by week26. These are declared design targets, not measured preferences. Tail: each of the final four seasons has≥1 YARN of routine rewards and≥1 YARN burned across the entire cohort. Passing flow with zero future activity cannot pass all checks.</p><p>Saving estimates exclude grants and resale income; they assume saving for one feature with no other spending. Rename2 is unshipped. Epic seal10 also needs an authoritative item. No game progress requires either purchase.</p></section><section><h2>All results, including failures</h2><div class="scroll"><table><tr><th>Policy</th><th>Adoption</th><th>Flow+farm</th><th>Utility</th><th>Active tail</th><th>All checks</th><th>Worst ratio</th><th>Save2 by13</th><th>Save10 by26</th></tr>${table}</table></div></section><section><h2>What the model can and cannot establish</h2><p>A fixed cohort eventually stops needing duplicate items. More eligible drops cannot create buyers. The carry50 variant tests whether unused,expired budget credit improves continuity without counting the same burn twice. It still obeys the deployed cap, including the permanent zero-cap state. Old unused allocations may expire; existing signed liabilities may never be reused.</p><p>Retention is assumed perfect across five years. There are no arrivals, new collections, promotional purchases or investor-funded demand. Source supply is conditional, and bot labels are known perfectly in the model. Real demand and authority remain unproven. Allocation unlocks are separate accounting ceilings, not money injected into the game market or enforced vesting.</p></section><p><a href="durability-study.json">Full assumptions and seasons</a> · <a href="durability-study.csv">Results CSV</a> · <a href="calibration-study.html">52-week policy comparison</a> · <a href="tokenomics.html">Original 52-week baseline</a></p></html>`;
writeFileSync(resolve(root,'docs/chain/durability-study.html'),html);
console.log(JSON.stringify({runs:rows.length,acceptance:result.acceptance,groups},null,2));
