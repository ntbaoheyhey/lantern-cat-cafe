import type { PlayerStateV2 } from '../state/types';
import { gateV2, type ClaimInputV2 } from '../idle';
import { frontierV2 } from './state';
import type { GateV2 } from './types';
export interface ClaimContextV2 { today: string; offline: boolean }
export function claimInputV2(state: PlayerStateV2, ctx: ClaimContextV2): ClaimInputV2 {
  if (state.classId === null) throw new Error('no_class');
  return { ...frontierV2(state), classId: state.classId, level: state.level, xp: state.xp, bestStage: state.bestStage,
    equipped: state.items.filter(item => item.equipped).map(item => ({ itemId: item.itemId, level: item.level, bonusLines: item.bonus.map(line => ({ ...line })) })),
    keysHeld: state.stacks.catKey ?? 0, lastDailyKeyDay: state.lastDailyKeyDay, ...ctx };
}
export function gateOfV2(state: PlayerStateV2, today: string): GateV2 {
  return state.classId === null ? { gated: false, neededPower: 0 } : gateV2(claimInputV2(state, { today, offline: false }));
}
