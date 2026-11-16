import contract from './slots.json';

export const SLOTS_C2 = contract;
export interface StageUnitC2 { id: string; asset?: string; side: 'party' | 'enemy'; row: 'front' | 'rear'; boss?: boolean; aspect: number; bossRatio?: number; seat?: number; coreHeight?: number; coreRatio?: number; topExtent?: number; leftExtent?:number; rightExtent?:number }
export interface StageBoxC2 { x: number; y: number; width: number; height: number; coreHeight:number; footX: number; footY: number; order: number; slot: string }
/** Whole viewport height and stage height are deliberately separate coordinate measures.
 * A persistent six-seat capacity prevents living enemies from shifting when a foe falls. */
export function stageLayoutC2(units: readonly StageUnitC2[], width: number, height: number, viewportHeight=height, enemyCapacity=units.filter(u=>u.side==='enemy').length): Map<string, StageBoxC2> {
  const hasBoss = units.some(u => u.side === 'enemy' && u.boss);
  const counts = { 'party-front': 0, 'party-rear': 0, 'enemy-front': 0, 'enemy-rear': 0 };
  const occupied = new Set<number>();
  let helper = 0;
  return new Map(units.map(unit => {
    const lane = counts[`${unit.side}-${unit.row}`]++;
    let seatIndex=unit.seat ?? ((unit.row==='front'?0:2)+lane%2);
    if(unit.side==='enemy'&&!unit.boss){
      if(unit.seat===undefined){const choices=unit.row==='front'?[0,1,4,5,2,3]:[2,3,4,5,0,1];seatIndex=choices.find(i=>!occupied.has(i))??0;}
      occupied.add(seatIndex);
    }
    const seat=unit.side==='enemy'&&enemyCapacity>4&&!hasBoss?contract.enemySix[seatIndex]!:(unit.side==='party'&&enemyCapacity>4&&!hasBoss?contract.partySix:contract.slots)[seatIndex%4]!;
    const helperSeat=unit.side==='enemy'&&hasBoss&&!unit.boss?contract.bossHelpers[unit.seat!==undefined?unit.seat%2:helper++%2]!:null;
    const ratio=unit.boss?Math.max(contract.boss.minRatio,Math.min(contract.boss.maxRatio,unit.bossRatio??1.6)):1;
    // A six-foe formation needs a small shared size reserve at taller desktop ratios.
    // Four percent keeps enemies comparable to the cats while protecting painted silhouettes.
    const dense=unit.side==='enemy'&&enemyCapacity>4&&!hasBoss;
    // A6: incidental foes leave a continuous approach lane for the featured melee cat.
    const incidental=dense?Object.entries({
      'kettle-knight':{x:.71,y:.94,scale:.85},'spool-ram':{x:.52,y:.94,scale:.85},
      'crumb-sentinel':{x:.73,y:.68,scale:.85},'pollen-scout':{x:.88,y:.28,scale:.65},
    }).find(([asset])=>(unit.asset??unit.id)===asset||(!unit.asset&&unit.id.includes(asset)))?.[1]:undefined;
    const crowdedScale=unit.side==='enemy'&&enemyCapacity>4&&!hasBoss?.96:1;
    const coreHeight=viewportHeight*contract.unitHeight*ratio*crowdedScale*(incidental?.scale??1);
    const h=coreHeight/(unit.coreHeight??1),w=h*unit.aspect;
    const seatX=unit.side==='party'||enemyCapacity>4?seat.x:1-seat.x;
    // A7: the two boss helpers need 2.2% more span at900p; the existing4% edge clamp remains binding.
    const requestedX=width*(unit.boss?contract.boss.x:helperSeat?helperSeat.x+.022:incidental?.x??seatX);
    // Reserve a full four percent for painted bounds plus impact recoil.
    const leftExtent=unit.leftExtent===undefined?w/2:unit.leftExtent*coreHeight;
    const rightExtent=unit.rightExtent===undefined?w/2:unit.rightExtent*coreHeight;
    const footX=Math.max(leftExtent+width*.04,Math.min(width-rightExtent-width*.04,requestedX));
    // Leave room for health/status marks above the complete silhouette.
    const footY=Math.max(h+height*.07,Math.min(height*.97,height*(unit.boss?contract.boss.y:helperSeat?.y??incidental?.y??seat.y)));
    return [unit.id,{x:footX-w/2,y:footY-h,width:w,height:h,coreHeight,footX,footY,order:Math.round(footY*100),slot:unit.boss?'BOSS':helperSeat?`HELPER-${unit.seat??helper}`:seat.id}];
  }));
}
export function overlapShareC2(a: StageBoxC2, b: StageBoxC2): number {
  const area=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  return area/Math.min(a.width*a.height,b.width*b.height);
}
