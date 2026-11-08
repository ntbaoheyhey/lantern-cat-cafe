// REFERENCE: A5 B3. Public-command UI fixture; no levels, currencies or marks injected.
import {loadRules} from './a5-drafts/b1-prep/a5-candidate-load.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/b3/earned-selector';await mkdir(out,{recursive:true});
const suite=await loadRules(),R=suite.depth,C=suite.legacy;
const accept=r=>{assert(r.ok,r.error);return r.state;},timeline=[];
try{
 let s=accept(suite.onboarding.firstInvitation(R.setGameplayV4(R.createDepthAccount(3001),true),4));
 for(let day=1;day<=35;day++){
  const time=(day-1)*86400000+15*60000;s=accept(R.syncCalendarDay(s,time));
  const service=R.claimCafeShiftV4(s,time);if(service.ok)s=service.state;
  s=suite.bot.playRun(accept(R.startRun(s,Math.min(3,s.cleared.length+1),100000+day*71,'campaign')),'auto');
  for(const q of C.QUESTS){const r=R.metaCommand(s,{type:'claimQuest',questId:q.id});if(r.ok)s=r.state;}
  for(const m of R.MILESTONES_V4){const r=R.claimMilestoneV4(s,m.id);if(r.ok)s=r.state;}
  while(s.account.currencies.stamps>=150&&R.selectorMarksV4(s)<R.SELECTOR_COST_V4){
   const pulls=Object.values(s.account.pity).reduce((n,p)=>n+p.totalPulls,0);
   s=accept(R.metaCommand(s,{type:'pull',bannerId:'standard',seed:day*97+pulls}));
  }
  timeline.push({day,marks:R.selectorMarksV4(s),stamps:s.account.currencies.stamps,cleared:s.cleared});
  if(R.selectorMarksV4(s)>=R.SELECTOR_COST_V4){
   const cat=C.CARDS.find(c=>!s.account.cards.some(o=>o.cardId===c.id))??C.CARDS[0];
   assert.equal(R.selectorEligibilityV4(s,'cat',cat.id),null);
   await writeFile(out+'/ready.save',R.exportSave(s));
   await writeFile(out+'/checks.json',JSON.stringify({method:'One route and 15 minutes of synthetic elapsed service per day; all public commands, original account3001/draw schedule. Stops before first selector. A UI fixture, not another cohort.',timeline,chosen:cat.id,source:suite?['360 stamps','24 marks']:[]},null,2));
   console.log(JSON.stringify(timeline.at(-1)));break;
  }
  for(const id of s.team){
   const owned=s.account.cards.find(c=>c.cardId===id);
   if(owned.level<12)s=R.metaCommand(s,{type:'level',cardId:owned.id}).state;
   s=R.metaCommand(s,{type:'ascend',cardId:owned.id}).state;
   for(const slot of C.EQUIPMENT_SLOTS){
    const other=new Set(Object.entries(s.equipment).filter(([cat])=>cat!==id).flatMap(([,slots])=>Object.values(slots)));
    const best=s.gear.filter(g=>R.GEAR_BY_ID[g.templateId].slot===slot&&!other.has(g.id)).map(item=>({item,utility:R.itemUtilityV4(s,id,item)})).sort((a,b)=>b.utility-a.utility)[0]?.item;
    if(best)s=accept(R.equipGear(s,id,best.id));
   }
  }
  const crafted=R.craftGear(s,'bellsteel-relic-rare');if(crafted.ok)s=crafted.state;
  for(const id of Object.values(s.equipment).flatMap(slots=>Object.values(slots)))s=R.enhanceGear(s,id).state;
  assert(day<35,'Selector UI fixture did not earn its first reward by day35');
 }
}finally{await suite.close();}
