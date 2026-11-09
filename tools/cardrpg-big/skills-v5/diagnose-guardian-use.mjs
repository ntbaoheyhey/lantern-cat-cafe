// Diagnose existing D4 observations; replay seed1 in every matched encounter, never tune or resample.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
const root='reports/cardrpg-big/skills-v5/s5/selected';
const sha=x=>createHash('sha256').update(x).digest('hex');
const original=JSON.parse(await readFile(root+'/metrics/results.json','utf8'));
for(const [p,h]of Object.entries(original.registration.source))assert.equal(sha(await readFile(p)),h,p);
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),C=suite.rules;
const themes={guardian:'hearthloom',witch:'moonwick',alchemist:'mossbrew'};
function fixture(seed,team){
 const s=R.setSkillsV5(R.createDepthAccount(seed),true);
 s.account.cards=team.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));s.team=[...team];s.gear=[];s.equipment={};s.cleared=[1,2,3];
 for(const id of team){s.rows[id]=R.CAT_BY_ID[id].row;s.skills[id]=R.defaultSkills(s,id);
  for(const slot of C.EQUIPMENT_SLOTS){const g=R.makeGear(s,`${themes[C.CARD_BY_ID[id].role]}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(g);(s.equipment[id]??={})[slot]=g.id;}}
 if(!team.some(id=>s.rows[id]==='front'))s.rows[team[0]]='front';return s;
}
function catsFor(seed,team){
 const s=fixture(seed,team),cats=R.battleCats(s),target=R.teamPowerV4(fixture(seed,['mochi','soot','clover']));
 const utility=s.team.reduce((n,id)=>n+R.powerV4(s,id).utility,0),raw=cats.reduce((n,c)=>n+R.rawPowerV4(c.stats),0),scale=(target-utility)/raw;
 assert(scale>0);for(const c of cats)for(const k of ['hp','attack','defense'])c.stats[k]=Math.max(1,Math.round(c.stats[k]*scale));
 assert(Math.abs((utility+cats.reduce((n,c)=>n+R.rawPowerV4(c.stats),0))/target-1)<=.02);return cats;
}
const inputs=original.rows.filter(r=>r.cohort==='matched'&&['oven','afternoon-tea'].includes(r.crew)&&r.seed===1);
assert.equal(inputs.length,18);const rows=[];
try{
 for(const prior of inputs){
  const crew=R.CREWS_V5.find(c=>c.id===prior.crew),guardian=prior.crew==='oven'?'mochi':'panko';
  const b=R.createBattle({seed:prior.seed,chapter:prior.chapter,gameplayV4:true,challengeLevel:6,skillsV5:true,cats:catsFor(prior.seed,crew.cats),enemies:prior.enemies});
  const turns=[];
  while(!b.result){
   const actor=R.currentActor(b);
   if(actor.side==='enemy'){assert(R.enemyAct(b));continue;}
   const choice=R.chooseAction(b,'auto');
   if(actor.catalogId===guardian){
    const legal=R.legalChoices(b),targets=legal.filter(c=>c.skillId===guardian+'-2');
    turns.push({round:b.round,chosen:choice,legalSkills:[...new Set(legal.map(c=>c.skillId))],skill2Targets:targets.map(c=>c.targetId),
     actor:{hp:actor.hp,maxHp:actor.maxHp,shield:actor.shield,statuses:structuredClone(actor.statuses)},
     allies:b.actors.filter(a=>a.side==='party'&&a.hp>0).map(a=>({id:a.id,row:a.row,hp:a.hp,maxHp:a.maxHp,shield:a.shield,policyShieldHeadroom:Math.max(0,a.maxHp*.35-a.shield),warm:a.statuses.find(s=>s.id==='cozy')?.stacks??0}))});
   }
   assert(R.act(b,choice));
  }
  assert.equal(sha(JSON.stringify(b)),prior.battleSha256,prior.key);
  rows.push({key:prior.key,guardian,seed:prior.seed,enemies:prior.enemies,battleSha256:prior.battleSha256,turns});
 }
 const summary=['mochi','panko'].map(guardian=>{const turns=rows.filter(r=>r.guardian===guardian).flatMap(r=>r.turns);return {guardian,actions:turns.length,skill2Legal:turns.filter(t=>t.skill2Targets.length).length,skill2Chosen:turns.filter(t=>t.chosen.skillId===guardian+'-2').length,basicChosen:turns.filter(t=>t.chosen.skillId===guardian+'-1').length,skill2LegalWithUncappedShieldTarget:turns.filter(t=>t.skill2Targets.some(id=>t.allies.some(a=>a.id===id&&a.policyShieldHeadroom>0))).length};});
 const receipt={sourceDigest:original.registration.sourceDigest,method:'Exact replay of seed1 in all nine existing matched encounters for Oven and Afternoon tea. Eighteen saved final hashes must match. This is eligibility/selection attribution, not a new frequency estimate, causal ablation or numeric candidate.',summary,rows};
 await writeFile(root+'/guardian-attribution.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(summary));
}finally{await suite.vite.close();}
