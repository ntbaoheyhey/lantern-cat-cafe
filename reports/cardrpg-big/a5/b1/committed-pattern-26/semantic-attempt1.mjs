// REFERENCE: A5 B1 committed-pattern26. Controlled semantic tests; TRAIN seed7 only.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from './a4-load.mjs';
const root='reports/cardrpg-big/a5/b1/committed-pattern-26',variant=process.argv[2];
assert(['control','candidate'].includes(variant));
const reg=JSON.parse(await readFile(`${root}/REGISTERED-METHOD.json`,'utf8'));
const source=variant==='candidate'?reg.source:JSON.parse(await readFile('reports/cardrpg-big/a5/b1/current-cliffs-24/REGISTERED-METHOD.json','utf8')).source;
const sha=x=>createHash('sha256').update(x).digest('hex');
for(const [p,d] of Object.entries(source))assert.equal(sha(await readFile(`${process.env.BIG_RULES_ROOT}/${p}`)),d,p);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),rows=[],other=[];
const bosses=['yarn-giant','rain-spool','pantry-crown'];
function account(on=true){const s=R.setGameplayV4(R.createDepthAccount(7),on);s.account.cards.forEach(c=>c.level=6);return s;}
function setup(on,enemyId,extras=[]){const cats=R.battleCats(account(on));for(const c of cats){c.stats.hp=10000;c.stats.attack=1;c.effects=[];c.bonuses={};}return {seed:7,chapter:1,gameplayV4:on,cats,enemies:[enemyId,...extras]};}
try{
 for(const gameplayV4 of [false,true])for(const enemyId of bosses)for(const context of ['crossing','closing','legacy','cap','fatal'])for(const control of ['none','hush','drowsy']){
  const b=R.createBattle(setup(gameplayV4,enemyId,context==='cap'?['binding-thread','binding-thread']:[]));
  const enemy=b.actors.find(a=>a.catalogId===enemyId),intent=b.intents.find(i=>i.actorId===enemy.id),party=b.actors.filter(a=>a.side==='party');
  b.round=3;b.queue=[enemy.id,'mochi'];intent.signature=true;intent.power=175;
  for(const a of party){a.shield=100;a.statuses=[];}
  enemy.hp=Math.floor(enemy.maxHp/2);R.phaseBossV4(b,enemy);
  if(!gameplayV4)enemy.phase=2;
  if(context!=='crossing'&&gameplayV4&&variant==='candidate')intent.phase=2;
  if(context==='legacy')delete intent.phase;
  if(context==='fatal'){
   enemy.hp=1;for(const a of party)a.statuses.push({id:'riposte',stacks:1,remaining:3,source:a.id,appliedRound:0});
  }
  if(control!=='none')enemy.statuses.push({id:control,stacks:1,remaining:3,source:'soot',appliedRound:0});
  const start=b.log.length;assert(R.enemyAct(b));const events=b.log.slice(start);
  const rearHit=events.some(e=>e.actorId===enemy.id&&['damage','absorbed'].includes(e.kind)&&party.some(a=>a.id===e.targetId&&a.row==='rear'));
  const expectedRear=control!=='drowsy'&&(!gameplayV4||context!=='crossing');
  const summonEligible=enemyId==='yarn-giant'||enemyId==='pantry-crown'&&(!gameplayV4||context!=='crossing');
  const expectedSummon=control==='none'&&summonEligible&&context!=='cap'&&(!gameplayV4||context!=='fatal');
  const expectedSuppressed=gameplayV4&&(control==='drowsy'||control==='hush'&&summonEligible&&context!=='cap'&&context!=='fatal');
  const checks={rear:rearHit===expectedRear,summon:events.some(e=>e.kind==='summon')===expectedSummon,suppressed:events.some(e=>e.kind==='suppressed')===expectedSuppressed};
  rows.push({gameplayV4,enemyId,context,control,checks,events,battleSha256:sha(JSON.stringify(b))});
 }
 // Generate and replay actual complete automatic battles; every preview leaves input intact.
 for(const gameplayV4 of [false,true])for(const enemyId of bosses){
  const b=R.createBattle({...setup(gameplayV4,enemyId),cats:R.battleCats(account(gameplayV4)),challengeLevel:6});
  const before=JSON.stringify(b),choice=R.chooseAction(b,'auto');assert.equal(JSON.stringify(b),before);assert(R.legalChoices(b).some(c=>JSON.stringify(c)===JSON.stringify(choice)));
  R.playBattle(b,'auto');assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
  other.push({kind:'automatic-replay-preview',gameplayV4,enemyId,battleSha256:sha(JSON.stringify(b)),intentPhases:b.intents.map(i=>i.phase??null)});
 }
 if(variant==='candidate'){
  // An actual new round records its phase; a mid-round phase event does not rewrite it.
  const b=R.createBattle(setup(true,'pantry-crown')),enemy=b.actors.at(-1);enemy.hp=Math.floor(enemy.maxHp/2);R.phaseBossV4(b,enemy);
  assert.equal(b.intents[0].phase,1);while(b.round===1){const a=R.currentActor(b);assert(a.side==='party'?R.act(b,R.legalChoices(b).find(c=>c.skillId==='defend')):R.enemyAct(b));}
  assert.equal(b.intents[0].phase,2);other.push({kind:'next-round-phase',pass:true});
  let state=R.startRun(account(),1,7).state;state=R.enterNode(state,'0-0').state;
  const current=R.exportSave(state);assert.match(current,/^THC14\./);assert.deepEqual(R.importSave(current),state);
  const legacy=structuredClone(state);legacy.run.battle.intents.forEach(i=>delete i.phase);
  for(const prefix of [12,13]){const payload=JSON.stringify(legacy),code=`THC${prefix}.${R.saveChecksum(payload)}.${payload}`,migrated=R.importSave(code);
   assert.deepEqual(migrated,legacy);assert.match(R.exportSave(migrated),/^THC14\./);other.push({kind:'legacy-pending',prefix,unchanged:true});}
  for(const bad of [0,3,-1,1.5,'2',null]){const invalid=structuredClone(state);invalid.run.battle.intents[0].phase=bad;assert.throws(()=>R.exportSave(invalid));}
  assert.match(R.exportSave(R.createDepthAccount(7)),/^THC7\./);other.push({kind:'phase-validation-off-prefix',pass:true});
 }
}finally{await vite.close();}
const failures=rows.filter(r=>!Object.values(r.checks).every(Boolean));
await writeFile(`${root}/semantic-${variant}.json`,JSON.stringify({variant,source,total:rows.length,pass:rows.length-failures.length,failures:failures.map(({events,battleSha256,...r})=>r),rows,other},null,2)+'\n');
console.log(JSON.stringify({variant,total:rows.length,pass:rows.length-failures.length,failures:failures.map(({events,battleSha256,...r})=>r),other}));
if(variant==='candidate')assert.equal(failures.length,0);
