// REFERENCE: PROMPT-A5 B1. New TRAIN-only diagnostic for a cliff absent from original31cell residual set.
import {loadRules} from './a5-candidate-load.mjs';
import {fixtures} from './a5-candidate-fixtures.mjs';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const caseId=process.argv[2];assert(['crumb','bell'].includes(caseId));
const out='reports/cardrpg-big/a5/b1/pressure-500/traces/'+caseId;await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/pressure-500/manifest.json','utf8'));
const variant='weight2-sig100';
const transforms=Object.fromEntries(Object.keys(manifest.variants[variant]).map(p=>[p,'tools/cardrpg-big/a5-drafts/b1-prep/pressure-500/'+variant+'/'+p]));
for(const [p,file]of Object.entries(transforms))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),manifest.variants[variant][p],p);
const meta=caseId==='bell'?{kind:'pieces-equipped',templateId:'bellsteel-outfit-legendary',cardId:'mochi',level:6,chapter:2}:{kind:'pieces-equipped',templateId:'crumbweave-weapon-legendary',cardId:'soot',level:6,chapter:1};
await access('reports/cardrpg-big/a5/b1/pressure-500/traces/REGISTERED-METHOD.json');
const clean=await loadRules({transforms}),observed=await loadRules({transforms,probe:true});
const R=clean.depth,O=observed.depth,F=fixtures(R,clean.legacy),modes=['none','main','affixes','unique','set4','all'];
const row=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/pressure-500/results.json','utf8')).rows.find(r=>r.variant===variant&&r.key===JSON.stringify(meta));assert(row);
const outcomes=Object.fromEntries(modes.map(m=>[m,'']));let example;
let live,raw;
globalThis.__a5HpProbe=(b,source,target,amount,kind)=>{if(b===live)raw.push({index:b.log.length,round:b.round,source:source.id,target:target.id,kind,hp:target.hp,shield:target.shield,requested:Math.max(0,Math.round(amount)),margin:target.hp-Math.max(0,Math.round(amount))});};
function trace(expected){
 const b=O.createBattle(expected.initial),steps=[];live=b;raw=[];
 while(!b.result){const a=O.currentActor(b),choice=a.side==='party'?O.chooseAction(b,'auto'):null;steps.push({round:b.round,actor:a.id,choice,logIndex:b.log.length,actors:b.actors.map(x=>({id:x.id,hp:x.hp,shield:x.shield,statuses:x.statuses.map(s=>({...s}))}))});assert(choice?O.act(b,choice):O.enemyAct(b));assert(steps.length<900);}
 assert.deepEqual(JSON.parse(JSON.stringify(b)),JSON.parse(JSON.stringify(expected)));return {steps,raw,battle:b};
}
try{
 for(let seed=1;seed<=500;seed++){
  const ss=F.setups(meta,seed).setups,played={};
  for(const mode of modes){played[mode]=R.playBattle(R.createBattle(ss[mode]),'auto');outcomes[mode]+=played[mode].result==='party'?'1':'0';}
  assert.equal((played.none.result==='party'?2:0)+(played.all.result==='party'?1:0),Number(row.outcomes[seed-1]));
  if(!example&&played.none.result!=='party'&&played.all.result==='party')example={seed,before:structuredClone(played.none),after:structuredClone(played.all)};
 }
 assert(example);const before=trace(example.before),after=trace(example.after);
 const a=before.steps.filter(s=>s.choice),b=after.steps.filter(s=>s.choice);const idx=a.findIndex((s,i)=>JSON.stringify(s.choice)!==JSON.stringify(b[i]?.choice)||s.round!==b[i]?.round);
 const death=before.raw.find(r=>r.margin<=0&&example.before.initial.cats.some(c=>c.id===r.target));
 await writeFile(out+'/replay.json',JSON.stringify({seed:example.seed,before,after},null,2));
 const wins=Object.fromEntries(modes.map(m=>[m,[...outcomes[m]].filter(v=>v==='1').length]));
 const summary={meta,outcomes,wins,gainPp:Object.fromEntries(modes.map(m=>[m,(wins[m]-wins.none)/5])),seed:example.seed,divergence:{before:a[idx],after:b[idx]},firstPartyDeath:death,parity:'All500 paired results exact; full observed replay JSON equals uninstrumented result'};
 await writeFile(out+'/summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({wins,gainPp:summary.gainPp,seed:example.seed,firstPartyDeath:death,divergence:idx}));
}finally{delete globalThis.__a5HpProbe;await clean.close();await observed.close();}
