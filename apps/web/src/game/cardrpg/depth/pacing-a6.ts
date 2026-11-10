import { ENEMY_BY_ID, type BattleSetup } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { EffectPlan } from '../../squad/turn3d/effects';

/** Short everyday actions leave room for the uncut ultimate and boss moments. */
export function paceActionA6(plan: EffectPlan, setup: Pick<BattleSetup, 'gameplayA6' | 'enemies'>): EffectPlan {
  if (!setup.gameplayA6 || plan.ultimate) return plan;
  const bossEncounter = setup.enemies.some(id => ENEMY_BY_ID[id]?.tier === 'boss');
  const enemyAction = !!plan.presentationId?.startsWith('enemy:');
  // Keep the guardian's authored signature and every ultimate. Ordinary attacks
  // and support casts still need a bounded beat, even in a long boss encounter.
  if (bossEncounter && enemyAction && !plan.presentationId?.endsWith(':basic')) return plan;
  const basic = enemyAction || plan.skillId.endsWith('-1');
  const budget = bossEncounter ? basic ? 750 : 900 : basic ? 650 : 800;
  if (plan.duration <= budget) return plan;
  let start = 0;
  const beats = plan.beats.map(beat => {
    const next = { ...beat, start, duration: Math.floor(beat.duration * budget / plan.duration) };
    start += next.duration;
    return next;
  });
  return { ...plan, beats, duration: start };
}
