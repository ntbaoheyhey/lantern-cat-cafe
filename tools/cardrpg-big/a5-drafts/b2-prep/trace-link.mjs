// Read-only TRAIN diagnostic. No source mutations or new acceptance seeds.
import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';
import {fixtures} from './team-fixtures.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/b2/link-traces';await mkdir(out,{recursive:true});
const registration=JSON.parse(await readFile('/tmp/cardrpg-a5-b2-prep/REGISTERED-LINK-TRACES.json','utf8'));
const manifest=JSON.parse(await readFile('/tmp/cardrpg-a5-b2-prep/REGISTERED-CREW-ABLATION.json','utf8'));
const train=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/train/results.json','utf8'));
for(const [file,hash]of Object.entries(train.source))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,file);
const suite=await loadRules({probe:true}),R=suite.depth,F=fixtures(R,suite.legacy),original=new Map(train.rows.map(r=>[r.key,r]));
let live=null,raw=[];globalThis.__a5HpProbe=(battle,source,target,amount,kind)=>{
 if(battle!==live||kind!=='shared')return;
 raw.push({round:battle.round,source:source.id,target:target.id,hp:target.hp,shield:target.shield,requested:amount,effective:Math.min(target.hp,Math.max(0,Math.round(amount))),fatal:amount>=target.hp,logIndex:battle.log.length});
};
const examples=[];
try{
 for(const team of manifest.teams.filter(t=>t.includes('brioche')))for(const chapter of [1,2,3])for(const seed of registration.seeds){
  const s=F.fixture(seed,6,'epic',team),cats=R.battleCats(s),utility=s.team.reduce((n,id)=>n+R.powerV4(s,id).utility,0),rawPower=cats.reduce((n,c)=>n+R.rawPowerV4(c.stats),0);
  const scale=(R.teamPowerV4(F.fixture(seed,6,'epic'))-utility)/rawPower;
  for(const cat of cats)for(const k of ['hp','attack','defense'])cat.stats[k]=Math.max(1,Math.round(cat.stats[k]*scale));
  const setup={seed,chapter,cats,enemies:[R.CHAPTERS[chapter-1].boss],gameplayV4:true,challengeLevel:6};
  const b=R.createBattle(setup);live=b;raw=[];R.playBattle(b,'auto');live=null;
  const key=JSON.stringify({kind:'teams',team,chapter,level:6});assert.equal(Number(b.result==='party'),Number(original.get(key).outcomes[seed-1]));
  const replay=R.replayBattle(b.initial,b.choices);assert.deepEqual(replay,b);
  const calls=raw.filter(x=>x.target==='brioche');
  examples.push({team,chapter,seed,result:b.result,sharedHp: calls.reduce((n,x)=>n+x.effective,0),sharedWithShield:calls.filter(x=>x.shield>0),fatalShared:calls.filter(x=>x.fatal),battle:b});
 }
 const summary=examples.map(({battle,...row})=>row);
 await writeFile(out+'/results.json',JSON.stringify({registration,source:train.source,examples},null,2));
 await writeFile(out+'/summary.json',JSON.stringify({registration,summary},null,2));
 console.log(JSON.stringify({examples:examples.length,withShield:summary.filter(x=>x.sharedWithShield.length).length,fatalShared:summary.filter(x=>x.fatalShared.length).length}));
}finally{delete globalThis.__a5HpProbe;await suite.close();}
