import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mixes,simulate,summarize,validateSupply} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const supply=validateSupply(loadSourceSupply());
const seeds=Array.from({length:20},(_,i)=>43113+i*7919);
const modelHash=createHash('sha256').update(readFileSync(resolve(root,'tools/chain/token-sim.mjs'))).digest('hex');
const cached=process.argv.includes('--render-only')?JSON.parse(readFileSync(resolve(root,'docs/chain/balance-study.json'),'utf8')):null;
if(cached&&cached.modelVersion!==5)throw Error('Render-only requires model version5');
if(cached){
  assert.equal(cached.modelHash,modelHash,'Cached model changed; rerun without --render-only.');
  assert.deepEqual(cached.supply,supply,'Cached supply changed; rerun without --render-only.');
  assert.deepEqual(cached.seeds,seeds,'Cached seeds changed; rerun without --render-only.');
}
const rows=cached?.rows??[];
if(!cached)for(const demand of [1,.5,.25,.1])for(const entitlementBps of [10000,5000,2500]){
  for(const mix of mixes)for(const seed of seeds){
    const s=simulate({...mix,seed},{supply,demand,entitlementBps});
    const r=summarize(s),last=s.rows.at(-1);
    rows.push({...r,burn:last.cumulativeBurn,claims:last.inclusiveEmission,top1:last.topOnePercent,
      yarnPerHour:last.yarnPerHour,playerBalance:last.playerCirculating,treasury:last.treasury,
      sealed:last.sealed,overflow:last.shelfOverflow,organicDemandValidated:false});
  }
  console.log(`Finished adoption ${demand}, reward scale ${entitlementBps}`);
}
const percentile=(xs,p)=>[...xs].sort((a,b)=>a-b)[Math.floor((xs.length-1)*p)];
const groups=[];
for(const demand of [1,.5,.25,.1])for(const entitlementBps of [10000,5000,2500])for(const mix of mixes){
  const rs=rows.filter(r=>r.demand===demand&&r.entitlementBps===entitlementBps&&r.mix===mix.name);
  groups.push({mix:mix.name,demand,entitlementBps,boss:6*entitlementBps/10000,rankMax:6*entitlementBps/10000,
    emissionBurnP05:percentile(rs.map(r=>r.emissionBurn),.05),emissionBurnMedian:percentile(rs.map(r=>r.emissionBurn),.5),emissionBurnP95:percentile(rs.map(r=>r.emissionBurn),.95),
    worst:Math.max(...rs.map(r=>r.emissionBurn)),passing:rs.filter(r=>r.flowPass&&r.farmingPass).length,
    farmerCasualWorst:Math.max(...rs.map(r=>r.farmerCasual)),rankPendingMax:Math.max(...rs.map(r=>r.rankPending)),
    sealedMedian:percentile(rs.map(r=>r.sealed),.5),unsealedMedian:percentile(rs.map(r=>r.unsealedStock),.5)});
}
const stress=cached?.stress??[
  {name:'stock-target-2',mix:mixes[2],options:{demand:1,sealStockTarget:2}},
  {name:'stock-target-24',mix:mixes[2],options:{demand:1,sealStockTarget:24}},
  {name:'unbounded-seal-optimism',mix:mixes[2],options:{demand:1,sealStockTarget:1000}},
  {name:'zero-adoption',mix:mixes[2],options:{demand:0}},
  {name:'no-routine-10pct',mix:mixes[2],options:{demand:.1,entitlementBps:0}},
  {name:'half-bots',mix:{...mixes[2],shares:[.2,.1,.2,.5]},options:{demand:.5}},
  {name:'bot-rank-advantage',mix:mixes[2],options:{demand:.5,botRankBoost:2}},
  {name:'80pct-fee-bypass',mix:mixes[2],options:{demand:.5,paidMarketShare:.2}},
  {name:'no-market-buyers',mix:mixes[2],options:{demand:.5,collectionTarget:0}},
  {name:'week53-settlement',mix:mixes[2],options:{demand:.5,weeks:53}},
  {name:'old-weekly-rank-stress',mix:mixes[2],options:{demand:.5,rewardSchedule:'legacy-weekly'}},
  {name:'repeated-opportunity-optimism',mix:mixes[2],options:{demand:.1,participation:'opportunities',sealStockTarget:1000}},
].map(({name,mix,options})=>({name,...summarize(simulate(mix,{supply,...options})),...options}));
const data={modelVersion:5,modelHash,supply,seeds,runs:rows.length,source:supply.source,
  interpretation:'Conditional source and assumed behavior. A flow pass is not calibrated demand or production readiness.20 seeds describe Monte Carlo variation, not uncertainty in behavior. No reward or fee setting deployed.',
  assumptions:{cohort:1000,weeks:52,grant:20,weeklyBossMax:6,closedSeasonRankMax:6,seasonWeeks:13,rankTiers:'top1/10/25/50%=6/4/2/1, rest0',
    source:'per-type conditional source-study; no recurring rare material; funded invitation/craft sources excluded',
    adoption:'persistent accounts; nonadopters do not become buyers by repeated dice rolls',
    collection:'Buyer stops at 4 owned items; sealers stop preparing stock at 6, an assumed inventory preference, not a protocol cap.20-YARN generic sale price is a sensitivity assumption, not reference valuation or minimum.',
    shelf:'At most240 eligible unsealed items; bound equipment occupancy omitted (optimistic). Overflow is not a tradable item.',
    bots:'No cosmetic utility buying; no30-YARN Legendary seal for a hypothetical19-YARN net sale',
    horizons:'Rank from fourth season remains pending at week 52; disclosed and separately tested at53. Rank remainder expires at next close; no guaranteed debt.'},groups,stress,rows};
