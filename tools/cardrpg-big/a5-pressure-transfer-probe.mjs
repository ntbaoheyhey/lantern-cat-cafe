// REFERENCE: pressure-transfer27 registration. TRAIN seed7; no balance samples.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
const name=process.argv[2],transfer={transfer15:15,transfer30:30}[name];assert(transfer);
const root=`reports/cardrpg-big/a5/b1/pressure-transfer-27/${name}`;
const reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
for(const [path,digest]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+path)),digest,path);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const rows=[];
try{
 for(const on of [false,true])for(const enemyId of ['yarn-giant','rain-spool','pantry-crown'])for(const phase of [1,2])for(const frontCount of [0,1,2,3]){
  let s=R.setGameplayV4(R.createDepthAccount(7),on);s.account.cards.forEach(c=>c.level=6);
  const cats=R.battleCats(s);cats.forEach((c,i)=>{c.stats.hp=10000;c.stats.attack=1;c.row=i<frontCount?'front':'rear';c.effects=[];c.bonuses={};});
  const b=R.createBattle({seed:7,chapter:1,gameplayV4:on,cats,enemies:[enemyId],enemyStats:{[enemyId]:{hp:10000,attack:80,defense:10}}});
  const enemy=b.actors.find(a=>a.side==='enemy');
  assert.equal(b.intents[0].power,on?100+transfer:100);
  if(phase===2){enemy.hp=Math.floor(enemy.maxHp/2);if(on)R.phaseBossV4(b,enemy);else enemy.phase=2;}
  while(b.round<3){const a=R.currentActor(b);assert(a.side==='party'?R.act(b,R.legalChoices(b).find(c=>c.skillId==='defend')):R.enemyAct(b));}
  const i=b.intents.find(i=>i.actorId===enemy.id),count=Math.max(1,phase===2?3:frontCount);
  assert.equal(i.power,on?175-2*transfer/count:175);
  if(on){assert.equal(i.phase,phase);assert(Math.abs(2*(100+transfer)+count*i.power-(200+175*count))<1e-9);}
  else assert.equal(Object.hasOwn(i,'phase'),false);
  const start=JSON.stringify(b);R.chooseAction(b,'auto');assert.equal(JSON.stringify(b),start);
  rows.push({on,enemyId,phase,frontCount,targets:count,basic:on?100+transfer:100,signature:i.power,rawBudget:200+175*count,offBattleSha256:on?null:sha(start)});
 }
 for(const on of [false,true])for(const enemyId of ['yarn-giant','rain-spool','pantry-crown']){
  const s=R.setGameplayV4(R.createDepthAccount(7),on);s.account.cards.forEach(c=>c.level=6);
  const b=R.playBattle(R.createBattle({seed:7,chapter:1,gameplayV4:on,challengeLevel:6,cats:R.battleCats(s),enemies:[enemyId]}),'auto');
  assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
 }
}finally{await vite.close();}
await writeFile(root+'/pressure-semantics.json',JSON.stringify({name,transfer,source:reg.combatSource,cases:rows.length,rows,replays:6,limitations:'Raw fixed-target budget only; not actual damage equality or balance acceptance.'},null,2)+'\n');
console.log(JSON.stringify({name,cases:rows.length,replays:6,status:'PASS'}));
