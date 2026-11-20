// TRAIN read-only diagnosis: shield bypass during redirected Apron Link damage.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';
import {fixtures} from './team-fixtures.mjs';
const out='reports/cardrpg-big/a5/b2/link-probe',prep='/tmp/cardrpg-a5-b2-prep';
const manifest=JSON.parse(await readFile(prep+'/REGISTERED-LINK-PROBE.json','utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
for(const [file,expected] of Object.entries(manifest.source))assert.equal(hash(await readFile(file)),expected,file);
const train=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/train/results.json','utf8'));
assert.equal(hash(await readFile('reports/cardrpg-big/a4/p6/train/results.json')),manifest.trainSha256);
const original=new Map(train.rows.map(r=>[r.key,r]));
await mkdir(out,{recursive:true});
const suite=await loadRules({probe:true}),plain=await loadRules(),R=suite.depth,F=fixtures(R,suite.legacy);
const rows=[],examples=[];
try{
 for(const team of manifest.teams)for(const chapter of manifest.chapters){
  const key=JSON.stringify({kind:'teams',team,chapter,level:6});
  const row={key,team,chapter,wins:0,sharedHits:0,shieldedHits:0,bypassedHp:0,preventableHp:0,lethalWithShield:0};
  for(let seed=1;seed<=manifest.seeds[1];seed++){
   const s=F.fixture(seed,6,'epic',team),cats=R.battleCats(s);
   const utility=s.team.reduce((n,id)=>n+R.powerV4(s,id).utility,0),raw=cats.reduce((n,c)=>n+R.rawPowerV4(c.stats),0);
   const scale=(R.teamPowerV4(F.fixture(seed,6,'epic'))-utility)/raw;
   for(const cat of cats)for(const k of ['hp','attack','defense'])cat.stats[k]=Math.max(1,Math.round(cat.stats[k]*scale));
   const setup={seed,chapter,cats,enemies:[R.CHAPTERS[chapter-1].boss],gameplayV4:true,challengeLevel:6};
   const trace=[];
   globalThis.__a5HpProbe=(b,source,target,amount,kind)=>{
    if(kind!=='shared'||target.side!=='party')return;
    row.sharedHits++;
    if(target.shield<=0||amount<=0)return;
    row.shieldedHits++;row.bypassedHp+=Math.min(target.hp,amount);
    row.preventableHp+=Math.min(target.hp,target.shield,amount);
    if(amount>=target.hp)row.lethalWithShield++;
    trace.push({round:b.round,source:source.id,target:target.id,amount,hp:target.hp,shield:target.shield,lethal:amount>=target.hp});
   };
   const b=R.playBattle(R.createBattle(setup),'auto');delete globalThis.__a5HpProbe;
   row.wins+=Number(b.result==='party');assert.equal(Number(b.result==='party'),Number(original.get(key).outcomes[seed-1]));
   if(seed===1)assert.deepEqual(plain.depth.playBattle(plain.depth.createBattle(setup),'auto'),b,'Read-only observer parity');
   if(trace.length&&examples.length<6)examples.push({team,chapter,seed,result:b.result,trace});
  }
  rows.push(row);
 }
 await writeFile(out+'/results.json',JSON.stringify({manifest,rows,examples,method:'All outcomes match A4 TRAIN; observer JSON parity for seed1 in every cell. Preventable HP is a local hit bound, not a predicted battle outcome.'},null,2));
 console.log(JSON.stringify({cells:rows.length,sharedHits:rows.reduce((n,r)=>n+r.sharedHits,0),shieldedHits:rows.reduce((n,r)=>n+r.shieldedHits,0),lethalWithShield:rows.reduce((n,r)=>n+r.lethalWithShield,0)}));
}finally{delete globalThis.__a5HpProbe;await suite.close();await plain.close();}
