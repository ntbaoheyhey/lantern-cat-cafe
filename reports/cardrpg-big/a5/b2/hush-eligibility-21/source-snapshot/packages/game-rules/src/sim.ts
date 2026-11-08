import { computeIdleGains, gearStat, heroPower, newPlayer, upgradeCost } from './rules';
import { deriveSeed, type Seed } from './rng';
import type { PlayerState } from './types';

/**
 * Reference "active starter" policy used for tuning: tick, equip drops that
 * beat the slot, spend gold on the upgrade with best stat gain per gold.
 */
export function simulateActivePlay(seed: Seed, seconds: number, tick = 10): PlayerState {
  const s = newPlayer();
  for (let t = 0, i = 0; t < seconds; t += tick, i++) {
    const g = computeIdleGains(s, tick, deriveSeed(seed, 100 + i));
    s.gold += g.gold;
    s.shards += g.shards;
    for (const d of g.drops) {
      const idx = s.gear.findIndex((x) => x.slot === d.slot);
      if (idx < 0) s.gear.push(d);
      else if (gearStat(d) > gearStat(s.gear[idx]!)) s.gear[idx] = d;
    }
    for (;;) {
      let best = -1;
      let bestRatio = 0;
      s.gear.forEach((it, k) => {
        const c = upgradeCost(it);
        if (c === null || c > s.gold) return;
        const gain = gearStat({ ...it, level: it.level + 1 }) - gearStat(it);
        if (gain / c > bestRatio) {
          bestRatio = gain / c;
          best = k;
        }
      });
      if (best < 0) break;
      const it = s.gear[best]!;
      s.gold -= upgradeCost(it)!;
      s.gear[best] = { ...it, level: it.level + 1 };
    }
  }
  return s;
}

export function powerAfter(seed: Seed, seconds: number): number {
  return heroPower(simulateActivePlay(seed, seconds).gear);
}
