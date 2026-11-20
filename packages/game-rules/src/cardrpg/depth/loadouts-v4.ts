import { partySize, validRowsC2 } from './formation-c2';
import { clone, integer, requireRule } from '../internal';
import { EQUIPMENT_SLOTS, type Slot } from '../contract';
import type { DepthAccount, Row } from './contract';
import { DEFAULT_PLAN, gameplayV4, validPlan, type StandingPlan } from './gameplay-v4';
import { GEAR_BY_ID, equipmentEffects } from './equipment';
import { teamPowerV4 } from './equipment-v4';
import { requireHome, transactDepth } from './state';
export interface ShiftLoadoutV4 { name:string; team:string[]; rows:Record<string,Row>; plan:StandingPlan; equipment:Record<string,Partial<Record<Slot,string>>> }
export function saveLoadoutV4(state:DepthAccount,slot:number,name:string){return transactDepth(state,s=>{
 requireHome(s);requireRule(gameplayV4(s)&&s.v4,'NOT_READY','Shift loadouts need Gameplay v4.');
 requireRule(integer(slot,0,2)&&typeof name==='string'&&name.trim().length>0&&name.trim().length<=40,'INVALID_AMOUNT','Choose one of three shifts and a name of 1–40 characters.');
 const saved:ShiftLoadoutV4={name:name.trim(),team:[...s.team],rows:Object.fromEntries(s.team.map(id=>[id,s.rows[id]!])),plan:clone(s.v4.plan),equipment:Object.fromEntries(s.team.map(id=>[id,clone(s.equipment[id]??{})]))};
 s.v4.loadouts??=[null,null,null];s.v4.loadouts[slot]=saved;
});}
export function applyLoadoutV4(state:DepthAccount,slot:number){return transactDepth(state,s=>{
 requireHome(s);requireRule(gameplayV4(s)&&s.v4&&integer(slot,0,2),'NOT_READY','Choose an available shift.');
 const saved=s.v4.loadouts?.[slot];requireRule(saved,'NOT_READY','Save a shift here first.');
 requireRule(saved.team.length===partySize(s)&&new Set(saved.team).size===partySize(s)&&(!s.formationC2||validRowsC2(saved.team,saved.rows))&&saved.team.every(id=>s.account.cards.some(c=>c.cardId===id)&&['front','rear'].includes(saved.rows[id]!))&&saved.team.some(id=>saved.rows[id]==='front')&&validPlan(saved.plan),'INVALID_TEAM','This saved formation is not available.');
 const wanted:string[]=[];
 for(const id of saved.team)for(const [slot,instanceId] of Object.entries(saved.equipment[id]??{})){
  const gear=s.gear.find(g=>g.id===instanceId);
  requireRule(EQUIPMENT_SLOTS.includes(slot as Slot)&&gear&&GEAR_BY_ID[gear.templateId]!.slot===slot&&!wanted.includes(instanceId),'WRONG_SLOT','A saved piece is missing, repeated, or in the wrong slot; nothing changed.');wanted.push(instanceId);
 }
 for(const slots of Object.values(s.equipment))for(const slot of EQUIPMENT_SLOTS)if(wanted.includes(slots[slot]??''))delete slots[slot];
 for(const id of saved.team)s.equipment[id]=clone(saved.equipment[id]??{});
 s.team=[...saved.team];s.rows={...s.rows,...saved.rows};s.v4.plan=clone(saved.plan??DEFAULT_PLAN);
});}
export function previewLoadoutV4(state:DepthAccount,slot:number){
 const applied=applyLoadoutV4(state,slot);if(!applied.ok)return {ok:false,error:applied.error,transfers:[] as string[],changes:[] as string[],before:teamPowerV4(state),after:null};
 const transfers:string[]=[],changes:string[]=[];
 for(const id of applied.state.team){
  for(const piece of Object.values(applied.state.equipment[id]??{})){
   const old=Object.entries(state.equipment).find(([,gear])=>Object.values(gear).includes(piece))?.[0];if(old&&old!==id)transfers.push(`${piece}: ${old} → ${id}`);
  }
  const before=equipmentEffects(state,id).effects,after=equipmentEffects(applied.state,id).effects;
  for(const effect of after.filter(e=>!before.includes(e)))changes.push(`${id}: gains ${effect}`);
  for(const effect of before.filter(e=>!after.includes(e)))changes.push(`${id}: loses ${effect}`);
 }
 return {ok:true,error:'',transfers,changes,before:teamPowerV4(state),after:teamPowerV4(applied.state)};
}
