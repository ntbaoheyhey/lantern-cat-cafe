// REFERENCE: GAMEPLAY-V4 section9. Registered actual-rule fixtures, paired seeds and heldout separation.
import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sample=process.env.BIG_BALANCE_SAMPLE||'pilot',count=Number(process.env.BIG_BALANCE_COUNT||(sample==='pilot'?50:500));
assert(['pilot','train','heldout'].includes(sample));assert(count>= (sample==='pilot'?10:500));
assert.equal(sample,'pilot');assert.equal(count,50);
const offset=sample==='heldout'?10000:0,out=process.env.BIG_BALANCE_OUT||`reports/cardrpg-big/a4/p6/${sample}`;
const scope=process.env.BIG_BALANCE_SCOPE||'all';assert(['all','tiers','sets','teams','pieces','equipped'].includes(scope));
await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sourceRoot=process.env.BIG_RULES_ROOT||process.cwd();
const files=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{encoding:'utf8'}).trim().split('\n');
const source=Object.fromEntries(await Promise.all([...new Set(files)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(`${sourceRoot}/${p}`)).digest('hex')])));
const reg=JSON.parse(await readFile('reports/cardrpg-big/a5/b2/hush-signature-20/REGISTERED-METHOD.json','utf8'));
assert.deepEqual(source,reg.combatSource);
const cp=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}'));
if(cp.source){assert.deepEqual(cp.source,source,'Source changed during registered balance sample');assert.equal(cp.count,count);assert.equal(cp.scope,scope);assert.equal(cp.sample,sample);}
const {load,vite,rules:C}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),{playRun}=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts'),rng=await load('packages/game-rules/src/rng.ts');
const rows=cp.rows??[],byKey=new Map(rows.map(r=>[r.key,r])),start=Date.now(),pause=new Error('checkpoint');
const tiers=['none',...C.RARITY_ORDER],starter=['mochi','soot','clover'],maxTeam=['brioche','velvet','marigold'];
const themes={guardian:'hearthloom',witch:'moonwick',alchemist:'mossbrew'};
const teams=[];for(let a=0;a<C.CARDS.length-2;a++)for(let b=a+1;b<C.CARDS.length-1;b++)for(let c=b+1;c<C.CARDS.length;c++)teams.push([C.CARDS[a].id,C.CARDS[b].id,C.CARDS[c].id]);
// Situations are registered before heldout. All sets face every identical lineup, without case-specific tuning.
const situations=[['yarn-giant'],['rain-spool'],['pantry-crown'],['needle-moth','pollen-scout'],['spool-ram','button-guard'],['teacup-healer','kettle-knight'],['crumb-sentinel','binding-thread'],['sock-skipper','needle-moth']];
const fixture=(seed,level,rarity='none',team=level===50?maxTeam:starter,setId)=>{
 const s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.cards=team.map(id=>({id,cardId:id,level,stars:1,shards:0,soulbound:true}));s.team=[...team];s.gear=[];s.equipment={};s.cleared=[1,2,3];
 for(const id of team){s.rows[id]=R.CAT_BY_ID[id].row;s.skills[id]=R.defaultSkills(s,id);if(rarity!=='none')for(const slot of C.EQUIPMENT_SLOTS){const g=R.makeGear(s,`${setId??themes[C.CARD_BY_ID[id].role]}-${slot}-${rarity}`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(g);(s.equipment[id]??={})[slot]=g.id;}}
 if(!team.some(id=>s.rows[id]==='front'))s.rows[team[0]]='front';return s;
};
const targetPower=seed=>R.teamPowerV4(fixture(seed,6,'epic'));
function matchedCats(s,seed){
 const cats=R.battleCats(s),utility=s.team.reduce((n,id)=>n+R.powerV4(s,id).utility,0),raw=cats.reduce((n,c)=>n+R.rawPowerV4(c.stats),0),target=targetPower(seed),scale=(target-utility)/raw;
 assert(scale>0);for(const c of cats)for(const key of ['hp','attack','defense'])c.stats[key]=Math.max(1,Math.round(c.stats[key]*scale));
 const actual=utility+cats.reduce((n,c)=>n+R.rawPowerV4(c.stats),0);assert(Math.abs(actual/target-1)<=.02,'Matched-power tolerance');return {cats,ratio:actual/target};
}
const battle=(s,seed,chapter,enemies,matched=false)=>{
 const actors=matched?matchedCats(s,seed):{cats:R.battleCats(s),ratio:1};
 const b=R.playBattle(R.createBattle({seed,chapter,cats:actors.cats,enemies,gameplayV4:true,challengeLevel:s.account.cards[0].level}),'auto');
 return {won:b.result==='party',actions:b.log.filter(e=>['action','enemy-action'].includes(e.kind)).length,ratio:actors.ratio,b};
};
let lastSaved=0;
const save=()=>writeFile(`${out}/partial.json`,JSON.stringify({source,sample,count,scope,rows}));
async function cell(meta,run){
 const key=JSON.stringify(meta);let row=byKey.get(key);if(!row){row={key,...meta,outcomes:'',actions:0,minPowerRatio:1,maxPowerRatio:1,maxShare:0,maxEnhancedShare:0,shareSum:0};rows.push(row);byKey.set(key,row);}
 for(let n=row.outcomes.length+1;n<=count;n++){
  const result=run(offset+n);row.outcomes+=String(result.code);row.actions+=result.actions??0;row.minPowerRatio=Math.min(row.minPowerRatio,result.ratio??1);row.maxPowerRatio=Math.max(row.maxPowerRatio,result.ratio??1);row.maxShare=Math.max(row.maxShare,result.share??0);row.maxEnhancedShare=Math.max(row.maxEnhancedShare,result.share12??0);row.shareSum+=result.share??0;
  if(n===1&&result.b)assert.deepEqual(R.replayBattle(result.b.initial,result.b.choices),result.b);
  if(Date.now()-start>110000){await save();process.exitCode=75;throw pause;}
 }
 if(!row.complete){row.complete=true;row.digest=hash(row.outcomes);if(rows.filter(r=>r.complete).length%100===0)console.log(JSON.stringify({completed:rows.filter(r=>r.complete).length,kind:row.kind}));if(Date.now()-lastSaved>10000){await save();lastSaved=Date.now();}}
}
const include=s=>scope==='all'||scope===s;
try{
 if(include('tiers')){
  for(const level of [1,6])for(const chapter of [1,2,3])for(const rarity of tiers)await cell({kind:'tiers',level,chapter,rarity},seed=>{
   const s=fixture(seed,level,rarity),started=R.startRun(s,chapter,seed);assert(started.ok,started.error);let actions=0;const end=playRun(started.state,'auto',b=>actions+=b.choices.length);return {code:end.run.won?1:0,actions};
  });
  for(const level of [1,2,3,4,5,6,7,8,9,10,50])for(const chapter of [1,2,3])for(const rarity of tiers)await cell({kind:'bands',level,chapter,rarity},seed=>{
   const r=battle(fixture(seed,level,rarity),seed,chapter,[R.CHAPTERS[chapter-1].boss]);return {...r,code:r.won?1:0};
  });
  // Fixed band1 remains a distinct farming comparison; it is not used to hide intended-band saturation.
  for(const level of [6,10,50])for(const rarity of tiers)await cell({kind:'fixed',level,chapter:1,rarity},seed=>{
   const s=fixture(seed,level,rarity),started=R.startRun(s,1,seed,'campaign','2026-11-06',1);assert(started.ok);const end=playRun(started.state,'auto');return {code:end.run.won?1:0};
  });
 }
 if(include('sets'))for(const set of R.SETS)for(let scene=0;scene<situations.length;scene++)await cell({kind:'sets',setId:set.id,scene,level:6},seed=>{
  const r=battle(fixture(seed,6,'epic',starter,set.id),seed,Math.min(3,scene+1),situations[scene],true);return {...r,code:r.won?1:0};
 });
 if(include('teams'))for(const team of teams)for(const chapter of [1,2,3])await cell({kind:'teams',team,chapter,level:6},seed=>{
  const r=battle(fixture(seed,6,'epic',team),seed,chapter,[R.CHAPTERS[chapter-1].boss],true);return {...r,code:r.won?1:0};
 });
 if(include('pieces')){
  const bare=new Map();
  for(const template of R.GEAR)for(const cardId of starter)for(const level of [1,6])for(const chapter of [1,2,3])await cell({kind:'pieces',templateId:template.id,cardId,level,chapter},seed=>{
   const key=`${seed}/${level}/${chapter}`;let before=bare.get(key);if(before===undefined){before=battle(fixture(seed,level),seed,chapter,[R.CHAPTERS[chapter-1].boss]).won;bare.set(key,before);}
   const s=fixture(seed,level),g=R.makeGear(s,template.id,seed);s.gear.push(g);s.equipment[cardId]={[template.slot]:g.id};
   const r=battle(s,seed,chapter,[R.CHAPTERS[chapter-1].boss]),without=fixture(seed,level),share=(R.teamPowerV4(s)-R.teamPowerV4(without))/R.teamPowerV4(s);
   g.enhancement=12;const share12=(R.teamPowerV4(s)-R.teamPowerV4(without))/R.teamPowerV4(s);return {...r,code:(before?2:0)+(r.won?1:0),share,share12};
  });
 }
 // Supplement the empty-build sweep: a final slot on an existing coherent kit.
 // Registered before heldout so a zero-win bare baseline cannot hide a set threshold.
 if(include('pieces')||scope==='equipped') {
  const carriers={hearthloom:'mochi',moonwick:'soot',mossbrew:'clover',rainlace:'clover',crumbweave:'soot',bellsteel:'mochi',emberfelt:'soot',velvetrim:'soot'};
  const baseline=new Map();
  for(const template of R.GEAR)for(const chapter of [1,2,3]) {
   const cardId=carriers[template.setId];
   await cell({kind:'pieces-equipped',templateId:template.id,cardId,level:6,chapter},seed=>{
    const s=fixture(seed,6,'epic');
    s.equipment[cardId]={};
    for(const slot of C.EQUIPMENT_SLOTS)if(slot!==template.slot){
      const item=R.makeGear(s,`${template.setId}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);
      s.gear.push(item);s.equipment[cardId][slot]=item.id;
    }
    const power=R.teamPowerV4(s),key=`${template.setId}/${template.slot}/${cardId}/${chapter}/${seed}`;
    let before=baseline.get(key);if(before===undefined){before=battle(s,seed,chapter,[R.CHAPTERS[chapter-1].boss]).won;baseline.set(key,before);}
    const g=R.makeGear(s,template.id,seed);s.gear.push(g);s.equipment[cardId][template.slot]=g.id;
    const r=battle(s,seed,chapter,[R.CHAPTERS[chapter-1].boss]),share=(R.teamPowerV4(s)-power)/R.teamPowerV4(s);
    g.enhancement=12;const share12=(R.teamPowerV4(s)-power)/R.teamPowerV4(s);
    return {...r,code:(before?2:0)+(r.won?1:0),share,share12};
   });
  }
 }
 if(include('teams')){
  let chosen;
  if(sample==='heldout'){
   const trained=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/train/results.json','utf8'));
   assert.deepEqual(trained.source,source,'Heldout needs the exact frozen training source');chosen=trained.chosenCrew;
   assert(chosen&&chosen.length===3,'Freeze the coherent crew on train first');
  }else{
   const candidates=teams.filter(t=>new Set(t.map(id=>C.CARD_BY_ID[id].role)).size===3&&R.crewThresholds(t).some(c=>c.threshold===4));
   chosen=candidates.map(team=>({team,wins:rows.filter(r=>r.kind==='teams'&&r.team.join()===team.join()).reduce((n,r)=>n+[...r.outcomes].filter(v=>v==='1').length,0)})).sort((a,b)=>b.wins-a.wins||a.team.join().localeCompare(b.team.join()))[0].team;
  }
  for(const chapter of [1,2,3])await cell({kind:'crew',chapter,team:chosen},seed=>{
   const random=teams[new rng.Rng(rng.deriveSeed(seed,9901)).int(0,teams.length-1)];
   const before=battle(fixture(seed,6,'epic',random),seed,chapter,[R.CHAPTERS[chapter-1].boss],true);
   const after=battle(fixture(seed,6,'epic',chosen),seed,chapter,[R.CHAPTERS[chapter-1].boss],true);
   return {...after,code:(before.won?2:0)+(after.won?1:0)};
  });
 }
 const wilson=(wins,n)=>{const p=wins/n,z=1.96,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [c-h,c+h];};
 const summaries=rows.map(r=>{const outcomes=[...r.outcomes].map(Number),wins=outcomes.filter(v=>v%2===1).length,before=['pieces','pieces-equipped','crew'].includes(r.kind)?outcomes.filter(v=>v>=2).length:null;assert.equal(outcomes.length,count);return {...r,meanShare:r.shareSum/outcomes.length,outcomes:undefined,wins,n:outcomes.length,rate:wins/outcomes.length,wilson95:wilson(wins,outcomes.length),beforeWins:before,gainPp:before===null?null:100*(wins-before)/outcomes.length};});
 await writeFile(`${out}/results.json`,JSON.stringify({source,sample,count,offset,scope,chosenCrew:rows.find(r=>r.kind==='crew')?.team,method:'Actual public rules/auto controller. Train seeds1-500; heldout10001-10500; pilot<=50 train-only. All gear128 templates x3carriers x2levels x3bosses on bare parties; plus128 templates x3bosses as the fourth slot of coherent epic kits, with carriers fixed by set; +12 display shares measured separately. All220triples x3bosses, all220triples x3bosses, 8sets x8fixed situations. Full route tiers separately from boss band ladder. Matched-power fixtures scale only party HP/attack/defense to fixed reference utility-aware power within2%; utility effects, enemy stats and automatic decisions remain production. These controlled fixtures do not claim earned progression. Max-level50 uses the three eligible legendary companions.',situations,tiers,summaries,rows},null,2));
}catch(e){if(e!==pause)throw e;}finally{await vite.close();}
