// REFERENCE: GAMEPLAY-V4 section8. Training pilot; real time is measured separately.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out=process.env.BIG_PACING_OUT||'reports/cardrpg-big/a4/p3/sim';await mkdir(out,{recursive:true});
const paths=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg'],{encoding:'utf8'}).trim().split('\n');
const source=Object.fromEntries(await Promise.all([...new Set(paths)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const checkpoint=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}'));
if(checkpoint.source)assert.deepEqual(checkpoint.source,source,'Source changed in active pacing pilot');
const rows=checkpoint.rows??[],{load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),started=Date.now(),pause=new Error('Checkpoint');
try{
 for(const level of [1,6,10,50])for(const chapter of [1,2,3])for(const kind of ['ordinary','elite','boss'])for(let seed=1;seed<=50;seed++){
  const key=`${level}/${chapter}/${kind}/${seed}`;if(rows.some(r=>r.key===key))continue;
  const s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.cards.forEach(c=>c.level=level);
  const ch=R.CHAPTERS[chapter-1],enemies=kind==='boss'?[ch.boss]:kind==='elite'?[ch.elites[seed%2],ch.pool[seed%4]]:[ch.pool[seed%4],ch.pool[(seed+1)%4]];
  const b=R.playBattle(R.createBattle({seed,chapter,gameplayV4:true,challengeLevel:level,cats:R.battleCats(s),enemies}),'auto');
  assert.deepEqual(R.replayBattle(b.initial,b.choices),b);assert.equal(b.energy,0);assert(b.actors.every(a=>a.charge===0&&a.break===0));
  const finish=b.v4.events.filter(e=>e.kind==='boss-finish'),phase=b.v4.events.filter(e=>e.kind==='boss-phase');
  assert(finish.length<=1&&phase.length<=1);
  if(kind==='boss'&&b.result==='party'){assert.equal(finish.length,1);assert(b.actors.filter(a=>a.linkedBossId).every(a=>a.hp===0));}
  rows.push({key,level,chapter,kind,seed,result:b.result,rounds:b.round,actions:b.log.filter(e=>e.kind==='action'||e.kind==='enemy-action').length,phase:phase.length,finish:finish.length});
  if(Date.now()-started>110000){await writeFile(`${out}/partial.json`,JSON.stringify({source,rows}));process.exitCode=75;throw pause;}
 }
 await writeFile(`${out}/pilot.json`,JSON.stringify({source,method:'Train1–50 only; 1800encounters. No wall-time or heldout balance inference.',rows},null,2));
 console.log(JSON.stringify({encounters:rows.length,replay:'PASS',lifecycle:'PASS'}));
} catch(e){if(e!==pause)throw e;} finally{await vite.close();}
