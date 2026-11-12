// Reproducible policy comparisons. No deploy, signing, keys or remote telemetry.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mixes,simulate,summarize} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const supply=loadSourceSupply();
const policies=[
 {name:'fixed6',options:{}},
 {name:'fixed1.5',options:{entitlementBps:2500}},
 {name:'closed25',options:{rewardPolicy:'closed-burn',burnBudgetBps:2500}},
 {name:'closed50',options:{rewardPolicy:'closed-burn',burnBudgetBps:5000}},
 {name:'closed75',options:{rewardPolicy:'closed-burn',burnBudgetBps:7500}},
 {name:'closed50-optin',options:{rewardPolicy:'closed-burn',grantPolicy:'opt-in',grantLeakage:.05}},
];
const seeds=Array.from({length:20},(_,i)=>910001+i*104729);
const candidate='closed50'; // Pre-existing 50% experiment, not selected to fit this seed set.
const fingerprint=createHash('sha256').update(JSON.stringify({supply,seeds,policies,candidate,version:1}));
for(const file of ['token-sim.mjs','season-budget.mjs','grant-headroom.mjs','forge-preparation.mjs','allocation-envelope.mjs','feature-plan.mjs','supply-snapshot.mjs','../../packages/chain/src/cosmetics.ts','../../packages/chain/src/forge.ts','calibration-study.mjs'])fingerprint.update(readFileSync(resolve(root,'tools/chain',file)));
const modelHash=fingerprint.digest('hex');
const output=resolve(root,'docs/chain/calibration-study.json');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(output,'utf8')):null;
if(cached)assert.equal(cached.modelHash,modelHash,'Stale calibration inputs; rerun the study');
const rows=cached?.rows??[];
const record=(s,extra)=>{
 const last=s.rows.at(-1),casual=s.affordability.find(p=>p.type==='casual');
 return {...extra,...summarize(s),claims:last.inclusiveEmission,burn:last.cumulativeBurn,
   organicBurn:last.cumulativeOrganicBurn,routine:last.cumulativeEmission,
   playerBalance:last.playerCirculating,treasury:last.treasury,
   casualRoutineMedian:casual.routineMedian,casualRenameShare:casual.features[2].share,
   casualEpicShare:casual.features[10].share,casualPassShare:casual.features[12].share,
   casualForgeShare:casual.features[23].share,
   lastSeasonEmission:s.rows.slice(39,52).reduce((n,r)=>n+r.emission,0),
   quotes:s.budgets.map(b=>b.bossPerWeek),seasonCommitments:s.budgets.map(b=>b.committed)};
};
if(!cached)for(const policy of policies)for(const demand of [1,.5,.25,.1]){
 for(const mix of mixes)for(let i=0;i<seeds.length;i++){
   const s=simulate({...mix,seed:seeds[i]},{supply,demand,...policy.options});
   rows.push(record(s,{policy:policy.name,split:i<5?'development':'holdout'}));
 }
 console.log(`Completed ${policy.name}, demand ${demand}`);
}
const stressSpecs=[
 {name:'zero-demand',options:{demand:0}},
 {name:'collapse-week14',options:{demandShockWeek:14,demandAfterShock:0}},
 {name:'recovery-week27',options:{demand:0,demandShockWeek:27,demandAfterShock:1}},
 {name:'collapse-10pct-week7',options:{demandShockWeek:7,demandAfterShock:.1}},
 {name:'fee-bypass',options:{paidMarketShare:0}},
 {name:'no-buyers',options:{collectionTarget:0}},
 {name:'no-drops',options:{supply:{rarePerActiveWeek:0,epicPerActiveWeek:0,source:'Zero source stress'}}},
 {name:'two-item-stock',options:{sealStockTarget:2}},
 {name:'24-item-stock',options:{sealStockTarget:24}},
 {name:'price0',options:{marketPriceYarn:0}},
 {name:'price5',options:{marketPriceYarn:5}},
 {name:'price80',options:{marketPriceYarn:80}},
 {name:'bot-rank10',options:{botRankBoost:10}},
 {name:'bots-hoard',options:{botsHoard:true}},
 {name:'half-bots-hoard',mix:{...mixes[2],shares:[.2,.1,.2,.5]},options:{botsHoard:true}},
 {name:'optin-zero-leakage',options:{demand:.1,grantPolicy:'opt-in',grantLeakage:0}},
 {name:'optin-25pct-leakage',options:{demand:.1,grantPolicy:'opt-in',grantLeakage:.25}},
 {name:'optin-all-leakage',options:{demand:.1,grantPolicy:'opt-in',grantLeakage:1}},
 {name:'optin-bots-hoard',options:{demand:.1,grantPolicy:'opt-in',grantLeakage:.05,botsHoard:true}},
 {name:'week53-tail',options:{weeks:53}},
 {name:'unshipped-cosmetics',options:{profile:'roadmap'}},
];
const stresses=cached?.stresses??stressSpecs.map(({name,options,mix=mixes[2]})=>{
 const s=simulate(mix,{supply,rewardPolicy:'closed-burn',...options});
 return record(s,{name,options,affordability:s.affordability,budgets:s.budgets});
});
const groups=[];
const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor((xs.length-1)/2)];
for(const policy of policies)for(const demand of [1,.5,.25,.1])for(const split of ['development','holdout']){
 const rs=rows.filter(r=>r.policy===policy.name&&r.demand===demand&&r.split===split);
 groups.push({policy:policy.name,demand,split,runs:rs.length,
  passed:rs.filter(r=>r.flowPass&&r.farmingPass).length,
  worstClaimsBurn:Math.max(...rs.map(r=>r.emissionBurn??Infinity)),
  farmerCasualWorst:Math.max(...rs.map(r=>r.farmerCasual??0)),
  medianCasualRoutine:median(rs.map(r=>r.casualRoutineMedian)),
  minCasualRenameShare:Math.min(...rs.map(r=>r.casualRenameShare)),
  minCasualEpicShare:Math.min(...rs.map(r=>r.casualEpicShare)),
  maxLastSeasonEmission:Math.max(...rs.map(r=>r.lastSeasonEmission))});
}
const proof={equation:'claims = burn + player balances + treasury',
 upperUnburnedForTwoX:'player balances + treasury <= total claims / 2',
 inactiveGrants:'With universal grants G and a persistent fraction (1-d) that never spends or transfers, retained grants >= (1-d)*G. Necessary: burn >= ((1-d)*G + treasury); reward reductions do not erase these balances.',
 routineBound:'For non-overlapping closed periods, allocated routine <= alpha * prior reviewed organic burn, excluding existing liabilities. With alpha<=1 and disjoint periods, cumulative routine<=alpha*cumulative organic burn. This bounds new spending; it does not establish demand or satisfy the grant-inclusive gate.',
 recovery:'Current SeasonRewards multiplies by zero after a zero-burn emission season. Later demand cannot restore a zero cap. No simulated or proposed issuer may override that deployed cap.'};
