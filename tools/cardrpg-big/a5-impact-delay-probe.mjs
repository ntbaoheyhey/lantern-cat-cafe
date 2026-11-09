// REFERENCE: A5 B1 impact-delay49. Isolated semantics before numeric screening.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
const name=process.argv[2],root='reports/cardrpg-big/a5/b1/impact-delay-49';
assert(['quarter','half'].includes(name));
const reg=JSON.parse(await readFile(`${root}/${name}/REGISTERED-METHOD.json`));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.BIG_RULES_ROOT,reg.sourceRoot);
for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(`${reg.sourceRoot}/${p}`)),h,p);
for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const parent=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/fatal-choices-32/REGISTERED-METHOD.json'));
const control=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/threat-beats-47/control/probe.json'));
const rows=[],off=[],semantics=[];
try{
 for(const input of parent.inputs){
  assert.equal(sha(await readFile(input.path)),input.sha256);
  const saved=JSON.parse(await readFile(input.path));
  for(const mode of ['on','off','tutorial']){
   const setup=structuredClone(saved.before.initial);
   if(mode==='off')setup.gameplayV4=false;
   if(mode==='tutorial')setup.tutorial=true;
   const b=R.createBattle(setup),initialSha256=sha(JSON.stringify(b));let pendingStates=0;
   while(!b.result){
    if(b.actors.some(a=>R.pendingImpact49(a)>0))pendingStates++;
    if(R.currentActor(b)?.side==='enemy')assert(R.enemyAct(b));
    else{
     const prior=JSON.stringify(b),choice=R.chooseAction(b,'auto');
     assert.deepEqual(R.chooseAction(b,'auto'),choice);assert.equal(JSON.stringify(b),prior);
     assert(R.act(b,choice));
    }
    for(const a of b.actors){assert(R.pendingImpact49(a)>=0);if(a.hp===0)assert.equal(R.pendingImpact49(a),0);}
   }
   assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
   const old=control.rows[rows.length];assert.equal(old.key,saved.key);assert.equal(old.mode,mode);
   assert.equal(initialSha256,old.initialSha256);
   if(mode!=='on'){assert.equal(sha(JSON.stringify(b)),old.battleSha256);assert.equal(pendingStates,0);}
   rows.push({key:saved.key,seed:saved.seed,mode,initialSha256,battleSha256:sha(JSON.stringify(b)),won:b.result==='party',pendingStates,battle:b});
  }
 }
 // Controlled mechanics fixtures, explicitly separate from earned progression samples.
 const initial=rows[0].battle.initial;
 function hit({tutorial=false,nonboss=false,hp=10000}={}){
  const setup={...structuredClone(initial),tutorial,enemies:[nonboss?'button-guard':'yarn-giant']};
  const b=R.createBattle(setup),boss=b.actors.find(a=>a.side==='enemy'),cat=b.actors.find(a=>a.id==='mochi');
  for(const a of b.actors){a.hp=a.maxHp=10000;a.shield=0;a.statuses=[];a.bonuses={};a.setEffects=[];a.defense=0;}
  boss.attack=100;cat.hp=hp;cat.row='front';
  for(const a of b.actors.filter(a=>a.side==='party'&&a.id!==cat.id))a.row='rear';
  b.round=1;b.acted=[];b.queue=[boss.id,cat.id];b.log=[];
  b.intents=[{actorId:boss.id,targetId:cat.id,signature:false,power:100,label:'Controlled ordinary hit',interrupted:false}];
  assert(R.enemyAct(b));return {b,boss,cat};
 }
 {
  const {b,boss,cat}=hit(),immediate=b.log.find(e=>e.kind==='damage'&&e.targetId===cat.id).amount;
  const pending=R.pendingImpact49(cat),total=immediate+pending;
  assert(pending>0);assert.equal(pending,Math.round(total*reg.fraction));
  assert.equal(cat.hp,10000-immediate);
  const choice=R.legalChoices(b).find(c=>c.skillId==='defend');assert(choice);
  const clone=structuredClone(b);assert(R.act(clone,choice));assert(R.act(b,choice));assert.deepEqual(b,clone);
  assert.equal(R.pendingImpact49(cat),0);
  const settled=b.log.filter(e=>e.kind==='delayed-impact'&&e.targetId===cat.id);
  assert.equal(settled.length,1);assert.equal(settled[0].amount,pending);assert.equal(settled[0].actorId,boss.id);
  assert(cat.shield>0,'Delayed HP loss must not consume a shield earned after the original hit.');
  semantics.push({kind:'conserved-hit-and-one-own-action-settlement',immediate,pending,total,shieldAfter:cat.shield});
 }
 for(const options of [{tutorial:true},{nonboss:true}]){
  const {b,cat}=hit(options);assert.equal(R.pendingImpact49(cat),0);
  assert(!b.log.some(e=>e.kind==='pending-impact'||e.kind==='delayed-impact'));
  semantics.push({kind:options.tutorial?'tutorial-unchanged':'nonboss-unchanged'});
 }
 {
  const {b,cat}=hit({hp:1});assert.equal(cat.hp,0);assert.equal(R.pendingImpact49(cat),0);
  assert.equal(b.log.filter(e=>e.kind==='defeat'&&e.targetId===cat.id).length,1);
  semantics.push({kind:'immediate-defeat-clears-unpayable-impact'});
 }
 {
  const {b,boss,cat}=hit();
  for(const a of b.actors.filter(a=>a.side==='party'&&a.id!==cat.id))a.hp=0;
  cat.hp=1;boss.hp=1;cat.attack=10000;
  const choice=R.legalChoices(b).find(c=>c.targetId===boss.id&&R.skillById(c.skillId).effects.some(e=>e.kind==='hit'));assert(choice);
  assert(R.act(b,choice));assert.equal(boss.hp,0);assert.equal(cat.hp,0);assert.equal(b.result,'enemy');
  assert.equal(R.pendingImpact49(cat),0);
  semantics.push({kind:'simultaneous-final-defeat-settles-before-result',result:b.result});
 }
 for(const seed of [1,2,3,4,5])for(const chapter of [1,2,3])for(const team of [['mochi','soot','clover'],['inkcap','sorrel','brioche'],['mallow','biscuit','cinnamon']]){
  const state=R.createDepthAccount(seed);state.team=team;state.account.cards=team.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));
  for(const id of team){state.rows[id]=R.CAT_BY_ID[id].row;state.skills[id]=R.defaultSkills(state,id);}
  const b=R.playBattle(R.createBattle({seed,chapter,cats:R.battleCats(state),enemies:[R.CHAPTERS[chapter-1].boss]}),'auto');
  off.push({seed,chapter,team,sha256:sha(JSON.stringify(b))});
 }
 assert.deepEqual(off,control.off);
}finally{await vite.close();}
await writeFile(`${root}/${name}/probe.json`,JSON.stringify({name,passed:true,rows,off,semantics},null,2)+'\n');
console.log(JSON.stringify({name,passed:true,replays:rows.length,off:off.length,semantics}));
