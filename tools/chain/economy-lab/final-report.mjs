import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {T} from '../../../scripts/v3b2/thresholds.mjs';
import {checkGates} from '../../../scripts/v3b2/check-gates.mjs';
const B='reports/v3-shell/b2/econ/',read=name=>JSON.parse(readFileSync(B+name)),final=read('FINAL.json'),baseline=read('BASELINE.json'),search=read('SEARCH.json');
const proof=read('ANVIL-E2E.json'),ui=read('UI.json');
assert.equal(proof.configHash,final.configHash,'Repeat the local receipt flow on the final policy');
assert.equal(ui.configHash,final.configHash,'Repeat the desktop UI proof on the final policy');
const generated={date:new Date().toISOString(),thresholds:T,scenarios:final.scenarios.length,seeds:Math.min(...final.scenarios.map(s=>s.seeds)),sensitivityTotal:final.sensitivity.length,sensitivityComplete:final.sensitivity.filter(a=>a.cases.length===2).length,counts:search.counts,confirmedReceipts:proof.receipts.filter(r=>r.status==='success').length,desktopScreenshots:ui.shots.length};
writeFileSync(B+'REPORT-METRICS.json',JSON.stringify(generated,null,2)+'\n');
const sources={'FINAL.json':final,'BASELINE.json':baseline,'SEARCH.json':search,'REPORT-METRICS.json':generated},citations=[];
function value(file,pointer,decimals=3){
 const n=pointer.split('/').filter(Boolean).reduce((o,k)=>o[k],sources[file]);
 if(!Number.isFinite(n))throw Error(`Missing report measurement ${file}#${pointer}`);
 const rendered=new Intl.NumberFormat('en-US',{useGrouping:false,maximumFractionDigits:decimals}).format(n);
 citations.push({source:B+file,pointer,value:n,rendered,decimals});return rendered;
}
const v=(pointer,decimals)=>value('FINAL.json',pointer,decimals),t=key=>value('REPORT-METRICS.json','/thresholds/'+key);
const gates=checkGates();
const status=id=>gates.find(r=>r.id==='E3.'+id)?.status??'FAIL';
const targetRows=[
 ['T-a',`Burn / claims ≥ ${t('burnClaimsMin')}; full-demand maximum ${t('fullDemandBurnClaimsMax')}`],
 ['T-b',`Star Thread source / sink ${t('starRatioMin')}–${t('starRatioMax')}`],
 ['T-c',`Heavy / casual hourly YARN ≤ ${t('hourlyRatioMax')} in either direction`],
 ['T-d',`Casual Legendary day ${t('casualLegendaryMin')}–${t('casualLegendaryMax')}; heavy ${t('heavyLegendaryMin')}–${t('heavyLegendaryMax')}, strictly sooner`],
 ['T-e',`Bot / regular hourly YARN ≤ ${t('botHourlyRatioMax')} in the largest bot mix`],
 ['T-f',`Top-percent account share ≤ ${t('topPercentWithdrawnShareMax')}`],
 ['T-g',`Upper-tail half-demand burn ≥ ${t('robustBurnMin')}; Star ${t('robustStarMin')}–${t('robustStarMax')}`],
 ['T-h',`Each behaviour assumption ± ${t('sensitivityDelta')}: burn ≥ ${t('robustBurnMin')}; Star ${t('robustStarMin')}–${t('robustStarMax')}`],
];
let md=`# Economy final evidence\n\nMeasured candidate: \`${final.configHash}\`. These are simulations and disposable local transactions, not observed player behaviour or public-chain deployment.\n\n`;
md+=`Search: ${value('REPORT-METRICS.json','/counts/loggedSearches')} rounds, ${value('REPORT-METRICS.json','/counts/unique')} distinct configurations. Final confirmation: ${value('REPORT-METRICS.json','/scenarios')} scenarios, ${value('REPORT-METRICS.json','/seeds')} seeds per scenario. Sensitivity coverage: ${value('REPORT-METRICS.json','/sensitivityComplete')} / ${value('REPORT-METRICS.json','/sensitivityTotal')} assumptions. Incomplete cases remain failed evidence.\n\n`;
md+='## Targets\n\n| Target | Required behaviour | Checker |\n|---|---|---|\n'+targetRows.map(([id,label])=>`| ${id} | ${label} | ${status(id)} |`).join('\n')+'\n';
md+='\n## Published changes\n\n';
md+=`Weekly completed-route Spool is ${v('/policy/policy/rewards/weeklySpool')}; chapter Spool is ${v('/policy/policy/rewards/chapterSpool')}. New bound Thread grants pause at a bank of ${v('/policy/policy/rewards/starThreadBankCap')}; existing stock is preserved. Seasonal rank maximum is ${v('/policy/policy/rewards/seasonRankMax')}.\n\n`;
md+=`The weekly net withdrawal cap is ${v('/policy/policy/spool/weeklyNetCap')} YARN, with ${v('/policy/policy/spool/feeBp')} basis points retained in the reward pool. Retention is never counted as a burn. Guaranteed studio payments earn up to ${v('/policy/policy/craft/rebateBp')} basis points of Spool, capped at ${v('/policy/policy/craft/weeklySpoolCap')} per week. The returned amount stays below the cost, including after withdrawal retention.\n\n`;
md+=`Legendary fusion consumes ${v('/policy/policy/fusion/legendary/count')} matching Epics, ${v('/policy/policy/fusion/legendary/starThread')} bound Thread, and burns ${v('/policy/policy/fusion/legendary/yarn')} YARN. Guaranteed quality polish, permanent scene decor, and permanent showcase shelves provide visible deterministic benefits. YARN does not buy random outcomes.\n\n`;
md+='## Baseline and final distributions\n\nEvery cell is median [lower decile, upper decile]. The baseline and final retain their own native progression records and hashed model snapshots. Scenario identifiers encode the measured player mix, demand, and bot share.\n';
for(const [metric,label] of [['burnClaims','Burn / all claims'],['starRatio','Star Thread source / sink'],['heavyCasualHourlyRatio','Heavy / casual withdrawn YARN per active hour'],['casualLegendaryDay','Casual first Legendary day'],['heavyLegendaryDay','Heavy first Legendary day'],['botRegularHourlyRatio','Bot / regular withdrawn YARN per active hour'],['topOnePercentWithdrawnShare','Top-percent share of withdrawals']]){
 md+=`\n### ${label}\n\n| Scenario | Baseline | Final |\n|---|---:|---:|\n`;
 for(const [i,s] of final.scenarios.entries()){
  const b=baseline.scenarios.findIndex(x=>x.id===s.id);if(b<0)throw Error('Missing baseline scenario '+s.id);
  const cell=(file,index)=>`${value(file,`/scenarios/${index}/quantiles/median/${metric}`)} [${value(file,`/scenarios/${index}/quantiles/p10/${metric}`)}, ${value(file,`/scenarios/${index}/quantiles/p90/${metric}`)}]`;
  md+=`| ${s.id} | ${cell('BASELINE.json',b)} | ${cell('FINAL.json',i)} |\n`;
 }
}
md+='\n## Pareto trade-offs\n\nThe review contains the best comparable candidates and marks genuine nondominated membership. Dominated entries are retained for review and are not presented as part of the frontier. Historical scores from different model versions are not mixed.\n\n| Configuration | Score | On frontier | Misses | Interpretation |\n|---|---:|---|---|---|\n';
for(const [i,row] of search.pareto.entries())md+=`| \`${row.configHash}\` | ${value('SEARCH.json',`/pareto/${i}/score`,4)} | ${row.onFront?'yes':'no'} | ${row.conflicts.join(', ')||'none in pilot'} | ${row.reason} |\n`;
md+='\n## Risks and launch monitoring\n\n';
md+='The bot objective is conditional on the stated spending and play profiles. The earning rule is public and identical for every account; it does not identify bots. An adaptive automated account can copy human purchases. Gross withdrawals are not profit: burned YARN and purchased benefits must also be inspected.\n\n';
md+=`Opening outside-market stock is finite: ${v('/policy/initial/marketYarnPerParticipant')} YARN per modeled market participant. Tester grants are ${v('/policy/initial/testerYarn')} YARN to ${v('/policy/initial/testerRecipients')} recipients. Neither is invented ongoing income. Without outside stock, conservation prevents sustained burns exceeding all claims while balances remain.\n\n`;
md+='Monitor actual burn against all issued claims, late-season burn, banked and inactive Thread, withdrawals by cohort and account, gross rebates versus paid burns, market float depletion, and observed Legendary progression. Refit demand and retention from observed behaviour before enabling issuance. Keep reward budgets finite and display unavailable chain data as unavailable.\n\n';
md+='The original immutable contract season and routine cap are unchanged. The UI explains the content season separately. Local Anvil receipts prove the transaction flow and deterministic sink benefits; they are not public Fuji receipts. Source-linked reports, captured UI odds, and receipt hashes are under this directory.\n';
md+=`\nThe final policy hash matches ${value('REPORT-METRICS.json','/confirmedReceipts')} confirmed local receipts and ${value('REPORT-METRICS.json','/desktopScreenshots')} desktop screenshots. Displayed recipe costs, withdrawal fees, grants, caps, and odds were compared directly with that policy.\n`;
writeFileSync(B+'ECONOMY-FINAL.md',md);
writeFileSync(B+'REPORT-NUMBERS.json',JSON.stringify({generatedAt:new Date().toISOString(),citations},null,2)+'\n');
console.log(JSON.stringify({reportNumbers:citations.length,targets:targetRows.map(([id])=>({id,status:status(id)}))}));
