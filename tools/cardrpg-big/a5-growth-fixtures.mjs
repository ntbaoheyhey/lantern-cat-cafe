// REFERENCE: PROMPT-A5 C1; c1-growth-preview/REGISTERED-METHOD.md. UI fixtures, not earned-session evidence.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './a4-load.mjs';
const root='reports/cardrpg-big/a5/c1-growth-preview/fixtures';await mkdir(root,{recursive:true});
const {load,vite,rules}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const checks=[],sha=s=>createHash('sha256').update(s).digest('hex');
const take=r=>{assert.equal(r.ok,true,r.error);return r.state;};
try{
 for(const mode of ['on','off']){
  const fresh=()=>R.setGameplayV4(R.createDepthAccount(11),mode==='on');
  let level=fresh();const id=level.account.cards.find(c=>c.cardId==='mochi').id;
  for(let n=1;n<5;n++)level=take(R.metaCommand(level,{type:'level',cardId:id}));
  const star=fresh();Object.assign(star.account.cards.find(c=>c.id===id),{stars:2,shards:20});
  const poor=fresh();poor.account.currencies.fish=0;
  const max=fresh();Object.assign(max.account.cards.find(c=>c.id===id),{level:rules.CARD_BY_ID.mochi.levelCap,stars:5});
  const active=take(R.startRun(fresh(),1,11,'campaign','2026-11-08',1));
  for(const [name,state,command,method]of [
   ['level5',level,{type:'level',cardId:id},'Fresh default balance, four public level commands; no earned-session or clock claim.'],
   ['star2',star,{type:'ascend',cardId:id},'Synthetic UI edge: Mochi2stars/20shards only; no earned-progression claim.'],
   ['poor',poor,null,'Synthetic insufficient-fish edge.'],['max',max,null,'Synthetic level/star-cap edge.'],
   ['active',active,null,'Public startRun from fresh account; no combat played.'],
  ]){
   const code=R.exportSave(state)+'\n',path=`${root}/${mode}-${name}.save`;await writeFile(path,code);
   assert.equal(R.exportSave(R.importSave(code.trim()))+'\n',code);
   const before=structuredClone(state),result=command?R.metaCommand(state,command):null;assert.deepEqual(state,before);
   if(result)assert(result.ok);
   const card=state.account.cards.find(c=>c.id===id),next=result?.state.account.cards.find(c=>c.id===id);
   const prior=R.depthStats(state,'mochi'),after=result?R.depthStats(result.state,'mochi'):null;
   checks.push({mode,name,path,method,sha256:sha(code),command,before:{card,currencies:state.account.currencies,stats:prior},after:result?{card:next,currencies:result.state.account.currencies,stats:after,skills:R.availableSkills(result.state,'mochi').map(s=>s.id)}:null,
    skillNames:result?R.availableSkills(result.state,'mochi').filter(s=>!R.availableSkills(state,'mochi').some(old=>old.id===s.id)).map(s=>s.name):[]});
  }
 }
 await writeFile(root+'/checks.json',JSON.stringify({passed:true,checks},null,2)+'\n');
 console.log(JSON.stringify({passed:true,fixtures:checks.length}));
}finally{await vite.close();}
