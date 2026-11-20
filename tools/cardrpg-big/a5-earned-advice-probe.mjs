// REFERENCE: advice55 pre-run registration. Existing suggestion, no candidate or production edit.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
const out='reports/cardrpg-big/a5/engagement/advice-55',sha=b=>createHash('sha256').update(b).digest('hex');
const registration=JSON.parse(await readFile(out+'/registration.json'));
for(const[p,h]of Object.entries(registration.inputs))assert.equal(sha(await readFile(p)),h,p);
const loader=await loadRules();
try {
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const state=JSON.parse(await readFile(out+'/earned-checkpoint.json')),entry=JSON.parse(await readFile(out+'/boss.json')),setup=entry.setup;
 assert.deepEqual(R.battleCats(state),setup.cats);assert.deepEqual(state.v4.plan,setup.plan);
 const settled=R.abandonRun(state);assert(settled.ok);assert.deepEqual(settled.state.account.currencies,state.account.currencies);
 const beforeCode=R.exportSave(settled.state),advice=R.recommendBuildV4(settled.state,setup);assert.equal(R.exportSave(settled.state),beforeCode);
 const rows=[];let applied=null;
 if(advice){
  applied=R.applyAdviceV4(settled.state,advice);assert(applied.ok);const cats=R.battleCats(applied.state);
  const hp=Object.fromEntries(cats.map(cat=>{const old=setup.cats.find(c=>c.id===cat.id);const missing=old?Math.max(0,old.stats.hp-(setup.hp?.[cat.id]??old.stats.hp)):0;return[cat.id,Math.max(0,cat.stats.hp-missing)];}));
  const next={...setup,cats,hp,plan:{...applied.state.v4.plan}};
  for(const[first,last,label]of [[1,10,'forecast verification'],[51,100,'separate TRAIN observation']]){
   const pairs=[];
   for(let seed=first;seed<=last;seed++){
    const a=R.playBattle(R.createBattle({...setup,seed}),'auto'),b=R.playBattle(R.createBattle({...next,seed}),'auto');
    pairs.push({seed,before:a.result,after:b.result,beforeRounds:a.round,afterRounds:b.round});
   }
   const beforeWins=pairs.filter(p=>p.before==='party').length,afterWins=pairs.filter(p=>p.after==='party').length;
   if(first===1){assert.equal(beforeWins,advice.before.wins);assert.equal(afterWins,advice.after.wins);}
   rows.push({label,first,last,pairs,beforeWins,afterWins,improved:pairs.filter(p=>p.before==='enemy'&&p.after==='party').length,worsened:pairs.filter(p=>p.before==='party'&&p.after==='enemy').length});
  }
 }
 const result={registration,advice,rows,method:'Original earned build; no rerolled route or acceptance seeds. Held-constant boss comparison only.',currenciesBefore:settled.state.account.currencies,currenciesAfter:applied?.state.account.currencies};
 await writeFile(out+'/results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,rows:rows.map(({pairs,...r})=>r)}));
}finally{await loader.vite.close();}
