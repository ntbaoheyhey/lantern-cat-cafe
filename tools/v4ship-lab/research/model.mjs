/** Reproducible planning arithmetic and preserved simulation extraction. LEARN/S9.md. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadLabRuntime} from '../../chain/economy-lab/runtime.mjs';
import {hashConfig} from '../../chain/economy-lab/search-core.mjs';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-ship/S9'),sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(out,{recursive:true});if(existsSync(resolve(out,'model-1.json')))throw Error('Preserve original experiment');
const assumptions=[
 {id:'low',mau:1000,passConversion:.01,cosmeticConversion:.005,overlap:.0025,passUsd:5,cosmeticSpendUsd:4,externalMarketYarn:5000,genesisUnits:25,genesisUsd:10},
 {id:'base',mau:10000,passConversion:.02,cosmeticConversion:.01,overlap:.005,passUsd:7,cosmeticSpendUsd:8,externalMarketYarn:50000,genesisUnits:100,genesisUsd:20},
 {id:'high',mau:50000,passConversion:.04,cosmeticConversion:.02,overlap:.01,passUsd:9,cosmeticSpendUsd:12,externalMarketYarn:250000,genesisUnits:300,genesisUsd:30},
];
function revenue(a){
 assert(a.overlap>=0&&a.overlap<=Math.min(a.passConversion,a.cosmeticConversion));
 const payers=a.mau*(a.passConversion+a.cosmeticConversion-a.overlap),pass=a.mau*a.passConversion*a.passUsd,cosmetics=a.mau*a.cosmeticConversion*a.cosmeticSpendUsd;
 const gross=pass+cosmetics,rate=payers/a.mau,arppu=gross/payers;
 assert(Math.abs(a.mau*rate*arppu-gross)<1e-8);
 return {assumptions:a,payingUsers:payers,uniquePayerConversion:rate,passGrossUsd:pass,cosmeticGrossUsd:cosmetics,recurringGrossUsd:gross,arppuUsd:arppu,
  cosmeticRevenueShare:cosmetics/gross,afterAssumed15PercentDistributionUsd:gross*.85,afterAssumed30PercentDistributionUsd:gross*.7,
  treasuryYarn:a.externalMarketYarn*.03,marketBurnYarn:a.externalMarketYarn*.02,genesisOneTimeGrossUsd:a.genesisUnits*a.genesisUsd};
}
const rows=assumptions.map(revenue),base=assumptions[1];
const methods=[revenue({...base,id:'pass-led'}),revenue({...base,id:'cosmetics-led',passConversion:.01,cosmeticConversion:.02})];
assert(methods[0].payingUsers===methods[1].payingUsers);
const independentUnits={note:'YARN is not USD; current demo revenue and real AVAX demand are zero. All rates and prices above are planning assumptions, not observed conversion or a launch commitment.',
 cchain:{monthlyTransactions:200000,assumedGasPerTransaction:[50000,200000],assumedGasPriceGwei:[.1,5],monthlyAvaxRange:[200000*50000*.1/1e9,200000*200000*5/1e9]},
 l1:{validators:5,minimumNavaxPerSecond:512,days:30,minimumMonthlyPchainAvax:5*512*30*86400/1e9,hostingIncluded:false,feeIsDynamic:true}};
const simulatedPath='reports/v4-ship/S2b/econ/CLASS-POWER-RETENTION25.json',nativePath='reports/v4-ship/S2b/econ/CLASS-OFFENSE115-POWER-200.json',rawPath='reports/v4-ship/S2b/boundary-runs.jsonl.gz';
const sim=JSON.parse(readFileSync(resolve(root,simulatedPath))),native=JSON.parse(readFileSync(resolve(root,nativePath))),current=(await loadLabRuntime(resolve(root,'work/v4ship-prep/S9-model-runtime'))).ECONOMY_LAB;
assert.equal(hashConfig(sim.config),sim.configHash);assert.equal(hashConfig(current),sim.configHash);assert.equal(current.policy.spool.feeBp,2500);
const raw=gunzipSync(readFileSync(resolve(root,rawPath))).toString().trim().split('\n').map(line=>JSON.parse(line));
const scenarios=['casual-heavy-d0.5-b0.1','casual-heavy-d0.5-b0.35'];
const flows=scenarios.map(scenario=>{
 const selected=raw.filter(r=>r.label==='CLASS-POWER-RETENTION25'&&r.block==='replay'&&r.scenario===scenario);assert.equal(selected.length,200);
 const mean=key=>selected.reduce((s,r)=>s+r[key],0)/selected.length;
 const amounts=Object.fromEntries(['testerClaims','withdrawals','claims','retained','craftRebates','externalVolume','treasury','balances','burn','starSource','starSink','starBalances','inactiveStarBalances'].map(k=>[k,mean(k)]));
 const yarnResidual=amounts.claims+amounts.externalVolume-amounts.burn-amounts.treasury-amounts.balances,starResidual=amounts.starSource-amounts.starSink-amounts.starBalances;
 assert(Math.abs(yarnResidual)<1e-6&&Math.abs(starResidual)<1e-6);
 const burnBySink=Object.fromEntries(Object.keys(selected[0].burnBySink).map(k=>[k,selected.reduce((n,r)=>n+r.burnBySink[k],0)/200]));
 assert(Math.abs(Object.values(burnBySink).reduce((a,b)=>a+b,0)-amounts.burn)<1e-6);
 return {scenario,runs:200,population:sim.config.population,weeks:sim.config.tokenWeeks,aggregation:'Arithmetic mean of complete per-seed ledgers; median gate ratios are reported separately',amounts,burnBySink,yarnResidual,starResidual};
});
const report={at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),kind:'planning experiment; no economy configuration changes',rows,methods,
 methodComparison:{sameMau:base.mau,sameUniquePayers:methods[0].payingUsers,passLedGrossUsd:methods[0].recurringGrossUsd,cosmeticsLedGrossUsd:methods[1].recurringGrossUsd,deltaUsd:methods[1].recurringGrossUsd-methods[0].recurringGrossUsd,decision:'No revenue winner established: assumed conversions are unmeasured. Keep pass/cosmetics as explicit alternatives and validate willingness to pay after lawful launch review.'},
 independentUnits,configuration:{sourceHash:hashConfig(current),simulationHash:sim.configHash,exactSourceConfigMatch:true,deployedConfigVerified:false,scope:'Matches source ECONOMY_LAB to committed token simulation; does not attest a hosted deployment or whole rules-engine equivalence.'},
 economy:{e3Pass:sim.pass,passedScenarios:sim.scenarios.filter(r=>Object.values(r.distances).every(x=>x===0)).length,totalScenarios:sim.scenarios.length,profiles:native.cohort.profiles,
  scenarioRatios:sim.scenarios.map(r=>({id:r.id,burnClaims:r.quantiles.median.burnClaims,starRatio:r.quantiles.median.starRatio,failed:Object.entries(r.distances).filter(([,v])=>v).map(([k])=>k)})),flows},
 evidence:[simulatedPath,nativePath,rawPath].map(path=>({path,sha256:sha(readFileSync(resolve(root,path)))}))};
writeFileSync(resolve(out,'model-1.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(out,'revenue-1.csv'),'scenario,mau,unique_payers,pass_usd,cosmetic_usd,recurring_gross_usd,arppu_usd,treasury_yarn,genesis_one_time_usd\n'+rows.map(r=>[r.assumptions.id,r.assumptions.mau,r.payingUsers,r.passGrossUsd,r.cosmeticGrossUsd,r.recurringGrossUsd,r.arppuUsd,r.treasuryYarn,r.genesisOneTimeGrossUsd].join(',')).join('\n')+'\n');
console.log(JSON.stringify({methodComparison:report.methodComparison,config:report.configuration,e3:`${report.economy.passedScenarios}/${report.economy.totalScenarios}`,flows:flows.map(f=>({scenario:f.scenario,amounts:f.amounts,residual:f.yarnResidual}))}));
