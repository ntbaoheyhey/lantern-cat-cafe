// REFERENCE: A5 B1 threat-beats47. Check semantics before numeric screening.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
const name=process.argv[2],root='reports/cardrpg-big/a5/b1/threat-beats-47';
assert(['control','boss','all'].includes(name));
const reg=JSON.parse(await readFile(`${root}/${name}/REGISTERED-METHOD.json`));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.BIG_RULES_ROOT,reg.sourceRoot);
for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(`${reg.sourceRoot}/${p}`)),h,p);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const parent=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/fatal-choices-32/REGISTERED-METHOD.json'));
const rows=[],off=[],schedules=[];
try{
 if(name!=='control')for(let seed=1;seed<=500;seed++)for(const actor of ['foe-0-yarn-giant','foe-0-rain-spool','foe-0-pantry-crown','foe-1-binding-thread']){
  const rounds=Array.from({length:49},(_,i)=>i+1).filter(round=>R.signatureBeatV4(seed,actor,round));
  assert.equal(rounds.length,16); // nominal beats3..48, each at most one round away
  for(let i=0;i<rounds.length;i++){
   assert(Math.abs(rounds[i]-3*(i+1))<=1);
   if(i)assert(rounds[i]-rounds[i-1]>=2&&rounds[i]-rounds[i-1]<=4);
  }
  schedules.push({seed,actor,rounds});
 }
 for(const input of parent.inputs){
  assert.equal(sha(await readFile(input.path)),input.sha256);
  const saved=JSON.parse(await readFile(input.path));
  for(const mode of ['on','off','tutorial']){
   const setup=structuredClone(saved.before.initial);
   if(mode==='off')setup.gameplayV4=false;
   if(mode==='tutorial')setup.tutorial=true;
   const b=R.createBattle(setup),initialSha256=sha(JSON.stringify(b)),intents=[];let seenRound=0;
   while(!b.result){
    if(b.round!==seenRound){
     seenRound=b.round;
     for(const intent of b.intents){
      const actor=b.actors.find(a=>a.id===intent.actorId),tier=R.ENEMY_BY_ID[actor.catalogId].tier;
      const changed=name!=='control'&&mode==='on'&&(name==='all'||tier==='boss');
      const expected=changed?R.signatureBeatV4(b.seed,actor.id,b.round):b.round%3===0;
      assert.equal(intent.signature,expected);assert.equal(intent.power,expected?175:100);
      intents.push({round:b.round,actorId:actor.id,signature:intent.signature,power:intent.power});
     }
    }
    if(R.currentActor(b)?.side==='enemy')assert(R.enemyAct(b));
    else{const prior=JSON.stringify(b),choice=R.chooseAction(b,'auto');assert.deepEqual(R.chooseAction(b,'auto'),choice);assert.equal(JSON.stringify(b),prior);assert(R.act(b,choice));}
   }
   assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
   rows.push({key:saved.key,seed:saved.seed,mode,initialSha256,battleSha256:sha(JSON.stringify(b)),won:b.result==='party',intents,battle:b});
  }
 }
 for(const seed of [1,2,3,4,5])for(const chapter of [1,2,3])for(const team of [['mochi','soot','clover'],['inkcap','sorrel','brioche'],['mallow','biscuit','cinnamon']]){
  const state=R.createDepthAccount(seed);state.team=team;state.account.cards=team.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));
  for(const id of team){state.rows[id]=R.CAT_BY_ID[id].row;state.skills[id]=R.defaultSkills(state,id);}
  const b=R.playBattle(R.createBattle({seed,chapter,cats:R.battleCats(state),enemies:[R.CHAPTERS[chapter-1].boss]}),'auto');
  off.push({seed,chapter,team,sha256:sha(JSON.stringify(b))});
 }
 assert.deepEqual(off,JSON.parse(await readFile('reports/cardrpg-big/a5/b1/queued-reply-33/baseline-probe.json')).off);
 if(name!=='control'){
  const control=JSON.parse(await readFile(`${root}/control/probe.json`));
  for(let i=0;i<rows.length;i++){
   const row=rows[i],old=control.rows[i];assert.equal(row.key,old.key);assert.equal(row.mode,old.mode);
   assert.equal(row.initialSha256,old.initialSha256);
   if(row.mode!=='on')assert.deepEqual(JSON.parse(JSON.stringify(row)),old);
  }
 }
}finally{await vite.close();}
await writeFile(`${root}/${name}/probe.json`,JSON.stringify({name,passed:true,rows,off,schedules},null,2)+'\n');
console.log(JSON.stringify({name,passed:true,replays:rows.length,off:off.length,schedules:schedules.length}));
