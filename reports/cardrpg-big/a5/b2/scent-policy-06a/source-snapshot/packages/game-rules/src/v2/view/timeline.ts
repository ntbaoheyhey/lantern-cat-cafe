import type { BossEventV2 } from '../combat';
import type { TimelineEventViewV2 } from './types';
export function timelineViewV2(log: readonly BossEventV2[]): TimelineEventViewV2[] {
  return log.map(event => {
    const base = { t: event.t, type: event.type };
    switch (event.type) {
      case 'impact': return { ...base, damage: event.damage, crit: event.crit, bossHp: event.bossHp };
      case 'boss_windup': return { ...base, big: event.big };
      case 'boss_impact': return { ...base, damage: event.damage, catHp: event.catHp, big: event.big, dodged: event.dodged };
      case 'dot': return { ...base, damage: event.damage, bossHp: event.bossHp };
      default: return base;
    }
  });
}
