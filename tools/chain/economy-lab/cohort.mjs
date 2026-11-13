import {rng,lognormal} from './runtime.mjs';

/** C2 rule cohort. Every reward, invitation, craft and salvage is a public rule
 * transition. Native battle policy resolves combat; only playback time is modeled. */
export function gearAccount(runtime,config,seed,profile,{days=config.cohortDays}={}){
 const {R,playRun}=runtime,random=rng(seed),epoch=config.startEpoch+(seed%28)*86400000;
 let state=R.setFormationC2(R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(seed,epoch),true),true),true));state.economyV3=true;
 const report={seed,profile:profile.id,days,firstEpicDay:null,firstLegendaryDay:null,calendarOffset:seed%28,daily:[],actions:{},gearCreated:{},income:{},spent:{},failures:0};
 let day=1,seconds=0;
 const record=(before,after,source)=>{
  report.actions[source]=(report.actions[source]??0)+1;
  for(const [k,v] of Object.entries(after.account.currencies)){const delta=v-before.account.currencies[k],bucket=delta>=0?report.income:report.spent;bucket[k]=(bucket[k]??0)+Math.abs(delta);}
  const old=new Set(before.gear.map(g=>g.id));
  for(const g of after.gear)if(!old.has(g.id)){
   const t=R.GEAR_BY_ID[g.templateId];report.gearCreated[t.id]=(report.gearCreated[t.id]??0)+1;
   if(t.rarity==='epic')report.firstEpicDay??=day;
   if(t.rarity==='legendary')report.firstLegendaryDay??=day;
  }
 };
 const apply=(result,source)=>{if(!result.ok)return false;record(state,result.state,source);state=result.state;seconds+=config.timing.decisionSeconds;return true;};
 function home(now){
  if(state.run&&!state.run.complete)return;
  // Retained replay logs have no economic authority; exclude them from projected saves.
  state.lastBattle=null;state.lastChoices=[];state.run=null;
  if(!R.idleChestA6(state,now).reason)apply(R.claimIdleA6(state,now),'idle');
  let board=R.dailyBoardA6(state,now);
  if(!board.login.reason)apply(R.claimDailyA6(state,now,'login'),'login');
  for(const task of board.tasks)if(!task.reason)apply(R.claimDailyA6(state,now,'task',task.id),'task');
  board=R.dailyBoardA6(state,now);for(const gift of board.weekly)if(!gift.reason)apply(R.claimDailyA6(state,now,'weekly',gift.points),'weekly');
  for(const m of R.MILESTONES_V4)if(!R.milestonePreviewV4(state,m.id).reason)apply(R.claimMilestoneV4(state,m.id),'milestone');
  for(const reward of R.STAR_REWARDS_V4)if(!R.starRewardPreviewV4(state,reward.id).reason)apply(R.claimStarRewardV4(state,reward.id),'stars');
  for(const floor of R.TOWER_CHESTS_A6)if(!R.towerChestA6(state,floor).reason)apply(R.claimTowerChestA6(state,floor),'tower-chest');
  for(let n=0;n<20;n++){
   if(!apply(R.metaCommand(state,{type:'pull',bannerId:'equipment',seed:Math.floor(random()*2**32),count:1}),'gear-invitation'))break;
  }
  const template=R.GEAR.find(g=>g.rarity==='legendary'&&g.chapter===1);
  if(report.firstLegendaryDay===null)apply(R.craftGear(state,template.id),'tailor');
  if(!R.selectorEligibilityV4(state,'gear',template.id))apply(R.chooseSelectorV4(state,'gear',template.id),'selector');
  // One equipment review per session, with explicit spending goals.
  apply(R.autoEquipA6(state),'equip');
  for(let n=0;n<profile.upgrades;n++){
   const cards=state.team.map(id=>state.account.cards.find(c=>c.cardId===id)).sort((a,b)=>a.level-b.level);
   let bought=false;for(const card of cards)if(apply(R.metaCommand(state,{type:'level',cardId:card.id}),'level')){bought=true;break;}
   if(!bought)break;
  }
  while(state.gear.length>36){
   const worn=new Set(Object.values(state.equipment).flatMap(Object.values));
   const spare=state.gear.find(g=>!worn.has(g.id)&&['common','rare'].includes(R.GEAR_BY_ID[g.templateId].rarity));
   if(!spare||!apply(R.salvageGear(state,spare.id),'salvage'))break;
  }
 }
 apply(runtime.firstInvitation(state,4),'welcome');
 for(day=1;day<=days;day++){
  seconds=0;const now=epoch+(day-1)*86400000;
  apply(R.syncCalendarDay(state,now),'calendar');
  const active=random()<profile.activeDays,hours=active?Math.min(16,lognormal(random,profile.hours,profile.hoursSigma)):0;
  const sessionMinutes=lognormal(random,profile.sessionMinutes,.25),sessions=active?Math.max(1,Math.round(hours*60/sessionMinutes)):0;
  let encounters=0,wins=0,routes=0,daySeconds=0,completedSessions=0;
  const createdBefore={...report.gearCreated};
  for(let session=0;session<sessions;session++){
   const sessionStart=now+daySeconds*1000;
   const budget=hours*3600/sessions;seconds=0;completedSessions++;home(sessionStart);
   for(let attempt=0;attempt<12&&seconds<budget;attempt++){
    // Six reward routes/day are the existing C2 cap; extra time still counts as hours.
    if(state.account.daily.battles>=6)break;
    const defaults=R.patrolDefaultsA6(state),mode=profile.id!=='casual'&&state.cleared.includes(1)&&routes===0?'tower':'campaign';
    const start=R.startRun(state,defaults.chapter,(seed+day*104729+attempt*7919+session*313)>>>0,mode,new Date(now).toISOString().slice(0,10),defaults.band);
    if(!apply(start,'start')){report.failures++;break;}
    const before=state;const after=playRun(state,'auto',battle=>{
     encounters++;seconds+=Math.max(config.timing.minimumEncounterSeconds,battle.choices.length*config.timing.battleActionSeconds);if(battle.result==='party')wins++;
    });record(before,after,'route');state=after;routes++;home(Math.floor(sessionStart+seconds*1000));
   }
   daySeconds+=seconds;
   if(state.account.daily.battles>=6)break;
  }
  const gear=Object.fromEntries(Object.entries(report.gearCreated).map(([id,n])=>[id,n-(createdBefore[id]??0)]).filter(([,n])=>n));
  // Do not improve bot efficiency metrics by dividing by unused/AFK budget.
  report.daily.push({day,active,hours:daySeconds/3600,plannedHours:hours,sessions:completedSessions,modeledSeconds:daySeconds,encounters,wins,routes,gear,level:Math.min(...state.team.map(id=>state.account.cards.find(c=>c.cardId===id).level)),cleared:[...state.cleared],seals:state.seals,materials:state.materials,tower:state.towerBest});
 }
 report.finalBalances={...state.account.currencies};report.censoredLegendary=report.firstLegendaryDay===null;return report;
}
