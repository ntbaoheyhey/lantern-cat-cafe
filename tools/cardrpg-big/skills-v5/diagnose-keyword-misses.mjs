// Replay the already measured D3 misses, preserving exact final battle hashes.
// No candidate, new seed, counterfactual or acceptance observation is introduced.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const root='reports/cardrpg-big/skills-v5/s5/selected';
const sha=x=>createHash('sha256').update(x).digest('hex');
const original=JSON.parse(await readFile(root+'/metrics/results.json','utf8'));
for(const [path,hash] of Object.entries(original.registration.source))assert.equal(sha(await readFile(path)),hash,path);
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),C=suite.rules;
const failures=original.rows.filter(r=>r.cohort==='base'&&((r.crew==='thread'&&r.encounter===1&&!r.keywords.scald)||(r.crew==='night-lamp'&&r.encounter===2&&!r.keywords.bitter)));
assert.equal(failures.length,23);
const rows=[];
try {
 for(const prior of failures){
  const crew=R.CREWS_V5.find(c=>c.id===prior.crew);
  const b=R.createBattle({seed:prior.seed,chapter:1,gameplayV4:true,skillsV5:true,cats:crew.cats.map(id=>({id,stats:{...C.CARD_BY_ID[id].baseStats},skills:R.CAT_BY_ID[id].skills.map(s=>s.id),row:R.CAT_BY_ID[id].row})),enemies:prior.enemies});
  const turns=[];
  while(!b.result){
   const actor=R.currentActor(b),start=b.log.length;
   const observed=['kettle-knight','yarn-giant'].includes(actor.catalogId);
   const before=observed?{round:b.round,actor:actor.catalogId,hp:actor.hp,maxHp:actor.maxHp,phase:actor.phase,statuses:structuredClone(actor.statuses),intent:structuredClone(b.intents.find(i=>i.actorId===actor.id)),party:b.actors.filter(a=>a.side==='party').map(a=>({id:a.id,hp:a.hp,row:a.row,statuses:structuredClone(a.statuses)}))}:null;
   if(actor.side==='enemy')assert(R.enemyAct(b));else assert(R.act(b,R.chooseAction(b,'auto')));
   if(before)turns.push({...before,afterHp:actor.hp,logs:b.log.slice(start)});
  }
  assert.equal(sha(JSON.stringify(b)),prior.battleSha256,prior.key);
  rows.push({key:prior.key,seed:prior.seed,crew:prior.crew,expectedMissing:prior.crew==='thread'?'scald':'bitter',battleSha256:prior.battleSha256,turns});
 }
 const receipt={sourceDigest:original.registration.sourceDigest,method:'Exact replay of the 23 previously observed D3 miss seeds. Final battle hash asserted against full TRAIN receipt. No resampling or source changes.',rows};
 await writeFile(root+'/keyword-attribution.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(rows.map(r=>({seed:r.seed,crew:r.crew,turns:r.turns.length,eligible:r.turns.filter(t=>t.actor==='yarn-giant'?t.phase===2&&t.intent.signature:t.hp<t.maxHp/2&&!t.intent.signature).map(t=>({round:t.round,hp:t.hp,dazed:t.statuses.some(s=>s.id==='drowsy'),interrupted:t.intent.interrupted,logs:t.logs.filter(l=>['resist','enemy-action','daze','dispel','status'].includes(l.kind))}))}))));
}finally{await suite.vite.close();}
