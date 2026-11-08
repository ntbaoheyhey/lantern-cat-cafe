import { CARDS, QUESTS } from '../catalog';
import { CARD_RPG_CONFIG } from '../config';
import { type Cost } from '../contract';
import { requireRule } from '../internal';
import { GEAR, GEAR_BY_ID, SETS } from './equipment';
import { gameplayV4 } from './gameplay-v4';
import { stackCapV4 } from './items-v4';
import { claimIdleService, idlePreview, syncCalendarDay } from './bridge';
import { DEPTH_CAPS, depthCaps, grantDepth, requireHome, transactDepth } from './state';
import type { DepthAccount } from './contract';
export interface CollectionJournalV4 { cats:string[];gear:string[];sets:string[];rewardedRoutes:number;claims:string[] }
export function journalV4(s:DepthAccount):CollectionJournalV4 {
 const journal=s.v4?.journal??{cats:[],gear:[],sets:[],rewardedRoutes:0,claims:[]};
 const cats=[...new Set([...journal.cats,...s.account.cards.map(c=>c.cardId)])];
 const gear=[...new Set([...journal.gear,...s.gear.map(i=>i.templateId)])];
 const sets=[...journal.sets];
 for(const slots of Object.values(s.equipment)){
  const worn=Object.values(slots).map(id=>s.gear.find(i=>i.id===id)).filter(Boolean);
  if(worn.length===4&&new Set(worn.map(i=>GEAR_BY_ID[i!.templateId]!.setId)).size===1){const set=GEAR_BY_ID[worn[0]!.templateId]!.setId;if(!sets.includes(set))sets.push(set);}
 }
 return {cats,gear,sets,rewardedRoutes:journal.rewardedRoutes,claims:[...journal.claims]};
}
/** Called before and after successful public mutations so salvaging never erases discovery. */
export function observeCollectionV4(s:DepthAccount):void {if(gameplayV4(s)&&s.v4)s.v4.journal=journalV4(s);}
export const MILESTONES_V4=[
 {id:'six-cats',name:'Six seats at the table',target:6,kind:'cats',reward:{stamps:60}},
 {id:'twelve-templates',name:'A shelf of possibilities',target:12,kind:'gear',reward:{threads:40}},
 {id:'first-set',name:'A matching shift',target:1,kind:'sets',reward:{fish:80}},
 {id:'three-chapters',name:'Every evening explored',target:3,kind:'chapters',reward:{}},
 {id:'ten-routes',name:'Ten evenings of effort',target:10,kind:'routes',reward:{stamps:60}},
] as const;
export function cappedPreviewV4(s:DepthAccount,requested:Cost):Cost {
 return Object.fromEntries(Object.entries(requested).map(([id,n])=>[id,Math.max(0,Math.min(n,depthCaps(s)[id as keyof typeof DEPTH_CAPS]-s.account.daily.earned[id as keyof typeof DEPTH_CAPS]))]));
}
export function milestonePreviewV4(s:DepthAccount,id:string){
 const milestone=MILESTONES_V4.find(m=>m.id===id);requireRule(milestone,'UNKNOWN_ID','Choose a journal milestone.');
 const journal=journalV4(s),progress=milestone.kind==='chapters'?s.cleared.length:milestone.kind==='routes'?journal.rewardedRoutes:journal[milestone.kind].length;
 const ribbon=id==='three-chapters'&&!s.account.inventory.stacks['cafe-ribbon'];
 const requested:Cost=id==='three-chapters'?(ribbon?{}:{threads:20}):milestone.reward;
 const reward=cappedPreviewV4(s,requested),hasReward=ribbon||Object.values(reward).some(n=>n>0),claimed=journal.claims.includes(id);
 const reason=!gameplayV4(s)?'Enable Gameplay v4 first.':s.run&&!s.run.complete?'Finish your route first.':claimed?'Already collected.':progress<milestone.target?'Keep collecting and exploring.':!hasReward?'Daily reward space is full. Keep this claim for a later day.':null;
 return {...milestone,progress,claimed,requested,reward,ribbon,reason};
}
export function claimMilestoneV4(state:DepthAccount,id:string){return transactDepth(state,s=>{
 requireHome(s);const preview=milestonePreviewV4(s,id);requireRule(!preview.reason,'NOT_READY',preview.reason??'');
 grantDepth(s,preview.reward);if(preview.ribbon)s.account.inventory.stacks['cafe-ribbon']=1;
 s.v4!.journal=journalV4(s);s.v4!.journal.claims.push(id);
});}
export function boardPreviewV4(s:DepthAccount,id:string){
 const quest=QUESTS.find(q=>q.id===id);requireRule(quest,'UNKNOWN_ID','Choose a board task.');
 const progress=s.account.quests[id]!,reward=cappedPreviewV4(s,quest.reward.currencies),stacks=quest.reward.stacks??{};
 const fullStack=Object.entries(stacks).some(([id,n])=>(s.account.inventory.stacks[id]??0)+n>stackCapV4(id));
 const useful=Object.values(reward).some(n=>n>0)||Object.values(stacks).some(n=>n>0);
 const reason=progress.claimed?'Already collected.':progress.progress<quest.target?'Complete this task first.':fullStack?'Use an item before claiming this full stack.':!useful?'Daily reward space is full. The reward remains available.':null;
 return {quest,progress,reward,stacks,reason};
}
/** Within the existing meta-command draft; board is the existing quest reward source. */
export function settleBoardV4(s:DepthAccount,id:string):void {
 const preview=boardPreviewV4(s,id);requireRule(!preview.reason,'NOT_READY',preview.reason??'');
 grantDepth(s,preview.reward,preview.quest.reward.xp);for(const [key,n]of Object.entries(preview.stacks))s.account.inventory.stacks[key]=(s.account.inventory.stacks[key]??0)+n;
 s.account.quests[id]!.claimed=true;
}
export function cafeShiftV4(s:DepthAccount,now:number){
 const floor=Math.max(s.idle.lastAt,s.v4?.clockWatermark??0,(s.idle.dayKey??0)*86400000),rollback=!Number.isSafeInteger(now)||now<floor;
 const effective=rollback?floor:now;
 const dayKey=Math.floor(effective/86400000),previous=s.idle.dayKey??Math.floor(s.idle.lastAt/86400000);
 const state=dayKey>previous?syncCalendarDay(s,effective).state:s,preview=idlePreview(state,effective);
 const claims=rollback?0:preview.claims,reward=cappedPreviewV4(state,Object.fromEntries(Object.entries(CARD_RPG_CONFIG.service.reward).map(([id,n])=>[id,n*claims])));
 let readyAt=effective;
 if(!claims){
  const remaining=2-state.account.daily.service;
  const nextState=remaining>0?state:{...state,account:{...state.account,daily:{...state.account.daily,service:0}}};
  let low=remaining>0?effective:(Math.floor(effective/86400000)+1)*86400000,high=low+86400000;
  if(idlePreview(nextState,low).claims>0)readyAt=low;
  else {while(high-low>1000){const mid=Math.floor((low+high)/2);if(idlePreview(nextState,mid).claims>0)high=mid;else low=mid;}readyAt=high;}
 }
 return {...preview,claims,reward,rollback,remaining:Math.max(0,2-state.account.daily.service),now:effective,readyAt};
}
export function claimCafeShiftV4(state:DepthAccount,now:number){return transactDepth(state,s=>{
 requireHome(s);requireRule(gameplayV4(s),'NOT_READY','Enable Gameplay v4 first.');
 const preview=cafeShiftV4(s,now);requireRule(!preview.rollback&&preview.claims>0,'NOT_READY','Wait for the next useful cafe service.');
 requireRule(Object.values(preview.reward).some(n=>n>0),'DAILY_CAP','Daily reward space is full. Your service is not consumed.');
 const refreshed=syncCalendarDay(s,now);requireRule(refreshed.ok,'NOT_READY',refreshed.error??'Calendar refresh unavailable.');
 const result=claimIdleService(refreshed.state,now);requireRule(result.ok,'NOT_READY',result.error??'Service unavailable.');
 Object.assign(s,result.state);s.v4!.clockWatermark=now;
});}
export function validateJournalV4(s:DepthAccount):void {
 const j=s.v4?.journal;if(j===undefined)return;
 requireRule(!!j&&typeof j==='object','INVALID_AMOUNT','Invalid collection journal.');
 for(const [entries,allowed]of [[j.cats,CARDS.map(c=>c.id)],[j.gear,GEAR.map(g=>g.id)],[j.sets,SETS.map(s=>s.id)],[j.claims,MILESTONES_V4.map(m=>m.id)]] as Array<[string[],readonly string[]]>)
  requireRule(Array.isArray(entries)&&new Set(entries).size===entries.length&&entries.every(x=>allowed.includes(x)),'INVALID_AMOUNT','Invalid collection journal.');
 requireRule(Number.isSafeInteger(j.rewardedRoutes)&&j.rewardedRoutes>=0,'INVALID_AMOUNT','Invalid rewarded-route history.');
}

