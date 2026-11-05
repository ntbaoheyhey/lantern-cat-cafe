// Deterministic, local-only headless policy experiment. No game/server rewards.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'), web=resolve(root,'apps/web');
const require=createRequire(resolve(web,'package.json'));
const {createServer}=await import(require.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const {choosePolicyLoot}=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/gear/run.ts'));
const E=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/turn/engine.ts'));
const {TURN_CONFIG}=await vite.ssrLoadModule(resolve(root,'packages/game-rules/src/squad/turn/config.ts'));
const trial=process.env.TURN_TRIAL||'initial';
const runs=[], rows=[], seeds=Number(process.env.TURN_SEEDS||30);
for(const encounter of ['patrol','boss','campaign'])for(const preset of ['hearthkeepers','lanternbreakers'])for(const policy of ['auto','active'])for(const gearMode of ['off','starter','high']){
 const group=[];
 for(let seed=1;seed<=seeds;seed++){
  const b=E.createTurnBattle({seed,preset,encounter,gearMode,interactive:true});E.beginRun(b);
  while(!b.result&&b.turn<TURN_CONFIG.maxTurns){
   if(b.run.stage==='loot'){E.chooseLoot(b,choosePolicyLoot(b,policy));continue}
   if(b.run.stage==='rest'){E.autoEquipGear(b);E.continueRun(b);continue}
   E.startTurn(b);
   if(b.phase==='choose'){const choice=E.getAutoAction(b,policy);if(!choice||!E.chooseAction(b,choice))throw Error('Illegal policy: '+JSON.stringify({seed,preset,encounter,policy,turn:b.turn,choice}));E.resolveAction(b);}
   E.endTurn(b);
  }
  if(!b.result)throw Error('Unfinished run');
  const result={seed,preset,encounter,policy,gearMode,...b.result,bossReached:b.bossPhase>0,bossWon:b.bossPhase>0&&b.result.winner==='party',actions:b.history.length,history:b.history};
  group.push(result);runs.push(result);
 }
 const wins=group.filter(r=>r.winner==='party'),firstDeaths={guardian:0,witch:0,alchemist:0};group.forEach(r=>{if(r.firstDeath)firstDeaths[r.firstDeath]++});
 const row={encounter,preset,policy,gearMode,seeds,wins:wins.length,winRate:wins.length/seeds,meanRounds:+(group.reduce((s,r)=>s+r.rounds,0)/seeds).toFixed(2),meanTurns:+(group.reduce((s,r)=>s+r.turns,0)/seeds).toFixed(2),meanWinningTurns:wins.length?+(wins.reduce((s,r)=>s+r.turns,0)/wins.length).toFixed(2):null,totalDeaths:group.reduce((s,r)=>s+r.deaths.length,0),firstDeaths,bossReached:group.filter(r=>r.bossReached).length,bossWins:group.filter(r=>r.bossWon).length};rows.push(row);console.log(JSON.stringify(row));
}
mkdirSync(resolve(root,'reports/turn3d-polish'),{recursive:true});const raw=JSON.stringify({date:'2026-11-05',seeds,config:TURN_CONFIG,rows,runs},null,2)+'\n';mkdirSync(resolve(root,'reports/turn3d-polish/raw'),{recursive:true});writeFileSync(resolve(root,`reports/turn3d-polish/raw/balance-${trial}.json.gz`),gzipSync(raw));writeFileSync(resolve(root,`reports/turn3d-polish/balance-${trial}.json`),JSON.stringify({date:'2026-11-05',seeds,config:TURN_CONFIG,rows,rawEvidence:{path:`reports/turn3d-polish/raw/balance-${trial}.json.gz`,sha256:createHash('sha256').update(raw).digest('hex'),uncompressedBytes:Buffer.byteLength(raw),runs:runs.length}},null,2)+'\n');await vite.close();
