// Registered V5 vocabulary/shape/cadence metrics; resolved action logs, no UI timing inference.
import {loadRules} from './load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.V5_METRICS_OUT;assert(out);
const registration=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json','utf8'));
const {offset,count,skillsV5}=registration;assert([0,20000,30000,40000].includes(offset));assert(count>=20&&count<=500);
const sha=x=>createHash('sha256').update(x).digest('hex');
for(const [p,h]of Object.entries(registration.source))assert.equal(sha(await readFile(`${process.env.BIG_RULES_ROOT||process.cwd()}/${p}`)),h,p);
const methodHash=sha(JSON.stringify(registration)),cp=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));if(cp.methodHash)assert.equal(cp.methodHash,methodHash);
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),C=suite.rules;
const crews=[{id:'probe-starters',cats:['mochi','soot','clover']},{id:'probe-oven',cats:['panko','mallow','cinnamon']},{id:'probe-thread',cats:['biscuit','inkcap','sorrel']},...R.CREWS_V5];
const encounters=[['button-guard','sock-skipper'],['teacup-healer','kettle-knight'],['yarn-giant']];
const rows=cp.rows??[],keys=new Set(rows.map(r=>r.key)),started=Date.now(),pause=new Error('checkpoint');
const save=()=>writeFile(out+'/partial.json',JSON.stringify({methodHash,rows}));
try{
 for(const crew of crews)for(let encounter=0;encounter<encounters.length;encounter++)for(let n=1;n<=count;n++){
  const seed=offset+n,key=`${crew.id}/${encounter}/${seed}`;if(keys.has(key))continue;
  const b=R.createBattle({seed,chapter:1,gameplayV4:true,...(skillsV5?{skillsV5:true}:{}),cats:crew.cats.map(id=>({id,stats:{...C.CARD_BY_ID[id].baseStats},skills:R.CAT_BY_ID[id].skills.map(s=>s.id),row:R.CAT_BY_ID[id].row})),enemies:encounters[encounter]});
  const row={key,crew:crew.id,encounter,seed,result:null,rounds:0,actions:0,damageActions:0,multiDamageActions:0,supportActions:0,multiSupportActions:0,cleanseSupport:0,reactions:{},keywords:{},enemyKeywords:{},ultimates:Object.fromEntries(crew.cats.map(id=>[id,0])),skills:{}};
  let steps=0;
  while(!b.result&&steps++<900){
   const a=R.currentActor(b),start=b.log.length,eventStart=b.v4.events.length;
   if(a.side==='enemy')assert(R.enemyAct(b));else assert(R.act(b,R.chooseAction(b,'auto')));
   const all=b.log.slice(start),stop=all.findIndex(e=>['action','enemy-action'].includes(e.kind));assert(stop>=0);const effects=all.slice(0,stop),marker=all[stop];
   if(a.side==='party'){
    row.actions++;row.skills[marker.skillId]=(row.skills[marker.skillId]??0)+1;if(marker.skillId?.endsWith('-4')&&!marker.text.includes('prevented the action'))row.ultimates[a.catalogId]++;
    const foes=new Set(effects.filter(e=>e.actorId===a.id&&['damage','detonate'].includes(e.kind)&&b.actors.some(t=>t.id===e.targetId&&t.side==='enemy')).map(e=>e.targetId));
    const allies=new Set(effects.filter(e=>e.actorId===a.id&&['heal','shield'].includes(e.kind)&&b.actors.some(t=>t.id===e.targetId&&t.side==='party')).map(e=>e.targetId));
    if(foes.size){row.damageActions++;if(foes.size>1)row.multiDamageActions++;}if(allies.size){row.supportActions++;if(allies.size>1)row.multiSupportActions++;if(effects.some(e=>e.kind==='dispel'&&b.actors.some(t=>t.id===e.targetId&&t.side==='party')))row.cleanseSupport++;}
   }
   for(const e of b.v4.events.slice(eventStart)){
    if(e.kind==='reaction')row.reactions[e.reactionId]=(row.reactions[e.reactionId]??0)+1;
    if(e.kind==='status-applied'){row.keywords[e.statusId]=(row.keywords[e.statusId]??0)+1;if(b.actors.some(t=>t.id===e.sourceId&&t.side==='enemy'))row.enemyKeywords[e.statusId]=(row.enemyKeywords[e.statusId]??0)+1;}
   }
   if(!skillsV5)for(const e of effects.filter(e=>e.kind==='status')){const id=R.STATUSES.find(s=>s.name===e.text)?.id??e.text;row.keywords[id]=(row.keywords[id]??0)+1;}
  }
  assert(b.result);if(n===1)assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
  row.result=b.result;row.rounds=b.round;row.battleSha256=sha(JSON.stringify(b));rows.push(row);
  if(Date.now()-started>110000){await save();process.exitCode=75;throw pause;}
 }
 await save();
 const summary=group=>{const sum=field=>group.reduce((n,r)=>n+r[field],0),normal=group.filter(r=>r.encounter<2);return {battles:group.length,multiFoeShare:100*sum('multiDamageActions')/sum('damageActions'),multiAllyShare:100*sum('multiSupportActions')/sum('supportActions'),cleanseSupportShare:100*sum('cleanseSupport')/sum('supportActions'),rounds:sum('rounds')/group.length,normalRounds:normal.reduce((n,r)=>n+r.rounds,0)/normal.length,reactionsPerBattle:group.reduce((n,r)=>n+Object.values(r.reactions).reduce((a,b)=>a+b,0),0)/group.length,allCatsUltimateShare:100*normal.filter(r=>Object.values(r.ultimates).every(n=>n>=1)).length/normal.length,keywordBattles:Object.fromEntries(R.CORE_STATUS_RULES_V5.map(s=>[s.id,group.filter(r=>r.keywords[s.id]>0).length/group.length])),reactionBattleShare:Object.fromEntries(['crumb-burst','wildfire','rupture','spread'].map(id=>[id,group.filter(r=>r.reactions[id]>0).length/group.length]))};};
 const result={registration,methodHash,definitions:'Same original probe direct damage/detonate and heal/shield (including zero amount) action targets. Announced reactions counted only from events. Keyword frequency is battles with an application. Ultimates counted from executed action marker, so Daze replacements are not ultimates. No real-time or human claim.',summary:summary(rows.filter(r=>r.crew.startsWith('probe-'))),probe180:summary(rows.filter(r=>r.crew.startsWith('probe-')&&r.seed<=offset+20)),byCrew:Object.fromEntries(crews.map(c=>[c.id,summary(rows.filter(r=>r.crew===c.id))])),rows};
 await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({complete:true,battles:rows.length,summary:result.summary}));
} catch(e){if(e!==pause)throw e;} finally{await suite.vite.close();}
