import {ECONOMY_V3 as E} from '../economy-v3';
import { partySize, validRowsC2 } from './formation-c2';
import { gameplayA6, battleKitA6 } from './gameplay-a6';
import { observeDailyA6 } from './daily-state-a6';
import { observeDiscoveriesV4 } from './journey-v4';
import { observeCollectionV4, settleBoardV4 } from './meta-v4';
import { drawInvitationsV4 } from './gacha-v4';
import { RELIC_EFFECTS } from './bridge';
import { createStarterAccount } from '../state';
import { RECIPES } from '../catalog';
import { GEAR_CAP_V4 } from './equipment-v4';
import { stackCapV4 } from './items-v4';
import { applyCommand } from '../commands';
import { craftGear, depthStats, equipmentEffects, equippedItems, initializeEquipment, makeGear } from './equipment';
import { clone, grant, requireRule, RuleFailure, spend } from '../internal';
import type { Command } from '../contract';
import { CAT_BY_ID, SKILLS } from './catalog';
import { crewStats, gameplayV4 } from './gameplay-v4';
import { CONTRACT_VERSION, type DepthAccount, type Row, type RuleResult } from './contract';
export const DEPTH_CAPS = {fish:420,threads:90,stamps:180,essence:6};
export const DEPTH_CAPS_V4 = {...DEPTH_CAPS,stamps:360};
export const depthCaps = (state:DepthAccount) => gameplayV4(state) ? DEPTH_CAPS_V4 : DEPTH_CAPS;
export function createDepthAccount(seed=11, now=0): DepthAccount {
  const account=createStarterAccount(seed);
  const team=account.cards.map(c=>c.cardId);
  const state:DepthAccount = {version:CONTRACT_VERSION,account,team,rows:Object.fromEntries(team.map(id=>[id,CAT_BY_ID[id]!.row])),skills:Object.fromEntries(team.map(id=>[id,CAT_BY_ID[id]!.skills.slice(0,3).map(s=>s.id)])),run:null,nextRunId:1,cleared:[],towerBest:0,lastBattle:null,lastChoices:[],gear:[],equipment:{},awakened:{},materials:0,seals:0,masteries:[],challengeClaims:[],claimedRuns:[],idle:{lastAt:now,receiptIds:[]},tutorial:0,freeInvite:false,settings:{sound:false,speed:1,reducedMotion:false,quality:'medium'},relics:[],selectedRelic:null,designClaims:[]};
  initializeEquipment(state);
  return state;
}
export function transactDepth(state: DepthAccount, fn: (draft: DepthAccount)=>void): RuleResult<DepthAccount> {
  const next=clone(state);
  try {observeCollectionV4(next);observeDiscoveriesV4(next);fn(next);observeDailyA6(state,next);observeCollectionV4(next);observeDiscoveriesV4(next);return {ok:true,state:next};}
  catch(error){if(!(error instanceof RuleFailure))throw error;return {ok:false,state,error:error.message};}
}
export function requireHome(state: DepthAccount) {requireRule(!state.run||state.run.complete,'BATTLE_PENDING','Finish or abandon this run before changing its loadout.');}
export function availableSkills(state: DepthAccount, id: string) {
  const owned=state.account.cards.find(c=>c.cardId===id);
  return (gameplayA6(state)?battleKitA6(id):CAT_BY_ID[id]?.skills??[]).filter(s=>owned&&(gameplayA6(state)||owned.level>=s.unlockLevel||owned.stars>=s.unlockStars));
}
/** New encounters derive their complete kit from progression, including old accounts. */
export function defaultSkills(state: DepthAccount, id: string): string[] {
  return availableSkills(state, id).map(skill => skill.id);
}
export function configureTeam(state: DepthAccount, team: string[], rows: Record<string,Row>, skills: Record<string,string[]>): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    requireHome(s);
    requireRule(team.length===partySize(s)&&new Set(team).size===partySize(s)&&team.every(id=>s.account.cards.some(c=>c.cardId===id)),'INVALID_TEAM',`Choose ${partySize(s)} different collected cats.`);
    requireRule(team.some(id=>rows[id]==='front')&&team.every(id=>['front','rear'].includes(rows[id]!)),'INVALID_TEAM','Keep at least one cat in the front row.');
    requireRule(!s.formationC2||validRowsC2(team,rows),'INVALID_TEAM','Place two cats in each row.');
    if(!gameplayV4(s)) for(const id of team){const chosen=skills[id]??[],unlocked=availableSkills(s,id);requireRule(chosen.length===3&&new Set(chosen).size===3&&chosen.every(skill=>unlocked.some(u=>u.id===skill)&&SKILLS[skill]!.catId===id),'INVALID_TEAM','Equip three different unlocked skills per cat.');}
    s.team=[...team];s.rows={...s.rows,...rows};s.skills={...s.skills,...clone(skills)};
  });
}
export function grantDepth(state: DepthAccount, currencies: Partial<typeof DEPTH_CAPS>, xp=0) {
  const capped=Object.fromEntries(Object.entries(currencies).map(([id,amount])=>[id,Math.max(0,Math.min(amount,depthCaps(state)[id as keyof typeof DEPTH_CAPS]-state.account.daily.earned[id as keyof typeof DEPTH_CAPS]))]));
  return grant(state.account,{currencies:capped,xp});
}
export function metaCommand(state: DepthAccount, command: Command): RuleResult<DepthAccount> {
  return transactDepth(state,s=>{
    requireHome(s);
    if(s.economyV3&&command.type==='ascend'){
      const card=s.account.cards.find(c=>c.id===command.cardId);requireRule(card&&card.stars<5,'MAX_LEVEL','Choose a cat below five stars.');const cost=E.starShards[card.stars-1]!;requireRule(card.shards>=cost,'INSUFFICIENT_FUNDS',`Need ${cost} matching shards.`);spend(s.account,{fish:150*card.stars});card.shards-=cost;card.stars++;return;
    }
    if(gameplayV4(s)){
      if(command.type==='claimQuest'){settleBoardV4(s,command.questId);return;}
      if(command.type==='pull'){drawInvitationsV4(s,command.bannerId,command.seed,command.count);return;}
      requireRule(!['equip','unequip','enhance','reforge','salvage','lock','selectTeam'].includes(command.type),'NOT_READY','Use the equipment workbench or crew screen for Gameplay v4.');
      const recipe=command.type==='forge'?RECIPES.find(r=>r.id===command.recipeId):undefined;
      requireRule(!recipe?.scarcityId,'NOT_READY','Use the local edition ledger to reserve a design.');
      if(s.formationC2&&recipe?.outputItemId){
        requireRule(s.account.chapter>=recipe.requiredChapter,'LOCKED','Reach the recipe source chapter first.');
        const crafted=craftGear(s,recipe.outputItemId);
        requireRule(crafted.ok,'NOT_READY',crafted.error??'The recipe cannot be crafted.');Object.assign(s,crafted.state);return;
      }
      const slots=recipe?.outputItemId?1:0;
      requireRule(s.gear.length+slots<=GEAR_CAP_V4||slots===0,'MAX_LEVEL','Equipment shelf is full (240). Make room for the entire reward before spending.');
      for(const [id,count] of Object.entries((recipe?.outputStackId?{[recipe.outputStackId]:1}:{}))){
        requireRule((s.account.inventory.stacks[id]??0)+count<=stackCapV4(id),'MAX_LEVEL',`The ${id} stack is full. Spend one before claiming or crafting.`);
      }
    }
    const before=clone(s.account),result=applyCommand(s.account,command);
    requireRule(result.ok,'INVALID_AMOUNT',result.ok?'':result.error.message);
    s.account=result.state;
    for(const item of s.account.inventory.items.filter(item=>!before.inventory.items.some(old=>old.id===item.id))) {
      const gear=makeGear(s,item.itemId,s.account.nextId);
      s.gear.push(gear);
    }
    for(const id of Object.keys(DEPTH_CAPS) as Array<keyof typeof DEPTH_CAPS>) {
      // Preserve already-earned V4 currency when its owner switches the mode off.
      const floor=s.v4?Math.max(depthCaps(s)[id],before.daily.earned[id]):depthCaps(s)[id];
      const excess=Math.max(0,s.account.daily.earned[id]-floor);
      s.account.currencies[id]-=excess;s.account.daily.earned[id]-=excess;
    }
    for(const c of s.account.cards)if(!s.skills[c.cardId]){s.skills[c.cardId]=CAT_BY_ID[c.cardId]!.skills.slice(0,3).map(sk=>sk.id);s.rows[c.cardId]=CAT_BY_ID[c.cardId]!.row;}
    requireRule(s.account.currencies.stamps>=0&&s.account.day>=before.day,'INVALID_AMOUNT','Invalid account transition.');
  });
}
export function battleCats(state: DepthAccount) {
  return state.team.map(id=>{
    const {effects,bonuses}=equipmentEffects(state,id);
    const relic = !gameplayA6(state) && id === state.team[0] && state.relics.includes(state.selectedRelic ?? 0)
      ? RELIC_EFFECTS.find(r => r.id === state.selectedRelic) : undefined;
    if (relic) bonuses[relic.bonus] = (bonuses[relic.bonus] ?? 0) + relic.value;
    const stats = depthStats(state,id);
    return {id,stats:gameplayV4(state)?crewStats(stats,state.team):stats,skills:defaultSkills(state,id),row:state.rows[id]!,equipment:equippedItems(state,id).map(i=>i.templateId),effects,bonuses};
  });
}
