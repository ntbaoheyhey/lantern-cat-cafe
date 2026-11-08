// REFERENCE: A5 B1 reply-pressure39 registration. No acceptance samples.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
const [name,mode]=process.argv.slice(2),out='reports/cardrpg-big/a5/b1/reply-pressure-39/'+name;
assert(['pressure115','pressure130','pressure145'].includes(name));assert(['candidate','observed'].includes(mode));
const method=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));
const source=mode==='candidate'?method:JSON.parse(await readFile(out+'/OBSERVER.json'));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(process.env.BIG_RULES_ROOT,source.sourceRoot);
for(const[p,h]of Object.entries(source.source))assert.equal(sha(await readFile(source.sourceRoot+'/'+p)),h,p);
globalThis.__a5ReplyPressure={replies:0};
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const parent=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/fatal-choices-32/REGISTERED-METHOD.json'));
const rows=[],off=[],scaling=[];
try{
 for(const input of parent.inputs){
  assert.equal(sha(await readFile(input.path)),input.sha256);
  const saved=JSON.parse(await readFile(input.path));
  for(const variant of ['original','tutorial','off','nonboss']){
   const setup=structuredClone(saved.before.initial);
   if(variant==='tutorial')setup.tutorial=true;
   if(variant==='off')setup.gameplayV4=false;
   if(variant==='nonboss')setup.enemies=['needle-moth'];
   const b=R.createBattle(setup);
   for(const a of b.actors.filter(a=>a.side==='enemy')){
    const spec=R.ENEMY_BY_ID[a.catalogId],stats=b.initial.enemyStats[a.catalogId],scale=setup.tutorial?.55:1+Math.max(0,setup.chapter-spec.chapter)*.16;
    const base=Math.round(stats.attack*scale*(setup.tutorial?1:[2.7,1.95,1.6][setup.chapter-1]));
    const expected=setup.gameplayV4&&!setup.tutorial&&spec.tier==='boss'?Math.round(base*method.multiplier):base;
    assert.equal(a.attack,expected);assert.equal(a.maxHp,Math.round(stats.hp*scale));assert.equal(a.defense,stats.defense);
    scaling.push({key:saved.key,variant,catalogId:a.catalogId,base,attack:a.attack,hp:a.maxHp});
   }
  }
  const b=R.createBattle(saved.before.initial);let choices=0;
  while(!b.result){
   if(R.currentActor(b)?.side==='enemy')assert(R.enemyAct(b));
   else{const prior=JSON.stringify(b),choice=R.chooseAction(b,'auto');assert.deepEqual(R.chooseAction(b,'auto'),choice);assert.equal(JSON.stringify(b),prior);assert(R.legalChoices(b).some(c=>JSON.stringify(c)===JSON.stringify(choice)));assert(R.act(b,choice));choices++;}
  }
  assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
  rows.push({key:saved.key,seed:saved.seed,won:b.result==='party',choices,battle:b});
 }
 if(mode==='candidate')for(const seed of [1,2,3,4,5])for(const chapter of [1,2,3])for(const team of [['mochi','soot','clover'],['inkcap','sorrel','brioche'],['mallow','biscuit','cinnamon']]){
  const state=R.createDepthAccount(seed);state.team=team;state.account.cards=team.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));
  for(const id of team){state.rows[id]=R.CAT_BY_ID[id].row;state.skills[id]=R.defaultSkills(state,id);}
  const b=R.playBattle(R.createBattle({seed,chapter,cats:R.battleCats(state),enemies:[R.CHAPTERS[chapter-1].boss]}),'auto');assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
  off.push({seed,chapter,team,sha256:sha(JSON.stringify(b))});
 }
 if(mode==='candidate')assert.deepEqual(off,JSON.parse(await readFile('reports/cardrpg-big/a5/b1/queued-reply-33/baseline-probe.json')).off);
 else{assert(globalThis.__a5ReplyPressure.replies>0);const plain=JSON.parse(await readFile(out+'/candidate-probe.json'));assert.equal(JSON.stringify(rows),JSON.stringify(plain.rows));assert.deepEqual(scaling,plain.scaling);}
}finally{await vite.close();}
await writeFile(out+'/'+mode+'-probe.json',JSON.stringify({name,mode,passed:true,rows,off,scaling,stats:globalThis.__a5ReplyPressure},null,2)+'\n');
console.log(JSON.stringify({name,mode,passed:true,replays:rows.length,off:off.length,scaling:scaling.length,stats:globalThis.__a5ReplyPressure}));
