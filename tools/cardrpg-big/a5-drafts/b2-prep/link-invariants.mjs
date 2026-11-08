import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';
const base='/tmp/cardrpg-a5-b2-prep',manifest=JSON.parse(await readFile('reports/cardrpg-big/a5/b2/link-candidate-01/manifest.json','utf8'));
assert.equal(createHash('sha256').update(await readFile(base+'/linked-shield-battle.ts')).digest('hex'),manifest.candidateSha256);
const old=await loadRules(),next=await loadRules({transforms:{'packages/game-rules/src/cardrpg/depth/battle.ts':base+'/linked-shield-battle.ts'}}),checks=[];
function setup(R,v4,shield=0,hp=1000,chain=false){
 const input={seed:17,chapter:1,gameplayV4:v4,enemies:['button-guard'],cats:R.CATS.slice(0,3).map((cat,i)=>({id:cat.id,row:i?'rear':'front',stats:{hp:1000,attack:10,defense:0,effectHitBp:0,effectResistBp:0,healingBp:0},skills:cat.skills.slice(0,3).map(s=>s.id)}))};
 const b=R.createBattle(input),[victim,protector,third,enemy]=b.actors;
 for(const a of b.actors){a.statuses=[];a.shield=0;a.bonuses={};a.setEffects=[];}
 protector.shield=shield;protector.hp=hp;enemy.attack=100;
 victim.statuses=[{id:'link',stacks:1,remaining:3,source:protector.id,appliedRound:1}];
 if(chain)protector.statuses=[{id:'link',stacks:1,remaining:3,source:third.id,appliedRound:1}];
 b.queue=[enemy.id,third.id];b.intents=[{actorId:enemy.id,targetId:victim.id,label:'test single hit',counter:'test',power:100,signature:false,interrupted:false}];b.log=[];
 return b;
}
try{
 for(const v4 of [false,true])for(const shield of [0,5,100]){
  const a=setup(old.depth,v4,shield),b=setup(next.depth,v4,shield),oldJson=JSON.stringify(a);
  assert(old.depth.enemyAct(a));assert(next.depth.enemyAct(b));
  if(!v4||!shield)assert.deepEqual(b,a,'OFF or zero shield preserves the complete historical action');
  else {
   const shared=a.log.filter(e=>e.kind==='shared').reduce((n,e)=>n+e.amount,0),covered=Math.min(shield,shared);
   assert.equal(b.actors[0].hp,a.actors[0].hp,'recipient keeps exactly its unshared HP loss');
   assert.equal(b.actors[1].hp-a.actors[1].hp,covered);assert.equal(a.actors[1].shield-b.actors[1].shield,covered);
   assert.equal(b.rng,a.rng,'no extra roll');
   assert.equal(b.log.filter(e=>e.kind==='absorbed'&&e.text==='Shield absorbed linked damage').reduce((n,e)=>n+e.amount,0),covered);
  }
  assert.notEqual(JSON.stringify(a),oldJson);
 }
 checks.push('complete OFF and zero-shield parity; partial/full shields conserve redirected damage; no extra RNG');
 const lethal=setup(next.depth,true,100,1);assert(next.depth.enemyAct(lethal));assert.equal(lethal.actors[1].hp,1);assert(!lethal.log.some(e=>e.kind==='defeat'&&e.targetId===lethal.actors[1].id));
 const uncovered=setup(next.depth,true,0,1);assert(next.depth.enemyAct(uncovered));assert.equal(uncovered.actors[1].hp,0);
 const chained=setup(next.depth,true,0,1000,true);assert(next.depth.enemyAct(chained));assert.equal(chained.actors[2].hp,1000);assert(chained.log.filter(e=>e.kind==='shared').every(e=>e.targetId===chained.actors[1].id));
 checks.push('shield prevents a locally lethal shared hit; uncovered hit still kills; linked damage never chains');
 await writeFile(base+'/link-invariants.json',JSON.stringify({candidateSha256:manifest.candidateSha256,checks,status:'PASS; isolated mechanics only'},null,2));console.log(JSON.stringify(checks));
}finally{await old.close();await next.close();}
