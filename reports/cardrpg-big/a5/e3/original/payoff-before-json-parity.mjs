// REFERENCE: E3 registered paired same-seed wand check; do not choose a favourable new seed.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const base='reports/cardrpg-big/a5/e3',hash=b=>createHash('sha256').update(b).digest('hex');
try{
 const rows=[];
 for(const width of [1280,1440,1024]){
  const path=`${base}/browser-${width}/checks.json`,bytes=await readFile(path),r=JSON.parse(bytes);assert(r.complete);
  const encounter=r.encounters.find(e=>e.kind==='route-first'),actual=R.playBattle(R.createBattle(encounter.setup),'auto');
  assert.deepEqual(actual,encounter.battle,'Replay matches every observed battle field');
  const without=structuredClone(r.afterEquipment);without.equipment.soot={...r.beforeEquipment.equipment.soot};
  const beforeCats=R.battleCats(without),before=R.playBattle(R.createBattle({...encounter.setup,cats:beforeCats}),'auto');
  // Same exact initial route state, including its carried HP; only the previous wand is restored.
  const row={width,receipt:path,receiptSha256:hash(bytes),sameSeed:actual.seed,
   displayed:r.comparison,originalEquipment:r.beforeEquipment.equipment.soot,chosenEquipment:r.afterEquipment.equipment.soot,
   before:{battle:before,outcome:R.outcomeV4(before)},after:{battle:actual,outcome:R.outcomeV4(actual)},
   stats:{before:beforeCats.find(c=>c.id==='soot').stats,after:encounter.setup.cats.find(c=>c.id==='soot').stats}};
  const damage=b=>b.log.filter(e=>e.actorId==='soot'&&['damage','reflect','scald'].includes(e.kind)).reduce((n,e)=>n+e.amount,0);
  row.sootDamage={before:damage(before),after:damage(actual)};
  row.changed=row.sootDamage.before!==row.sootDamage.after;
  assert(row.changed,'The chosen wand must visibly change Soot damage on the fixed next encounter');rows.push(row);
 }
 await writeFile(base+'/payoff.json',JSON.stringify({passed:true,method:'Exact observed battle replay plus same seed, route, HP, boons and other equipment with Soot’s previous wand. A named damage difference is not a claim that the wand decided victory.',rows},null,2));
 console.log(JSON.stringify(rows.map(r=>({width:r.width,damage:r.sootDamage,attack:{before:r.stats.before.attack,after:r.stats.after.attack}}))));
}finally{await vite.close();}