export const LESSONS_V4=[
 {id:'front',title:'One sturdy front row',text:'Keep a guardian in front. Rear companions gain cover while the front holds.',action:'Arrange your crew',screen:'team'},
 {id:'intent',title:'Read one opponent',text:'Look for the next enemy signature before Fight. Hush can stop a healer; cleanse answers Tangle.',action:'Read the field guide',screen:'codex'},
 {id:'gear',title:'One piece, one purpose',text:'Compare an item’s stats and utility before equipping it. A matching set adds a bounded team effect.',action:'Compare equipment',screen:'inventory'},
 {id:'invite',title:'Invitations you earn',text:'Each earned invitation adds one selector mark. Save 24 marks to choose a companion. Welcome invitations add none.',action:'Review invitation odds',screen:'gacha'},
] as const;
export function currentLessonV4(s:DepthAccount){return s.account.day>=7?null:LESSONS_V4.find(l=>!s.v4?.lessons?.includes(l.id))??null;}
export function finishLessonV4(state:DepthAccount,id:string){return transactDepth(state,s=>{
 requireHome(s);requireRule(gameplayV4(s)&&!!s.v4&&LESSONS_V4.some(l=>l.id===id),'NOT_READY','Choose a current cafe lesson.');
 requireRule(currentLessonV4(s)?.id===id,'NOT_READY','That lesson is already complete or not next.');
 s.v4!.lessons??=[];s.v4!.lessons.push(id);
});}

/** First-week suggestions, not calendar unlocks or guaranteed drops. No saved state. */
export function firstWeekV4(s: DepthAccount) {
 if (!gameplayV4(s)) return null;
 const goals = [
  'Place a sturdy companion in front. Try the practice table.',
  'Compare a spare piece. Equip the one that helps your crew.',
  'Spend earned stamps on an invitation. Save marks for your choice.',
  'Try a different crew job. Choose its standing plan before fighting.',
  'Save your favourite shift. Try another piece without losing your setup.',
  'Read the next boss’s guide. Prepare an upgrade you can afford.',
  'Challenge your next uncleared chapter with your prepared crew.',
 ];
 const day = Math.max(1, s.account.day);
 const goal = goals[Math.min(day, 7) - 1]!;
 const nextGoal = day < 7 ? goals[day]! : 'Try another crew on a familiar route.';
 return {day, goal, tomorrow: `${nextGoal} Two cafe services return; earn up to ${depthCaps(s).stamps} stamps across tomorrow’s activities.`};
}
