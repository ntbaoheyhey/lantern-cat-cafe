import type { BossFightResultV2 } from '../api/GameApiV2';
import type { GameSnapshotV2 } from '../game/v2/loopV2';
import type { SyncStatusV2 } from '../game/v2/syncStatus';

export interface PresentedBossFight {
  result: BossFightResultV2;
  chapter: number;
  maxHp: number;
  firstClear: boolean;
  complete: boolean;
}
interface BossDisplayHold {
  snapshot: GameSnapshotV2;
  syncStatus: SyncStatusV2;
  chapter: number;
  maxHp: number;
  firstClear: boolean;
  finishOnResolve: boolean;
}
export interface BossRun {
  chapter: number;
  won: boolean;
  durationMs: number;
  firstClear: boolean;
}
export interface BossPresentation {
  hold: BossDisplayHold | null;
  fight: PresentedBossFight | null;
  history: readonly BossRun[];
}
export const INITIAL_BOSS_PRESENTATION: BossPresentation = { hold: null, fight: null, history: [] };
export type BossPresentationAction =
  | { type: 'begin'; snapshot: GameSnapshotV2; syncStatus: SyncStatusV2; chapter: number; maxHp: number; firstClear: boolean }
  | { type: 'resolved'; result: BossFightResultV2; immediate: boolean }
  | { type: 'release' }
  | { type: 'close' }
  | { type: 'reset' };

function recordRun(history: readonly BossRun[], fight: PresentedBossFight): readonly BossRun[] {
  return [{ chapter: fight.chapter, won: fight.result.won, firstClear: fight.firstClear,
    durationMs: fight.result.timeline.at(-1)?.t ?? 0 }, ...history].slice(0, 30);
}

/** Display-only transaction. The store keeps its authoritative result immediately. */
export function bossPresentation(state: BossPresentation, action: BossPresentationAction): BossPresentation {
  switch (action.type) {
    case 'begin':
      if (state.hold || (state.fight && !state.fight.complete)) return state;
      return { ...state, hold: { ...action, finishOnResolve: false }, fight: null };
    case 'resolved': {
      const held = state.hold;
      if (!held || state.fight) return state;
      const complete = action.immediate || held.finishOnResolve;
      const fight = { result: action.result, chapter: held.chapter,
        maxHp: held.maxHp, firstClear: held.firstClear, complete };
      return { hold: complete ? null : held, fight,
        history: complete ? recordRun(state.history, fight) : state.history };
    }
    case 'release':
      if (!state.hold) return state;
      // Hidden-tab return / reduced motion can happen before the request resolves.
      if (!state.fight) return state.hold.finishOnResolve ? state
        : { ...state, hold: { ...state.hold, finishOnResolve: true } };
      return { hold: null, fight: { ...state.fight, complete: true }, history: recordRun(state.history, state.fight) };
    case 'close': return state.history.length ? { ...state, hold: null, fight: null } : INITIAL_BOSS_PRESENTATION;
    case 'reset': return INITIAL_BOSS_PRESENTATION;
  }
}