const selected=groups.filter(g=>g.policy===candidate&&g.demand===1&&g.split==='holdout');
const result={version:1,modelHash,seeds,policies,candidate,supply,runs:rows.length,stressRuns:stresses.length,
 assumptions:{cohort:1000,weeks:52,grants:'20 exactly; universal controls, opt-in sensitivity only. All bots claim in opt-in;5% nonadopter leakage. This is behavior, not enforceable Sybil resistance.',
 budget:'Candidate50% of prior closed-season organic burns.10% maximum earmark for conditional closed rank, remainder equally quoted to all cohort accounts for13 weekly bosses. All quotes respect deployed cap. Unused budget expires; no spending-based personal reward.',
 organic:'Model knows true bot labels and excludes bot-related burns from the funding measure; actual inference will be weaker. No simulated organic number is observed telemetry.',
 rank:'Rank is not a debt until allocated after season closes. All allocated rank capped to one weekly cap; equal boss quote reserves capacity for the largest rank. Week52 raw candidate rank remains conditional until next budget.',
 affordability:'Gross routine rewards saved for ONE feature, no grants, sale proceeds or other spending. An optimistic saving bound, not expected completion time. Share includes unreached accounts; conditional wait medians alone are misleading.',
 statistics:'5 development +15 disjoint holdout seeds per mix. Candidate50% fixed before running. Seeds test Monte Carlo stability only; they do not verify behavior or demand.',
 scope:'Original fixed6 standard remains unchanged. Prototype candidate is not wired to the production issuer.'},
 acceptance:{originalUnchanged:true,candidateStandardFlowAndFarming:selected.every(g=>g.passed===g.runs),
  weakDemandProven:false,utilityCalibrated:false,activation:false},proof,groups,stresses,rows};
