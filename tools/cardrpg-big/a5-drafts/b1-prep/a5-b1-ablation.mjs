// REFERENCE: A5 B1; train1–500 only, 31 fixed residual twins, components isolated at the public BattleSetup boundary.
import {loadRules} from './a5-load.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out=process.env.A5_ABLATION_OUT||'reports/cardrpg-big/a5/b1/ablation';
const count=Number(process.env.A5_ABLATION_COUNT||500);assert(Number.isInteger(count)&&count>=1&&count<=500);
const started=Date.now(),windowMs=110000,pause=new Error('checkpoint');
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
await mkdir(out,{recursive:true});
const residual=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/residual-map.json','utf8'));
const keys=residual.samples.find(s=>s.sample==='heldout').misses.map(m=>m.key).sort();assert.equal(keys.length,31);
const old=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/train/results.json','utf8'));
const oldRows=new Map(old.rows.map(r=>[r.key,r]));
const files=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{encoding:'utf8'}).trim().split('\n');
const source=Object.fromEntries(await Promise.all([...new Set(files)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,hash(await readFile(p,'utf8'))])));
assert.deepEqual(source,old.source,'B1 root-cause sample must use unchanged A4 production rules');
const checkpoint=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
if(checkpoint.source){assert.deepEqual(checkpoint.source,source);assert.equal(checkpoint.count,count);assert.deepEqual(checkpoint.keys,keys);}
const rows=checkpoint.rows??[],replays=checkpoint.replays??[],variants=['none','main','affixes','unique','set4','all'];
const suite=await loadRules(),R=suite.depth,C=suite.legacy;
const trio=['mochi','soot','clover'],themes={guardian:'hearthloom',witch:'moonwick',alchemist:'mossbrew'};
function account(seed) {
 const s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.cards=trio.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));
 s.team=[...trio];s.gear=[];s.equipment={};s.cleared=[1,2,3];
 for(const id of trio){s.rows[id]=R.CAT_BY_ID[id].row;s.skills[id]=R.defaultSkills(s,id);
  for(const slot of C.EQUIPMENT_SLOTS){const item=R.makeGear(s,`${themes[C.CARD_BY_ID[id].role]}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(item);(s.equipment[id]??={})[slot]=item.id;}}
 return s;
}
function setups(meta,seed) {
 const template=R.GEAR_BY_ID[meta.templateId],id=meta.cardId,s=account(seed);s.equipment[id]={};
 for(const slot of C.EQUIPMENT_SLOTS)if(slot!==template.slot){const g=R.makeGear(s,`${template.setId}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(g);s.equipment[id][slot]=g.id;}
 const base=R.battleCats(s),power=R.teamPowerV4(s),full=structuredClone(s),g=R.makeGear(full,template.id,seed);
 full.gear.push(g);full.equipment[id][template.slot]=g.id;
 const all=R.battleCats(full),mainState=structuredClone(full),mainItem=mainState.gear.find(item=>item.id===g.id);mainItem.affixes=[];mainItem.rolls={};
 const mainStats=R.battleCats(mainState).find(c=>c.id===id).stats,before=base.find(c=>c.id===id),after=all.find(c=>c.id===id);
 const four=R.SETS.find(set=>set.id===template.setId).fourEffect;
 const isolated={none:base,all};
 for(const mode of ['main','affixes','unique','set4']){
  const cats=structuredClone(base),cat=cats.find(c=>c.id===id);cat.equipment=[...after.equipment];
  if(mode==='main')cat.stats=structuredClone(mainStats);
  if(mode==='affixes'){
   for(const key of Object.keys(cat.stats))cat.stats[key]+=after.stats[key]-mainStats[key];
   cat.bonuses=structuredClone(after.bonuses);
  }
  if(mode==='unique'&&template.unique)cat.effects=[...new Set([...cat.effects,'unique:'+template.unique])];
  if(mode==='set4')cat.effects=[...new Set([...cat.effects,four])];
  isolated[mode]=cats;
 }
 // Reconstruction checks detect accidental interference between the isolated components.
 const reconstructed=structuredClone(before);for(const key of Object.keys(reconstructed.stats))reconstructed.stats[key]=isolated.main.find(c=>c.id===id).stats[key]+isolated.affixes.find(c=>c.id===id).stats[key]-before.stats[key];
 assert.deepEqual(reconstructed.stats,after.stats);
 const effects=[...new Set([...before.effects,...isolated.unique.find(c=>c.id===id).effects,...isolated.set4.find(c=>c.id===id).effects])].sort();assert.deepEqual(effects,[...after.effects].sort());
 const value=R.teamPowerV4(full);
 return {share:(value-power)/value,setups:Object.fromEntries(variants.map(mode=>[mode,{seed,chapter:meta.chapter,challengeLevel:6,cats:isolated[mode],enemies:[R.CHAPTERS[meta.chapter-1].boss],gameplayV4:true}]))};
}
function summaryBattle(b) {return {result:b.result,rounds:b.round,choices:b.choices.length,firstDeath:b.firstDeath,
 hp:b.actors.map(a=>({id:a.id,row:a.row,hp:a.hp,maxHp:a.maxHp,shield:a.shield})),
 counts:Object.fromEntries([...new Set(b.log.map(e=>e.kind))].map(kind=>[kind,b.log.filter(e=>e.kind===kind).length]))};}
const exampleKeys=new Set(['hearthloom-charm-legendary','hearthloom-charm-common','bellsteel-charm-legendary','bellsteel-charm-rare','crumbweave-weapon-legendary','emberfelt-weapon-legendary']);
const save=()=>writeFile(out+'/partial.json',JSON.stringify({source,count,keys,variants,rows,replays}));
try {
 for(const key of keys){const meta=JSON.parse(key);let row=rows.find(r=>r.key===key);
  if(!row){row={key,...meta,outcomes:Object.fromEntries(variants.map(v=>[v,''])),shareSum:0};rows.push(row);}
  for(let seed=row.outcomes.none.length+1;seed<=count;seed++){
   const fixture=setups(meta,seed),battles={};
   for(const mode of variants){const b=R.playBattle(R.createBattle(fixture.setups[mode]),'auto');battles[mode]=b;row.outcomes[mode]+=b.result==='party'?'1':'0';}
   const code=(battles.none.result==='party'?2:0)+(battles.all.result==='party'?1:0);
   assert.equal(String(code),oldRows.get(key).outcomes[seed-1],`A4 train fixture drift ${key} seed${seed}`);
   row.shareSum+=fixture.share;
   if(exampleKeys.has(meta.templateId)&&battles.none.result==='enemy'&&battles.all.result==='party'&&!replays.some(r=>r.key===key)){
    const name=meta.templateId+'-ch'+meta.chapter+'-seed'+seed,path=out+'/'+name+'.json';
    const choices=b=>b.v4.events.filter(e=>e.kind==='plan-target').map((e,i)=>({actorId:e.actorId,round:e.round,...b.choices[i]}));
    const before=choices(battles.none),after=choices(battles.all),first=before.findIndex((a,i)=>JSON.stringify(a)!==JSON.stringify(after[i]));
    await writeFile(path,JSON.stringify({key,seed,componentSummaries:Object.fromEntries(variants.map(v=>[v,summaryBattle(battles[v])])),firstDivergentPartyChoice:first<0?null:{index:first,before:before[first],after:after[first]},before:battles.none,after:battles.all},null,2));
    replays.push({key,seed,path,tracePending:true});
   }
   if(Date.now()-started>=windowMs){await save();process.exitCode=75;throw pause;}
  }
  if(!row.complete){row.complete=true;await save();console.log(JSON.stringify({template:meta.templateId,chapter:meta.chapter,completed:rows.filter(r=>r.complete).length,count}));}
 }
 const wilson=(wins,n)=>{const p=wins/n,z=1.96,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [c-h,c+h];};
 const summaries=rows.map(row=>{const before=[...row.outcomes.none].filter(v=>v==='1').length;return {...JSON.parse(row.key),beforeWins:before,meanShare:row.shareSum/count,
  components:Object.fromEntries(variants.map(v=>{const wins=[...row.outcomes[v]].filter(x=>x==='1').length;return [v,{wins,n:count,rate:wins/count,gainPp:100*(wins-before)/count,wilson95:wilson(wins,count),digest:hash(row.outcomes[v])}];}))};});
 await writeFile(out+'/results.json',JSON.stringify({method:'31 fixed residual twins from A4; only train1–500. Components isolated at BattleSetup boundary; original before/all outcomes verified seed-by-seed against A4 train. No source rule edits, no new acceptance samples. Affix-only uses its marginal production stat deltas and production bonuses; additive reconstruction asserted.',source,count,keys,variants,summaries,rows,replays},null,2));
} catch(error){if(error!==pause)throw error;} finally {await suite.close();}
