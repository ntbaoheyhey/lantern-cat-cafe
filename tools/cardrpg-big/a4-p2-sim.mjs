// REFERENCE: GAMEPLAY-V4 sections3/4/9. Train-only pilot; no heldout tuning or acceptance claim.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a4/p2/sim';await mkdir(out,{recursive:true});
const paths=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg'],{encoding:'utf8'}).trim().split('\n');
const source=Object.fromEntries(await Promise.all([...new Set(paths)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const checkpoint=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}'));
if(checkpoint.source)assert.deepEqual(checkpoint.source,source,'Runtime changed during pilot');
const rows=checkpoint.rows??[],{load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const started=Date.now(),pause=new Error('Checkpoint');
function fixture(seed,level,rarity){const s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.cards.forEach(c=>c.level=level);s.gear=[];s.equipment={};
 for(const [i,id]of s.team.entries())if(rarity!=='none')for(const slot of ['weapon','outfit','charm','relic']){const g=R.makeGear(s,`${['hearthloom','moonwick','mossbrew'][i]}-${slot}-${rarity}`,seed);s.gear.push(g);(s.equipment[id]??={})[slot]=g.id;}return s;}
const interval=(wins,n)=>{const p=wins/n,z=1.96,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [c-h,c+h];};
try{
 for(const level of [1,6])for(const chapter of [1,2,3])for(const rarity of ['none','common','rare','epic','legendary']){
  const key=`${level}/${chapter}/${rarity}`;let row=rows.find(r=>r.key===key);if(!row){row={key,level,chapter,rarity,runs:[]};rows.push(row);}
  for(let seed=1;seed<=50;seed++){
   if(row.runs.some(r=>r.seed===seed))continue;
   let s=fixture(seed,level,rarity);s=R.saveLoadoutV4(s,0,'Pilot').state;s=R.applyLoadoutV4(s,0).state;
   assert.deepEqual(R.importSave(R.exportSave(s)),s);
   const b=R.playBattle(R.createBattle({seed,chapter,cats:R.battleCats(s),enemies:[R.CHAPTERS[chapter-1].boss],gameplayV4:true}),'auto');
   assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
   assert.equal(b.energy,0);assert(b.actors.every(a=>a.break===0&&a.charge===0));
   row.runs.push({seed,won:b.result==='party',rounds:b.round,actions:b.choices.length,score:R.teamPowerV4(s),hash:hash(b)});
   if(Date.now()-started>110000){await writeFile(`${out}/partial.json`,JSON.stringify({source,rows}));process.exitCode=75;throw pause;}
  }
  row.wins=row.runs.filter(r=>r.won).length;row.wilson95=interval(row.wins,row.runs.length);console.log(JSON.stringify({...row,runs:undefined}));
  await writeFile(`${out}/partial.json`,JSON.stringify({source,rows}));
 }
 const steps=[];for(const level of [1,6])for(const chapter of [1,2,3]){const cells=rows.filter(r=>r.level===level&&r.chapter===chapter);for(let i=1;i<cells.length;i++)steps.push({level,chapter,from:cells[i-1].rarity,to:cells[i].rarity,gainPp:2*(cells[i].wins-cells[i-1].wins)});}
 await writeFile(`${out}/pilot.json`,JSON.stringify({method:'Train seeds1–50, fixed existing bosses, no threat normalization. 1500 encounters; every cell exact replay + save/preset roundtrip. Pilot only, not >=500-seed heldout acceptance.',source,rows,steps,summary:{encounters:1500,positive:steps.filter(s=>s.gainPp>=2).length,ties:steps.filter(s=>s.gainPp===0).length,reversals:steps.filter(s=>s.gainPp<0).length,acceptance:'NOT VERIFIED'}},null,2));
} catch(e){if(e!==pause)throw e;}finally{await vite.close();}
