import { rollLoot } from '../../loot';
import { Rng, deriveSeed, type Seed } from '../../rng';
import { BONUS_LINE_RANGES, CHAPTERS, CHESTS, FISH_UNIT, GEAR_RARITIES, GEAR_SLOTS, ITEMS, SMART_LOOT, STATS, type ClassId } from '../content';
import { classOf, stageOf } from '../combat';
import type { OwnedItem, StacksV2 } from '../state/types';
export interface ChestRollInputV2 { chapter: number; firstClear: boolean; classId: ClassId; level: number }
export function rollChestV2(input: ChestRollInputV2, seed: Seed): { stackDeltas: StacksV2; items: OwnedItem[] } {
  const chapter = CHAPTERS.find(ch => ch.index === input.chapter)!;
  const rewards = rollLoot(CHESTS, input.firstClear ? chapter.chests.firstClear : chapter.chests.repeat, seed);
  const rng = new Rng(deriveSeed(seed, 1));
  const stackDeltas: StacksV2 = {};
  const items: OwnedItem[] = [];
  for (const reward of rewards) {
    if (reward.kind !== 'gear') {
      const id = reward.kind === 'fish' ? 'fish' : reward.id;
      stackDeltas[id] = (stackDeltas[id] ?? 0) + reward.amount * (reward.kind === 'fish' ? FISH_UNIT : 1);
      continue;
    }
    let slots = GEAR_SLOTS.filter(slot => slot.group === reward.group && slot.unlockLevel <= input.level);
    if (!slots.length) slots = GEAR_SLOTS.filter(slot => slot.group === reward.group && slot.unlockLevel === 1);
    const slot = slots[rng.int(0, slots.length - 1)]!.id;
    const classWeapon = classOf(input.classId).weaponType;
    const ownWeapon = slot === 'weapon' && rng.chance(SMART_LOOT.classWeaponShare);
    const matching = ITEMS.filter(item => item.slot === slot && item.rarity === reward.rarity &&
      (slot !== 'weapon' || (ownWeapon ? item.weaponType === classWeapon : item.weaponType !== classWeapon)));
    const local = matching.filter(item => item.dropChapters.includes(input.chapter));
    const candidates = local.length ? local : matching;
    const item = candidates[rng.int(0, candidates.length - 1)]!;
    const rarity = GEAR_RARITIES.find(entry => entry.id === reward.rarity)!;
    const available = STATS.filter(stat => stat.bonusLine).map(stat => stat.id);
    const bonus: OwnedItem['bonus'] = [];
    for (let line = 0; line < rarity.bonusLines; line++) {
      const [stat] = available.splice(rng.int(0, available.length - 1), 1);
      const [min, max] = BONUS_LINE_RANGES[stat!]![rarity.id];
      bonus.push({ stat: stat!, value: min + rng.next() * (max - min) });
    }
    items.push({ id: `chest:${seed}:${items.length}`, itemId: item.id, itemKey: item.id, slot,
      ...(item.weaponType === undefined ? {} : { weaponType: item.weaponType }), rarity: rarity.id,
      level: Math.max(1, Math.min(rarity.maxLevel, stageOf(input.chapter, chapter.roundsPerChapter))),
      bonus, bonusLines: bonus.map(line => ({ ...line })), locked: false, equipped: false, source: 'chest' });
  }
  return { stackDeltas, items };
}