if(!cached){
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 const keys=Object.keys(rows[0]).filter(k=>!['quotes','seasonCommitments'].includes(k));
 writeFileSync(resolve(root,'docs/chain/calibration-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
}
const n=v=>v===null?'n/a':Number(v).toFixed(2);
const table=groups.filter(g=>g.split==='holdout').map(g=>`<tr><td>${g.policy}</td><td>${g.demand*100}%</td><td>${g.passed}/${g.runs}</td><td>${n(g.worstClaimsBurn)}×</td><td>${n(g.medianCasualRoutine)}</td><td>${n(100*g.minCasualRenameShare)}%</td><td>${n(100*g.minCasualEpicShare)}%</td></tr>`).join('');
const full=groups.filter(g=>g.split==='holdout'&&g.demand===1);
const bars=full.map((g,i)=>{
 const y=45+i*57,w=g.worstClaimsBurn*160;
 return `<text x="10" y="${y+20}" fill="#e7edf7" font-size="19">${g.policy}</text><rect x="195" y="${y}" width="${w}" height="30" rx="4" fill="${g.passed===g.runs?'#72d9bd':'#ffbc83'}"/><text x="${205+w}" y="${y+22}" font-size="20" fill="#e7edf7">${n(g.worstClaimsBurn)}×</text>`;
}).join('');
const chart=`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Worst claims divided by burn,100 percent adoption,45 holdout runs per policy" viewBox="0 0 760 410"><rect width="760" height="410" fill="#101b2b"/><path d="M515 20V395" stroke="#e6d18e" stroke-dasharray="6 6"/><text x="525" y="25" fill="#e6d18e" font-size="18">2× ceiling</text>${bars}</svg>`;
writeFileSync(resolve(root,'docs/chain/calibration-study.svg'),chart);
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN policy calibration</title><style>body{margin:32px auto;padding:0 20px;max-width:1100px;background:#101b2b;color:#e7edf7;font:17px/1.6 system-ui}h1{line-height:1.15;font-size:clamp(30px,5vw,48px)}a{color:#72d9bd}svg{width:100%;height:auto}section{border-top:1px solid #40506b;padding:20px 0}.scroll{overflow:auto}table{border-collapse:collapse;min-width:780px;width:100%}td,th{border-bottom:1px solid #40506b;padding:10px;text-align:left}.status{color:#ffbc83}code{white-space:normal}</style><p>Fuji43113 · Testnet — no real value</p><h1>Budget safety and player utility are separate tests</h1><p>1,440 comparisons,21 structural stresses,1,000 wallets over52 weeks. Candidate50% of prior reviewed burn was chosen before these seeds. The original fixed-reward result is retained. No deployed amounts changed.</p><p class="status">Candidate standard flow/farming: ${result.acceptance.candidateStandardFlowAndFarming?'PASS under assumptions':'NOT MET'}. Low-demand sustainability, player utility and activation: NOT MET.</p><section><h2>Full adoption: an accounting improvement</h2>${chart}<p>Worst result across45 held-out mix/seed cases per policy. Low rewards can pass this ratio while making features unreachable; see the saving shares below. Holdout seeds cannot establish real demand.</p></section><section><h2>Holdout comparison</h2><p>Casual median is annual gross routine earnings. “Can save” is the worst account share across cases reaching the cost of one feature, excluding grants, resale proceeds and competing purchases. Cosmetic rename2 is still unshipped; Epic seal10 requires an authoritative item.</p><div class="scroll"><table><tr><th>Policy</th><th>Adoption</th><th>Flow + farm pass</th><th>Worst claims / burn</th><th>Casual median YARN</th><th>Can save2</th><th>Can save10</th></tr>${table}</table></div></section><section><h2>What actually changed</h2><p>Each new season can commit at most25/50/75% of eligible burns from the previous closed season. Rank receives at most10% of the envelope; the remaining maximum boss amount is quoted equally before the season. Missed completions do not create extra budget. A demand collapse preserves this season’s quote and reduces the next season. Exact integer arithmetic respects the existing on-chain cap.</p><p>Opt-in changes who asks for a20-YARN grant, not its amount: all adopters,all bot wallets and5% of other nonadopters. It is a sensitivity assumption, not a working Sybil filter. Bots are known perfectly in the model for burn classification; actual evidence is weaker.</p></section><section><h2>Why lower rewards alone cannot repair inactive grants</h2><p><code>claims = burn + player balances + treasury</code>. Passing claims/burn≤2 requires retained balances plus treasury to be no greater than burns. Nonspenders retain their grants. Cutting future rewards cannot remove already issued balances, and a zero-activity economy is not a pass.</p><p>There is also a deployed recovery limit: a season with emissions and zero burn makes the future routine cap permanently zero. This study preserves that behavior. A new issuer cannot restore it.</p></section><section><h2>Structural stresses</h2><div class="scroll"><table><tr><th>Case</th><th>Claims / burn</th><th>Routine total</th><th>Casual median</th><th>Flow pass</th><th>Final cap</th></tr>${stresses.map(r=>`<tr><td>${r.name}</td><td>${n(r.emissionBurn)}</td><td>${n(r.routine)}</td><td>${n(r.casualRoutineMedian)}</td><td>${r.flowPass?'yes, assumptions':'no'}</td><td>${n(r.finalWeeklyCap)}</td></tr>`).join('')}</table></div></section><p><a href="calibration-study.json">Assumptions and all results</a> · <a href="calibration-study.csv">Comparison CSV</a> · <a href="tokenomics.html">Original baseline</a> · <a href="../design/chain/FEATURE-BUDGETS.md">Feature prices</a></p></html>`;
writeFileSync(resolve(root,'docs/chain/calibration-study.html'),html);
console.log(JSON.stringify({runs:rows.length,stressRuns:stresses.length,acceptance:result.acceptance,holdout:groups.filter(g=>g.split==='holdout')},null,2));
