import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {root,sha} from './runtime.mjs';
import {get} from './search-core.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const round=Number(arg('round')),learned=arg('learned'),title=arg('title'),B=resolve(root,'reports/v3-shell/b2/econ');
if(!Number.isSafeInteger(round)||!learned||!title)throw Error('Supply measured round, title and an honest outlier interpretation.');
const path=resolve(B,`search/round-${String(round).padStart(2,'0')}.json`),search=JSON.parse(readFileSync(path)),best=search.configs[0];
let previous=[];try{previous=readFileSync(resolve(B,'ROUNDS.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code!=='ENOENT')throw e;}
if(previous.some(r=>r.round===round))throw Error('Round already logged; preserve history.');
const changes=search.leverNames.map(path=>({path,before:get(search.baseConfig,path),after:get(best.config,path)})).filter(r=>r.before!==r.after);
const row={round,title,learned,configs:search.configsEvaluated,seeds:search.seeds,levers:search.leverNames.length,score:best.score,changes,scenarios:best.scenarioScores,source:{path:relative(root,path),sha256:sha(path)}};
previous.push(row);previous.sort((a,b)=>a.round-b.round);
writeFileSync(resolve(B,'ROUNDS.jsonl'),previous.map(r=>JSON.stringify(r)).join('\n')+'\n');
let md='# Economy tuning rounds\n\nEach round is measured across all 18 scenarios with 40 token seeds. Native gear banks are separately hashed. Historical rounds retain their original model, source records and scores.\n';
for(const r of previous){
 md+=`\n## Round ${r.round} — ${r.title??'prices alone'}\n\n${r.configs??40} unique configs × ${r.seeds??40} seeds × ${r.scenarios.length} scenarios. Best score ${r.score?.toFixed(4)??'recorded in source'}.\n\n${r.learned}\n\n| Lever | Before | After |\n|---|---:|---:|\n`;
 for(const c of r.changes)md+=`| ${c.path??c.lever} | ${c.before} | ${c.after} |\n`;
 md+='\n| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |\n|---|---:|---:|---:|---:|\n';
 for(const s of r.scenarios){const q=s.quantiles?.median??s;md+=`| ${s.id??s.scenario} | ${q.burnClaims?.toFixed(3)} | ${q.starRatio?.toFixed(3)} | ${q.casualLegendaryDay} / ${q.heavyLegendaryDay} | ${q.botRegularHourlyRatio?.toFixed(3)??'see source'} |\n`;}
}
writeFileSync(resolve(B,'ROUNDS.md'),md);
console.log(JSON.stringify({round,score:best.score,changed:changes.length,metrics:Object.fromEntries(['burnClaims','starRatio','casualLegendaryDay','heavyLegendaryDay','botRegularHourlyRatio'].map(k=>[k,[Math.min(...best.scenarioScores.map(s=>s.quantiles.median[k])),Math.max(...best.scenarioScores.map(s=>s.quantiles.median[k]))]]))}));
