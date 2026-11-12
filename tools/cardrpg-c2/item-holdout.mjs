/** Independent paired follow-up. Historical cells select fixtures only; their
 * outcomes are never pooled with this predeclared seed range. */
import {readFile, writeFile, rename, access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {fixture, pairedSummary} from './item-impact.mjs';
import {root} from './runtime.mjs';

const fields=['template','cardId','mode','level','chapter','node'];
export const cellKey=row=>JSON.stringify(fields.map(k=>row[k]));
export function holdoutCells(...groups) {
 const cells=new Map();
 for(const row of groups.flat()) {
  if(fields.some(k=>row[k]===undefined)||!['bare','fourth'].includes(row.mode)||![1,2,3].includes(row.chapter)||!Number.isSafeInteger(row.level)||row.level<1||!['5-0','6-0'].includes(row.node))throw Error('Invalid item fixture');
  const cell=Object.fromEntries(fields.map(k=>[k,row[k]]));cells.set(cellKey(cell),cell);
 }
 return [...cells.values()].sort((a,b)=>cellKey(a).localeCompare(cellKey(b)));
}
export function validateSavedRow(row,count) {
 if(typeof row.pairs!=='string'||row.pairs.length!==count||!/^[0-3]+$/.test(row.pairs))throw Error('Invalid saved pairs');
 const expected=pairedSummary([...row.pairs].map(Number));
 if(Object.entries(expected).some(([k,v])=>JSON.stringify(row[k])!==JSON.stringify(v)))throw Error('Saved statistics differ from pairs');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 const arg=(k,f)=>process.argv.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3)??f;
 const runtime=arg('runtime'),input=arg('cells'),output=arg('out'),screenPath=arg('screen');
 if(!runtime||!input||!output)throw Error('Use --runtime=<frozen.mjs> --cells=<fixtures.json> --out=<report.json> [--screen=<completed-screen.json>]');
 const first=Number(arg('first-seed','101001')),count=Number(arg('count','1000'));
 if(![first,count].every(v=>Number.isSafeInteger(v)&&v>0))throw Error('Invalid seed range');
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 const runtimeSha256=hash(await readFile(runtime)),inputBytes=await readFile(input),screenBytes=screenPath?await readFile(screenPath):null;
 const screen=screenBytes?JSON.parse(screenBytes):null;
 if(screen&&(!screen.completeCatalog||screen.runtimeSha256!==runtimeSha256))throw Error('Screen is incomplete or uses another runtime');
 const cells=holdoutCells(JSON.parse(inputBytes),screen?.misses??[]);
 if(!cells.length)throw Error('No selected fixtures');
 const plan={runtimeSha256,fixturesSha256:hash(inputBytes),screenSha256:screenBytes?hash(screenBytes):null,seedRange:[first,first+count-1],cells};
 const out=resolve(output),save=async report=>{await writeFile(out+'.tmp',JSON.stringify(report));await rename(out+'.tmp',out);};
 let report={plan,completed:false,rows:[],method:'Fixed paired seed range for the complete selected fixture union. No early stopping. Original screens remain separate. Intervals are marginal paired normal approximations, not universal or simultaneous bounds.'};
 if(await access(out).then(()=>true,()=>false)) {
  if(!process.argv.includes('--resume'))throw Error('Preserve prior holdout; use --resume only for the identical unfinished plan');
  const saved=JSON.parse(await readFile(out));
  if(saved.completed||JSON.stringify(saved.plan)!==JSON.stringify(plan))throw Error('Completed or mismatched holdout plan');
  if(new Set(saved.rows.map(cellKey)).size!==saved.rows.length||saved.rows.some(row=>!cells.some(c=>cellKey(c)===cellKey(row))))throw Error('Invalid saved fixture set');
  saved.rows.forEach(row=>validateSavedRow(row,count));report=saved;
 }
 const {R}=await import(pathToFileURL(resolve(runtime)).href),cache=new Map();
 await save(report);
 for(const row of cells) {
  if(report.rows.some(r=>cellKey(r)===cellKey(row)))continue;
  const pairs=[];
  for(let seed=first;seed<first+count;seed++) {
   if(seed%100===first%100&&await access(resolve(root,'STOP-C2')).then(()=>true,()=>false))throw Error('STOP-C2 requested');
   const template=R.GEAR_BY_ID[row.template];if(!template)throw Error('Unknown template');
   const f=fixture(R,{...row,seed,template}),node=f.run.nodes.find(n=>n.id===row.node);
   const shared={seed,chapter:row.chapter,enemies:node.enemies,enemyStats:R.campaignEnemyStatsA6(f.run,node),challengeLevel:row.level,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true};
   const before={...shared,cats:R.battleCats(f.state)},key=hash(JSON.stringify(before));
   if(!cache.has(key))cache.set(key,R.playBattle(R.createBattle(before),'auto').result==='party');
   const after=R.playBattle(R.createBattle({...shared,cats:R.battleCats(f.equipped)}),'auto').result==='party';
   pairs.push((cache.get(key)?2:0)|(after?1:0));
  }
  const result={...row,...pairedSummary(pairs),pairs:pairs.join('')};report.rows.push(result);await save(report);
  console.log(JSON.stringify({...row,gainPp:result.gainPp,pairedNormal95Pp:result.pairedNormal95Pp,pass:result.pass}));
 }
 report.completed=true;await save(report);
 console.log(JSON.stringify({completed:true,cells:report.rows.length,misses:report.rows.filter(r=>!r.pass).length}));
}
