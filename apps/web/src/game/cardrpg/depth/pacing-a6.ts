import { ENEMY_BY_ID, type BattleSetup } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { EffectPlan } from '../../squad/turn3d/effects';

/** Bound repeated boss actions while retaining the authored event/beat order. */
export function paceActionA6(plan: EffectPlan, setup: Pick<BattleSetup, 'gameplayA6' | 'enemies'>): EffectPlan {
  if (!setup.gameplayA6) return plan;
  const bossEncounter = setup.enemies.some(id => ENEMY_BY_ID[id]?.tier === 'boss');
  const enemyAction = !!plan.presentationId?.startsWith('enemy:');
  // Ultimates retain a longer readable beat; repeated signatures have a finite budget.
  const signature = bossEncounter && enemyAction && !plan.presentationId?.endsWith(':basic');
  const basic = enemyAction || plan.skillId.endsWith('-1');
  const budget = plan.ultimate ? 1700 : signature ? 1200 : bossEncounter ? basic ? 650 : 800 : basic ? 650 : 800;
  if (plan.duration <= budget) return plan;
  let start = 0;
  const beats = plan.beats.map(beat => {
    const next = { ...beat, start, duration: Math.floor(beat.duration * budget / plan.duration) };
    start += next.duration;
    return next;
  });
  return { ...plan, beats, duration: start };
}
