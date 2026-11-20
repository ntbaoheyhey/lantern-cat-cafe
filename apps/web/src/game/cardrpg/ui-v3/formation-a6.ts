import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {EQUIPMENT_SLOTS} from '@taskbar-hero/game-rules/cardrpg';

/** A saved team at home restores equipment as well as its roster, rows and plan. */
export function savedTeamPreviewA6(state:R.DepthAccount,slot:number) {
  const result=R.applyLoadoutV4(state,slot),before=Math.round(R.teamPowerV4(state));
  const gear:string[]=[],bonuses:string[]=[];
  if(!result.ok)return {ok:false,error:result.error,before,after:before,gear,bonuses};
  const next=result.state;
  const pieceName=(id:string|undefined)=>id?R.GEAR_BY_ID[state.gear.find(g=>g.id===id)!.templateId]!.name.replace(/^(Common|Rare|Epic|Legendary) /,''):'Empty';
  for(const {cardId} of state.account.cards){
    const name=R.CAT_BY_ID[cardId]!.name;
    for(const slot of EQUIPMENT_SLOTS){
      const old=state.equipment[cardId]?.[slot],current=next.equipment[cardId]?.[slot];
      if(old!==current)gear.push(`${name} · ${slot}: ${pieceName(old)} to ${pieceName(current)}`);
    }
    const old=R.equipmentEffects(state,cardId).effects,current=R.equipmentEffects(next,cardId).effects;
    for(const gain of [false,true])for(const effect of (gain?current:old).filter(e=>!(gain?old:current).includes(e))){
      const set=R.SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect),text=set?R.setTextV4(set,true):null;
      const title=set?`${set.name} · ${set.twoEffect===effect?2:4} pieces`:'unique effect';
      const detail=set?(set.twoEffect===effect?text!.two:text!.four):R.effectTextV4(effect);
      bonuses.push(`${name}${(gain?next:state).team.includes(cardId)?'':' (bench)'} ${gain?'gains':'loses'} ${title}. ${detail}`);
    }
  }
  return {ok:true,error:'',before,after:Math.round(R.teamPowerV4(next)),gear,bonuses};
}

export const MODE_TEAMS_A6 = [
  { id: 'campaign', name: 'Campaign', slot: 0 },
  { id: 'daily', name: 'Daily', slot: 1 },
  { id: 'tower', name: 'Tower', slot: 2 },
] as const;
export interface SuggestedTeamA6 {
  name: string; why: string; team: string[]; rows: Record<string, R.Row>;
  plan: R.StandingPlan; power: number;
}
export function suggestedTeamsA6(state: R.DepthAccount, minimumLevel = 1): SuggestedTeamA6[] {
  const owned = state.account.cards.filter(c => c.level >= minimumLevel).map(c => c.cardId).sort();
  const teams:string[][]=[];
  const choose=(start:number,team:string[])=>{if(team.length===R.partySize(state)){teams.push(team);return;}for(let i=start;i<owned.length;i++)choose(i+1,[...team,owned[i]!]);};choose(0,[]);
  if(!teams.length)return [];
  const data=teams.map(team=>({team,power:Math.round(R.teamPowerV4({...state,team})),
    pairs:R.activePairCombosA6(team).length, guardian:team.some(id=>R.CAT_BY_ID[id]!.role==='guardian'),
    healer:team.some(id=>R.CAT_BY_ID[id]!.role==='healer'),attack:team.reduce((n,id)=>n+R.depthStats(state,id).attack,0)}));
  const recipes = [
    {name:'Steady friends',why:'A sturdy front with recovery behind it.',plan:{focus:'finish',care:'protect'} as R.StandingPlan,score:(t:typeof data[number])=>t.power+(+t.guardian+ +t.healer)*2500},
    {name:'Bonded partners',why:'Keep both partners standing for their combo.',plan:{focus:'support',care:'steady'} as R.StandingPlan,score:(t:typeof data[number])=>t.power+t.pairs*3000+(+t.guardian)*1000},
    {name:'Boss breakers',why:'Concentrate damage on the leader.',plan:{focus:'leader',care:'steady'} as R.StandingPlan,score:(t:typeof data[number])=>t.power+t.attack*20+(+t.guardian)*1000},
  ];
  const used=new Set<string>();
  return recipes.map(recipe=>{
    const ranked=[...data].sort((a,b)=>recipe.score(b)-recipe.score(a)||a.team.join().localeCompare(b.team.join()));
    const picked=ranked.find(t=>!used.has(t.team.join()))??ranked[0]!;used.add(picked.team.join());
    const front=[...picked.team].sort((a,b)=>Number(R.CAT_BY_ID[b]!.role==='guardian')-Number(R.CAT_BY_ID[a]!.role==='guardian')||(R.depthStats(state,b).hp+R.depthStats(state,b).defense*5)-(R.depthStats(state,a).hp+R.depthStats(state,a).defense*5)||a.localeCompare(b))[0]!;
    const team=[front,...picked.team.filter(id=>id!==front)];
    return {name:recipe.name,why:recipe.why,team,rows:state.formationC2?R.balancedRowsC2(team,{[front]:'front'}):Object.fromEntries(team.map(id=>[id,id===front?'front':'rear'])) as Record<string,R.Row>,plan:recipe.plan,power:picked.power};
  });
}
