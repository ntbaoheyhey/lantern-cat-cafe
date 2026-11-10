/** Stable render-only lanes for the initial and phase-three boss helpers. */
export const PUPPET_BOSS_ADD_LANES = [[2.85,1.25],[4.15,.15],[.40,1.15],[1.60,1.35]] as const;
export function updatePuppetBossAddLanes(livingIds:readonly string[],lanes:Map<string,number>) {
  const living=new Set(livingIds);
  for(const id of lanes.keys())if(!living.has(id))lanes.delete(id);
  const occupied=new Set(lanes.values());
  for(const id of livingIds)if(!lanes.has(id)){
    const lane=PUPPET_BOSS_ADD_LANES.findIndex((_,i)=>!occupied.has(i));
    if(lane>=0){lanes.set(id,lane);occupied.add(lane);}
  }
}
