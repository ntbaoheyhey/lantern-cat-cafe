import contract from './slots.json';

export const SLOTS_C2 = contract;
export interface StageUnitC2 { id: string; side: 'party' | 'enemy'; row: 'front' | 'rear'; boss?: boolean; aspect: number; bossRatio?: number; seat?: number }
export interface StageBoxC2 { x: number; y: number; width: number; height: number; footX: number; footY: number; order: number; slot: string }
/** One layout for battle, preparation, bounds checks and VFX anchors. Never packs living units around a KO. */
export function stageLayoutC2(units: readonly StageUnitC2[], width: number, height: number): Map<string, StageBoxC2> {
  const hasBoss = units.some(u => u.side === 'enemy' && u.boss);
  const counts = { 'party-front': 0, 'party-rear': 0, 'enemy-front': 0, 'enemy-rear': 0 };
  let helper = 0;
  return new Map(units.map(unit => {
    const lane = counts[`${unit.side}-${unit.row}`]++;
    const seat = contract.slots[unit.seat ?? ((unit.row === 'front' ? 0 : 2) + lane % 2)]!;
    const helperSeat = unit.side === 'enemy' && hasBoss && !unit.boss ? contract.bossHelpers[unit.seat!==undefined?unit.seat%2:helper++ % 2]! : null;
    const ratio = unit.boss ? Math.max(contract.boss.minRatio, Math.min(contract.boss.maxRatio, unit.bossRatio ?? 1.8)) : 1;
    const h = height * contract.unitHeight * ratio, w = h * unit.aspect;
    // A boss occupies the front column; summoned helpers keep their own back seats.
    const requestedX = width * (unit.boss ? contract.boss.x : helperSeat?.x ?? (unit.side === 'party' ? seat.x : 1 - seat.x));
    const footX = Math.max(w/2+width*.005,Math.min(width-w/2-width*.005,requestedX));
    const footY = height * (unit.boss ? contract.boss.y : helperSeat?.y ?? seat.y);
    return [unit.id, { x: footX - w / 2, y: footY - h, width: w, height: h, footX, footY,
      order: Math.round(footY * 100), slot: unit.boss ? 'BOSS' : helperSeat ? `HELPER-${helper}` : seat.id }];
  }));
}
export function overlapShareC2(a: StageBoxC2, b: StageBoxC2): number {
  const area = Math.max(0, Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))
    * Math.max(0, Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  return area / Math.min(a.width*a.height,b.width*b.height);
}
