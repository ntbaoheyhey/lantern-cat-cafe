import { rollLoot } from '../../loot';
import { Rng } from '../../rng';
import { bestLoadout, compareItems } from '../bag';
import { CHESTS, CHAPTERS, GEAR_SLOTS, GEAR_RARITIES, ITEMS, SMART_LOOT, STATS, BONUS_LINE_RANGES, CLASSES, RECIPES, type ClassId } from '../content';
import { V2_CONFIG } from '../config';
import { salvage, craftBlock } from '../forge';
import { emptyState, chooseClass, addItems, equip, applyCraft } from '../state';
import type { PlayerStateV2, StateResultV2, OwnedItem, StacksV2 } from '../state/types';

export function accepted<T>(result: StateResultV2<T>): { ok: true; state: PlayerStateV2 } & T {
  if (!result.ok) throw new Error(`simulation state refused: ${result.code}`);
  return result;
}
export function newPlayerV2(classId: ClassId): PlayerStateV2 {
  const chosen = accepted(chooseClass(accepted(emptyState()).state, classId));
  const inserted = accepted(addItems(chosen.state, [chosen.starterWeapon!], V2_CONFIG.bag.limit, salvage));
  return accepted(equip(inserted.state, chosen.starterWeapon!.id, 'weapon')).state;
}
export function equipBestV2(state: PlayerStateV2): PlayerStateV2 {
  for (const id of bestLoadout({ classId: state.classId!, level: state.level }, state.items).equip) {
    const result = equip(state, id, state.items.find((item) => item.id === id)!.slot);
    if (result.ok) state = result.state;
  }
  return state;
}
/** Preview the actual deterministic craft roll, without spending; choose the highest rarity then best slot. */
export function craftBestV2(state: PlayerStateV2, seed: number, now: number): { state: PlayerStateV2; crafted: boolean } {
  if (state.items.length >= V2_CONFIG.bag.limit) return { state, crafted: false };
  for (const recipe of [...RECIPES].reverse()) {
    let best: ReturnType<typeof applyCraft> | undefined;
    let gain = 0;
    for (const slot of GEAR_SLOTS.filter((entry) => entry.unlockLevel <= state.level)) {
      if (craftBlock({ stacks: state.stacks, lastRelicDay: -1 }, recipe.id, slot.id)) continue;
      const trial = applyCraft(state, recipe.id, slot.id, seed, now);
      if (!trial.ok) continue;
      const comparison = compareItems({ classId: state.classId!, level: state.level }, state.items.filter((item) => item.equipped), trial.item);
      if (comparison.powerAfter - comparison.powerBefore > gain) {
        gain = comparison.powerAfter - comparison.powerBefore;
        best = trial;
      }
    }
    if (best?.ok) return { state: best.state, crafted: true };
  }
  return { state, crafted: false };
}
/** No view helper exists on the base revision. Mirrors idle gearDrop with chest group restrictions. */
export function rollSimChestV2(state: PlayerStateV2, seed: number): { stackDeltas: StacksV2; items: OwnedItem[] } {
  const chapter = CHAPTERS.find((entry) => entry.index === state.chapter)!;
  const rewards = rollLoot(CHESTS, state.bossClears[state.chapter] ? chapter.chests.repeat : chapter.chests.firstClear, seed);
  const rng = new Rng(seed);
  const stackDeltas: StacksV2 = {};
  const items: OwnedItem[] = [];
  for (const reward of rewards) {
    if (reward.kind !== 'gear') {
      const id = reward.kind === 'fish' ? 'fish' : reward.id;
      stackDeltas[id] = (stackDeltas[id] ?? 0) + reward.amount;
      continue;
    }
    const slots = GEAR_SLOTS.filter((slot) => slot.unlockLevel <= state.level &&
      reward.group === slot.group);
    const slot = slots[rng.int(0, slots.length - 1)]!.id;
    const weapon = CLASSES.find((entry) => entry.id === state.classId)!.weaponType;
    const own = slot === 'weapon' && rng.chance(SMART_LOOT.classWeaponShare);
    const candidates = ITEMS.filter((item) => item.slot === slot && item.rarity === reward.rarity && item.dropChapters.includes(state.chapter) &&
      (slot !== 'weapon' || (own ? item.weaponType === weapon : item.weaponType !== weapon)));
    const def = candidates[rng.int(0, candidates.length - 1)]!;
    const rarity = GEAR_RARITIES.find((entry) => entry.id === reward.rarity)!;
    const available = STATS.filter((stat) => stat.bonusLine).map((stat) => stat.id);
    const bonus: OwnedItem['bonus'] = [];
    for (let line = 0; line < rarity.bonusLines; line++) {
      const [stat] = available.splice(rng.int(0, available.length - 1), 1);
      const [min, max] = BONUS_LINE_RANGES[stat!]![reward.rarity];
      bonus.push({ stat: stat!, value: min + rng.next() * (max - min) });
    }
    items.push({ id: `chest:${state.fights}:${items.length}`, itemId: def.id, itemKey: def.id, slot,
      ...(def.weaponType ? { weaponType: def.weaponType } : {}), rarity: reward.rarity,
      level: Math.max(1, Math.min(rarity.maxLevel, state.chapter * chapter.roundsPerChapter)), bonus, bonusLines: bonus,
      locked: false, equipped: false, source: 'chest' });
  }
  return { stackDeltas, items };
}
