import { startTurn, chooseAction, resolveAction, endTurn, getLegalTargets, getAutoAction } from './engine';
import { TURN_KITS } from './config';
import type { Hero, TurnBattle } from './types';
/** Advance real legal basics to a boundary; no direct queue or duration mutation. */
export function openRound(b: TurnBattle, round: number): void {
  for (let limit = 0; limit < 1000 && !b.result; limit++) {
    startTurn(b); if (b.round >= round) return;
    if (b.phase === 'choose') {
      const a = b.actors.find(a => a.id === b.activeId)!;
      const id = a.side === 'party' ? TURN_KITS[a.role as Hero][0] : b.intents[a.id]!.skillId;
      const choice = a.side === 'party' ? { actorId: a.id, skillId: id, targetId: getLegalTargets(b, id).find(t => t.legal)!.actorId } : getAutoAction(b)!;
      if (!chooseAction(b, choice)) throw Error('Invalid boundary test action');
      resolveAction(b);
    }
    endTurn(b);
  }
  throw Error('Round boundary was not reached');
}
