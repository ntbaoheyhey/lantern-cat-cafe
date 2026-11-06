import { createStarterAccount } from '../state';
import { applyCommand } from '../commands';
import { depthStats, equipmentEffects, equippedItems, initializeEquipment, makeGear } from './equipment';
import { clone, grant, requireRule, RuleFailure } from '../internal';
import type { Command } from '../contract';
import { CAT_BY_ID, SKILLS } from './catalog';
import { CONTRACT_VERSION, type DepthAccount, type Row, type RuleResult } from './contract';
export const DEPTH_CAPS = {fish:420,threads:90,stamps:180,essence:12};
export function createDepthAccount(seed=11, now=0): DepthAccount {
  const account=createStarterAccount(seed);
  const team=account.cards.map(c=>c.cardId);
  const state:DepthAccount = {version:CONTRACT_VERSION,account,team,rows:Object.fromEntries(team.map(id=>[id,CAT_BY_ID[id]!.row])),skills:Object.fromEntries(team.map(id=>[id,CAT_BY_ID[id]!.skills.slice(0,3).map(s=>s.id)])),run:null,nextRunId:1,cleared:[],towerBest:0,lastBattle:null,lastChoices:[],gear:[],equipment:{},awakened:{},materials:0,seals:0,masteries:[],challengeClaims:[],claimedRuns:[],idle:{lastAt:now,receiptIds:[]},tutorial:0,freeInvite:false,settings:{sound:false,speed:1,reducedMotion:false,quality:'medium'},relics:[],selectedRelic:null,designClaims:[]};
  initializeEquipment(state);
  return state;
}
export function transactDepth(state: DepthAccount, fn: (draft: DepthAccount)=>void): RuleResult<DepthAccount> {
  const next=clone(state);
  try {fn(next);return {ok:true,state:next};}
  catch(error){if(!(error instanceof RuleFailure))throw error;return {ok:false,state,error:error.message};}
}
export function requireHome(state: DepthAccount) {requireRule(!state.run||state.run.complete,'BATTLE_PENDING','Finish or abandon this run before changing its loadout.');}
export function availableSkills(state: DepthAccount, id: string) {
  const owned=state.account.cards.find(c=>c.cardId===id);
  return CAT_BY_ID[id]?.skills.filter(s=>owned&&(owned.level>=s.unlockLevel||owned.stars>=s.unlockStars))??[];
}
export function configureTeam(state: DepthAccount, team: string[], rows: Record<string,Row>, skills: Record<string,string[]>): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    requireHome(s);
    requireRule(team.length===3&&new Set(team).size===3&&team.every(id=>s.account.cards.some(c=>c.cardId===id)),'INVALID_TEAM','Choose three different collected cats.');
    requireRule(team.some(id=>rows[id]==='front')&&team.every(id=>['front','rear'].includes(rows[id]!)),'INVALID_TEAM','Keep at least one cat in the front row.');
    for(const id of team){const chosen=skills[id]??[],unlocked=availableSkills(s,id);requireRule(chosen.length===3&&new Set(chosen).size===3&&chosen.every(skill=>unlocked.some(u=>u.id===skill)&&SKILLS[skill]!.catId===id),'INVALID_TEAM','Equip three different unlocked skills per cat.');}
    s.team=[...team];s.rows={...s.rows,...rows};s.skills={...s.skills,...clone(skills)};
  });
}
export function grantDepth(state: DepthAccount, currencies: Partial<typeof DEPTH_CAPS>, xp=0) {
  const capped=Object.fromEntries(Object.entries(currencies).map(([id,amount])=>[id,Math.max(0,Math.min(amount,DEPTH_CAPS[id as keyof typeof DEPTH_CAPS]-state.account.daily.earned[id as keyof typeof DEPTH_CAPS]))]));
  return grant(state.account,{currencies:capped,xp});
}
export function metaCommand(state: DepthAccount, command: Command): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    requireHome(s);
    const before=clone(s.account),result=applyCommand(s.account,command);
    requireRule(result.ok,'INVALID_AMOUNT',result.ok?'':result.error.message);
    s.account=result.state;
    for(const item of s.account.inventory.items.filter(item=>!before.inventory.items.some(old=>old.id===item.id))) {
      const gear=makeGear(s,item.itemId,s.account.nextId);
      s.gear.push(gear);
    }
    for(const id of Object.keys(DEPTH_CAPS) as Array<keyof typeof DEPTH_CAPS>) {
      const excess=Math.max(0,s.account.daily.earned[id]-DEPTH_CAPS[id]);
      s.account.currencies[id]-=excess;s.account.daily.earned[id]-=excess;
    }
    for(const c of s.account.cards)if(!s.skills[c.cardId]){s.skills[c.cardId]=CAT_BY_ID[c.cardId]!.skills.slice(0,3).map(sk=>sk.id);s.rows[c.cardId]=CAT_BY_ID[c.cardId]!.row;}
    requireRule(s.account.currencies.stamps>=0&&s.account.day>=before.day,'INVALID_AMOUNT','Invalid account transition.');
  });
}
export function battleCats(state: DepthAccount) {
  return state.team.map(id=>{
    const {effects,bonuses}=equipmentEffects(state,id);
    return {id,stats:depthStats(state,id),skills:[...state.skills[id]!],row:state.rows[id]!,equipment:equippedItems(state,id).map(i=>i.templateId),effects,bonuses};
  });
}
