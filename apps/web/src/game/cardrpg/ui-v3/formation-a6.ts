import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

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
  const teams = owned.flatMap((a,i)=>owned.slice(i+1).flatMap((b,j)=>owned.slice(i+j+2).map(c=>[a,b,c])));
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
    return {name:recipe.name,why:recipe.why,team,rows:Object.fromEntries(team.map(id=>[id,id===front?'front':'rear'])) as Record<string,R.Row>,plan:recipe.plan,power:picked.power};
  });
}
