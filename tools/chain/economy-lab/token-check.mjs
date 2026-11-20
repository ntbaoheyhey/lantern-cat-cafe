import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {loadLabRuntime,root,sha,quantile} from './runtime.mjs';
import {tokenRun,scenarios} from './token.mjs';
const runtime=await loadLabRuntime(),config=runtime.ECONOMY_LAB;
const base=JSON.parse(readFileSync(resolve(root,'reports/v3-shell/b2/econ/BASELINE.json')));
// Reuse native combat only when every source influencing those rewards is equal.
for(const key of ['policy','c2','profiles','timing','cohortDays','startEpoch'])if(JSON.stringify(config[key])!==JSON.stringify(base.config[key]))throw Error('C2 config changed: '+key+'; run a new native cohort.');
const source=base.scenarios[0].gearCohort;
if(sha(source.path)!==source.sha256)throw Error('Cohort hash mismatch');
const bank=gunzipSync(readFileSync(source.path)).toString().trim().split('\n').map(x=>JSON.parse(x));
const rows=[],metrics=['burnClaims','starRatio','heavyCasualHourlyRatio','casualLegendaryDay','heavyLegendaryDay','botRegularHourlyRatio','topOnePercentWithdrawnShare'];
const started=performance.now(),seeds=40;
for(const scenario of scenarios(config)){
 const results=Array.from({length:seeds},(_,i)=>tokenRun(runtime,config,bank,scenario,43113+i));
 const quantiles=Object.fromEntries([['median',.5],['p10',.1],['p90',.9]].map(([label,p])=>[label,Object.fromEntries(metrics.map(k=>[k,quantile(results.map(r=>r[k]),p)]))]));
 const purchases=Object.fromEntries(runtime.ECONOMY_SINK_IDS.map(id=>[id,quantile(results.map(r=>r.studioPurchases[id]),.5)]));
 rows.push({...scenario,seeds,quantiles,purchases});
 console.log(`${scenario.id}: burn ${quantiles.median.burnClaims.toFixed(3)}, Stars ${quantiles.median.starRatio.toFixed(3)}; studio ${JSON.stringify(purchases)}`);
}
writeFileSync(resolve(root,'reports/v3-shell/b2/econ/SINK-MODEL.json'),JSON.stringify({seeds,elapsedSeconds:(performance.now()-started)/1000,source,scenarios:rows,method:'E2 regression only, not E3 tuning acceptance. Native progression bank verified against unchanged combat/economy parameters. Missing historical quality rolls replay the production item generator with paired seeds; the first finite loadout is retained and cannot also be fused or sold. Studio spending executes the exact production quote, with finite ownership and funded balances.'},null,2)+'\n');
