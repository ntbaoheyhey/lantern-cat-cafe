import { ENEMY_BY_ID, type BattleSetup } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { EffectPlan } from '../../squad/turn3d/effects';

/** Short everyday actions leave room for the uncut ultimate and boss moments. */
export function paceActionA6(plan: EffectPlan, setup: Pick<BattleSetup, 'gameplayA6' | 'enemies'>): EffectPlan {
  if (!setup.gameplayA6 || plan.ultimate || setup.enemies.some(id => ENEMY_BY_ID[id]?.tier === 'boss')) return plan;
  const budget = plan.presentationId?.startsWith('enemy:') || plan.skillId.endsWith('-1') ? 850 : 1000;
  if (plan.duration <= budget) return plan;
  let start = 0;
  const beats = plan.beats.map(beat => {
    const next = { ...beat, start, duration: Math.floor(beat.duration * budget / plan.duration) };
    start += next.duration;
    return next;
  });
  return { ...plan, beats, duration: start };
}
