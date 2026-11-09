// Exact attribution on two existing TRAIN observations; no new sample or candidate.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const root='reports/cardrpg-big/skills-v5/s5/selected',sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(root+'/metrics/results.json'),original=JSON.parse(bytes);
for(const [p,h]of Object.entries(original.registration.source))assert.equal(sha(await readFile(p)),h,p);
const inputs=original.rows.filter(r=>r.cohort==='base'&&r.crew==='probe-starters'&&r.seed===1&&r.encounter<2);
assert.equal(inputs.length,2);
const registration={registeredAt:new Date().toISOString(),sourceDigest:original.registration.sourceDigest,inputSha256:sha(bytes),scriptSha256:sha(await readFile(import.meta.filename)),inputs:inputs.map(r=>({key:r.key,battleSha256:r.battleSha256})),method:'Both seed1 original starter normal encounters, selected before replay. Match existing final hashes; inspect all actions. Diagnostic only, never a new frequency estimate, causal ablation, candidate or replacement denominator.'};
await writeFile(root+'/pacing-replay-registration.json',JSON.stringify(registration,null,2)+'\n',{flag:'wx'});
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),C=suite.rules;
const rows=[];let complete=false,error;
try{
 for(const prior of inputs){
  const b=R.createBattle({seed:prior.seed,chapter:prior.chapter,gameplayV4:true,skillsV5:true,cats:['mochi','soot','clover'].map(id=>({id,stats:{...C.CARD_BY_ID[id].baseStats},skills:R.CAT_BY_ID[id].skills.map(s=>s.id),row:R.CAT_BY_ID[id].row})),enemies:prior.enemies});
  const turns=[];
  while(!b.result){
   assert(turns.length<900);const actor=R.currentActor(b),round=b.round,start=b.log.length;
   const before=b.actors.map(a=>({id:a.id,catalogId:a.catalogId,side:a.side,hp:a.hp,maxHp:a.maxHp,shield:a.shield,statuses:structuredClone(a.statuses)}));
   const choice=actor.side==='party'?R.chooseAction(b,'auto'):null;
   const legal=actor.side==='party'?R.legalChoices(b):[];
   const offensive=legal.filter(c=>R.skillById(c.skillId,true).effects.some(e=>['hit','execute','chain','detonate'].includes(e.kind)));
   assert(actor.side==='party'?R.act(b,choice):R.enemyAct(b));
   const log=b.log.slice(start),marker=log.find(e=>['action','enemy-action'].includes(e.kind));assert(marker);
   turns.push({round,actor:actor.catalogId,side:actor.side,choice,executedSkill:marker.skillId,marker:marker.text,legalSkills:[...new Set(legal.map(c=>c.skillId))],offensiveLegalSkills:[...new Set(offensive.map(c=>c.skillId))],before,after:b.actors.map(a=>({id:a.id,hp:a.hp,shield:a.shield})),effects:log.filter(e=>e!==marker)});
  }
  const actual=sha(JSON.stringify(b));assert.equal(actual,prior.battleSha256,prior.key);
  const skills={};for(const t of turns.filter(t=>t.side==='party'))skills[t.executedSkill]=(skills[t.executedSkill]??0)+1;
  const foeIds=new Set(b.actors.filter(a=>a.side==='enemy').map(a=>a.id));
  const summary={key:prior.key,result:b.result,rounds:b.round,partyActions:turns.filter(t=>t.side==='party').length,skills,
   supportInsteadOfAvailableOffense:turns.filter(t=>t.side==='party'&&t.offensiveLegalSkills.length&&!t.effects.some(e=>['damage','detonate'].includes(e.kind)&&e.actorId===t.choice.actorId&&foeIds.has(e.targetId))).map(t=>({round:t.round,actor:t.actor,skill:t.executedSkill,offensiveLegalSkills:t.offensiveLegalSkills})),
   enemyHealingEvents:turns.flatMap(t=>t.effects.filter(e=>e.kind==='heal'&&foeIds.has(e.targetId))),
   firstEnemyDefeat:turns.findIndex(t=>t.before.some(a=>a.side==='enemy'&&a.hp>0&&t.after.find(n=>n.id===a.id)?.hp===0))+1};
  rows.push({summary,battleSha256:actual,turns});
 }
 complete=true;
}catch(e){error={message:String(e),stack:e.stack};throw e;}
finally{await writeFile(root+'/pacing-replay.json',JSON.stringify({complete,registration,rows,error,limitations:'Two exact fixed replays attribute observed decisions only. Available offense is not proof that choosing it would improve survival or whole-battle pacing. No new rules, reroll, or acceptance sample.'},null,2)+'\n');await suite.vite.close();}
console.log(JSON.stringify({complete,summaries:rows.map(r=>r.summary)}));