if(!cached)writeFileSync(resolve(root,'docs/chain/balance-study.json'),JSON.stringify(data,null,2)+'\n');
const keys=Object.keys(rows[0]);
if(!cached)writeFileSync(resolve(root,'docs/chain/balance-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n');
const n=x=>x==null?'undefined':x.toFixed(3);
const table=`<div class="scroll"><table><tr><th>Persistent uptake</th><th>Boss / rank max</th><th>Mix</th><th>Claims / burn p05 · median · p95</th><th>Worst</th><th>Pass /20</th><th>Sealed / unsealed median</th></tr>${groups.map(g=>`<tr><td>${g.demand*100}%</td><td>${g.boss} / ${g.rankMax}</td><td>${g.mix}</td><td>${n(g.emissionBurnP05)} · ${n(g.emissionBurnMedian)} · ${n(g.emissionBurnP95)}</td><td>${n(g.worst)}</td><td>${g.passing}</td><td>${g.sealedMedian} / ${g.unsealedMedian}</td></tr>`).join('')}</table></div>`;
const chartMax=Math.max(2,...groups.filter(g=>g.entitlementBps===10000).map(g=>g.worst))*1.12;
const barScale=200/chartMax;
const chart=`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Claims divided by burn by persistent adoption; original6-YARN boss proposal, worst of20 seeds" viewBox="0 0 600 300"><rect width="600" height="300" fill="#101b2b"/>${[1,.5,.25,.1].map((d,i)=>{const v=Math.max(...groups.filter(g=>g.demand===d&&g.entitlementBps===10000).map(g=>g.worst));return `<rect x="${55+i*140}" y="${250-v*barScale}" width="75" height="${v*barScale}" fill="${v<=2?'#75dbd0':'#faab72'}"/><text x="${92+i*140}" y="${240-v*barScale}" text-anchor="middle" fill="#eef4ff" font-size="25">${n(v)}×</text><text x="${92+i*140}" y="285" text-anchor="middle" fill="#bac6d6" font-size="25">${d*100}%</text>`;}).join('')}<path d="M25 ${250-2*barScale}H585" stroke="#e8c562" stroke-dasharray="8 5"/></svg>`;
writeFileSync(resolve(root,'docs/chain/balance-study.svg'),chart);
writeFileSync(resolve(root,'docs/chain/balance-study.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN balance study</title><style>body{background:#101b2b;color:#eef4ff;font:16px/1.6 system-ui;max-width:1150px;margin:30px auto;padding:0 20px}a{color:#75dbd0}table{border-collapse:collapse;min-width:900px}td,th{padding:9px;border-bottom:1px solid #45536a;text-align:left}.scroll{overflow:auto}svg{width:100%;height:auto}h1{line-height:1.2}</style><p>FUJI 43113 · Testnet — no real value</p><h1>More drops do not establish demand</h1><p>720 runs × 52 weeks × 1,000 wallets. 20 seeds per mix, four persistent adoption levels and three reward budgets. Source functions are measured under successful-play conditions; buyer adoption is an assumption. No fee, contract or issuer setting changed.</p><h2>Claims / burn by adoption</h2><p>Original boss 6 / seasonal rank ≤6. Worst of 20 seeds per mix.</p>${chart}<p>Bars show the worst result across all three mixes. The yellow line is the requested 2× flow ceiling. A passing assumed uptake level cannot validate actual uptake; seed variation does not cover behavioral uncertainty.</p><h2>Closed-season rewards and inventory</h2><p>Boss rewards are weekly. Rank closes every 13 weeks and claims start the following season (weeks 14/27/40/53). The fourth rank remains pending at week 52. Rank consumes the same reduced 12-YARN weekly cap, with priority; any remainder expires at next close. No per-battle payment.</p><p>Eligible source equipment uses the real 6-drop/day cap; no recurring tradable rare material was found. 240-slot eligible shelf and nonadopters are tracked. A buyer stops at 4 owned items and a sealer stops at 6 unsold/owned items. The 6-item preference is a hypothesis, not a protocol cap; stress cases use 2/24/1000. Generic 20-YARN sales and willingness to seal are assumptions, not fair prices. Bots do not buy cosmetic utility or seal a 30-YARN item to net 19.</p>${table}<h2>Failure and structural cases</h2><div class="scroll"><table><tr><th>Case</th><th>Claims / burn</th><th>Farmer / casual per hour</th><th>Bot share</th><th>Sealed stock</th><th>Trades</th><th>Pending rank</th></tr>${stress.map(r=>`<tr><td>${r.name}</td><td>${n(r.emissionBurn)}</td><td>${n(r.farmerCasual)}</td><td>${n(r.botShare*100)}%</td><td>${r.sealedStock}</td><td>${r.trades}</td><td>${n(r.rankPending)}</td></tr>`).join('')}</table></div><p>Transfers and treasury receipts are not burns. A fixed closed cohort has claims = player balances + treasury + burns; full cumulative 1.0 burn/claims requires exhausting both balances and treasury. Account-level caps do not identify humans. Keep ordinary routine payouts disabled until authoritative eligibility and measured voluntary demand exist.</p><p><a href="balance-study.csv">720-run CSV</a> · <a href="balance-study.json">Assumptions and details</a> · <a href="../design/chain/FEATURE-BUDGETS.md">Feature budgets</a> · <a href="../../reports/chain/SUPPLY-STUDY.md">Source measurement</a> · <a href="tokenomics.html">Full weekly model</a></p></html>`);
console.log(JSON.stringify(cached?{renderOnly:true,cachedRuns:rows.length}:{runs:rows.length,groups,stress},null,2));
