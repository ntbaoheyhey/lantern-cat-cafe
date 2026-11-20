import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {root,sha} from './runtime.mjs';
import {verifiedConfig,frontier,comparablePolicy} from './evidence.mjs';

const args=process.argv.slice(2),arg=(key)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:undefined;
const B=resolve(root,'reports/v3-shell/b2/econ'),folder=resolve(B,'search');
const signed=path=>({path:relative(root,path),sha256:sha(path)});
const sources=[],unique=new Map(),rounds=[],levers=new Set();
for(const file of readdirSync(folder).filter(f=>/^round-\d+\.json$/.test(f)).sort()){
 const path=resolve(folder,file),round=JSON.parse(readFileSync(path));
 if(round.configsEvaluated!==round.configs.length)throw Error('Search count differs from measured records');
 sources.push({...signed(path),round:round.round});rounds.push(round);
 for(const name of round.leverNames)levers.add(name);
 for(const raw of round.configs){
  const row=verifiedConfig(raw);
  if(unique.has(row.configHash)){unique.get(row.configHash).rounds.push(round.round);continue;}
  unique.set(row.configHash,{...row,rounds:[round.round]});
 }
}
const latest=rounds.at(-1);if(!latest)throw Error('No measured rounds');
const confirmationPath=arg('confirmation')?resolve(root,arg('confirmation')):null;
const confirmation=confirmationPath?JSON.parse(readFileSync(confirmationPath)):null;
const selectedRounds=arg('comparable-rounds')?.split(',').map(Number)??[latest.round];
// Do not rank scores from different model versions as a single Pareto front.
const comparable=[...unique.values()].filter(r=>r.rounds.some(n=>selectedRounds.includes(n))&&comparablePolicy(r.config,latest.baseConfig));
const ranked=frontier(comparable).sort((a,b)=>a.score-b.score);
const pareto=ranked.slice(0,20).map(row=>({configHash:row.configHash,score:row.score,rounds:row.rounds,onFront:!row.dominated,distances:row.worstDistances,
 conflicts:Object.entries(row.worstDistances).filter(([,n])=>n>0).map(([key])=>key),
 reason:row.worstDistances['T-e']>0?'The same public rewards and paid craft rebates are available to automated accounts. The modeled spending mix still misses the bot ratio; finite collections, available YARN, and Thread constrain higher prices.':Object.values(row.worstDistances).some(n=>n>0)?'The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another.':'All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks.',
 scenarioScores:row.scenarioScores.map(s=>({id:s.id,median:s.quantiles.median,distances:s.distances})),
 }));
const structuralChanges=[
 ['Bound Star Thread bank pauses weekly inflow without erasing old balances; production and model use the same grant function.',['packages/game-rules/src/cardrpg/economy-v3.ts','supabase/functions/_shared/economy-v3.ts','tools/chain/economy-lab/token.mjs']],
 ['Showcase Thread fitting cost stays fixed per shelf so every permanent upgrade remains affordable under a small bank.',['packages/game-rules/src/cardrpg/economy-sinks-v3.ts','tools/chain/economy-lab/studio.mjs']],
 ['Native item qualities and completed-route origins replace reconstructed qualities and encounter-count reward eligibility.',['tools/chain/economy-lab/cohort.mjs','tools/chain/economy-lab/token.mjs']],
 ['V3 guaranteed Legendary tailoring has its own recipe and distinct-earned-seal proof requirement; legacy C2 stays separate.',['packages/game-rules/src/cardrpg/depth/equipment-v4.ts','packages/game-rules/src/cardrpg/economy-v3.ts']],
 ['Confirmed deterministic studio burns can earn a capped Spool rebate; all accounts use the same quote and repeated finalization cannot duplicate credit.',['packages/game-rules/src/cardrpg/economy-v3.ts','supabase/functions/_shared/economy-v3.ts','tools/chain/economy-lab/token.mjs','supabase/tests/src/economy-sinks-v3.test.ts']],
].map(([description,paths])=>({description,sources:paths.map(path=>signed(resolve(root,path)))}));
const output={date:new Date().toISOString(),sources,leverNames:[...levers],configs:[...unique.values()].map(({configHash,recordedHash,seeds,rounds,score,scenarioScores})=>({configHash,recordedHash,seeds,rounds,score,scenarioScores})),
 confirmed:confirmation?.confirmed??[],confirmation:confirmationPath?signed(confirmationPath):null,structuralChanges,
 pareto,paretoMethod:'Nondominated membership among explicitly comparable rounds; the review table contains the best twenty even when some are dominated.',comparableRounds:selectedRounds,
 counts:{loggedSearches:rounds.length,evaluated:rounds.reduce((n,r)=>n+r.configsEvaluated,0),unique:unique.size,comparable:comparable.length,frontSize:ranked.filter(r=>!r.dominated).length},
};
writeFileSync(resolve(B,'SEARCH.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({...output.counts,confirmed:output.confirmed.length,reviewRows:pareto.length}));
