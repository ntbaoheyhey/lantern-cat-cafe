import { v2 } from '@taskbar-hero/game-rules';

/** Display advice only: expected normal attacks, not the seeded boss simulation or a gate. */
export function recommendedBossPower(stats: v2.CatStats, chapter: number): number | null {
  const monster = { ...v2.bossOfChapter(chapter), xp: 0, fish: 0 };
  const scaled = (scale: number): v2.CatStats => ({ ...stats, hp: stats.hp * scale, atk: stats.atk * scale, def: stats.def * scale });
  let low = 0;
  let high: number = v2.V2_CONFIG.idle.powerSearchMaxScale;
  const canWin = (scale: number) => {
    const fight = v2.monsterFight(scaled(scale), monster);
    return fight.canWin && fight.timeToKillMs <= v2.V2_CONFIG.boss.maxMs;
  };
  if (!canWin(high)) return null;
  for (let step = 0; step < v2.V2_CONFIG.idle.powerSearchSteps; step++) {
    const mid = (low + high) / 2;
    if (canWin(mid)) high = mid;
    else low = mid;
  }
  return Math.ceil(v2.powerRating(scaled(high)));
}

export interface BossRewardPreview { label: string; count: string; chance: number }
/** The chest's independent reward lines. Nested gear rolls are labelled by group, not invented rarity odds. */
export function bossRewardPreview(chapter: number, firstClear: boolean): BossRewardPreview[] {
  const definition = v2.CHAPTERS.find((entry) => entry.index === chapter);
  if (!definition) return [];
  const table = v2.CHESTS[firstClear ? definition.chests.firstClear : definition.chests.repeat];
  return (table?.lines ?? []).flatMap((line) => {
    // Current chapter chests pick one reward/group per line. Refuse ambiguous future tables.
    if (line.pick.length !== 1) return [];
    const reward = line.pick[0]!.value;
    let label: string;
    let amount = 1;
    if ('table' in reward) {
      const nested = v2.CHESTS[reward.table]?.lines[0]?.pick[0]?.value;
      if (!nested || 'table' in nested || nested.kind !== 'gear') return [];
      label = nested.group === 'main' ? 'Main gear' : 'Accessory';
    } else if (reward.kind === 'fish') {
      label = 'Fish'; amount = reward.amount;
    } else if (reward.kind === 'material') {
      label = v2.MATERIALS.find((entry) => entry.id === reward.id)?.name ?? reward.id;
      amount = reward.amount;
    } else {
      label = reward.group === 'main' ? 'Main gear' : 'Accessory';
    }
    const [min, max] = line.count.map((value) => value * amount);
    return [{ label, count: min === max ? String(min) : `${min}–${max}`, chance: line.chance * 100 }];
  });
}
