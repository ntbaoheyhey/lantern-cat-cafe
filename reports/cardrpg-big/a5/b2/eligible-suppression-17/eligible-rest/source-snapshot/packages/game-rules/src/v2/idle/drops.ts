import { rollLoot, type LootRegistry } from '../../loot';
import { Rng } from '../../rng';
import { V2_CONFIG } from '../config';
import {
  BONUS_LINE_RANGES, GEAR_RARITIES, GEAR_RARITY_IDS, GEAR_SLOTS, ITEMS, MATERIALS,
  SMART_LOOT, STATS, type ClassId, type GearRarityId, type MonsterDef,
} from '../content';
import { classOf } from '../combat';
import type { ClaimDeltaV2, OwnedItem, StackId } from './types';

export interface DropBatch {
  monster: MonsterDef;
  stage: number;
  kills: number;
  level: number;
  materialFind: number;
  clearedChapter: boolean;
}

/** Exact binomial via geometric gaps: visits successes, never every kill. */
export function binomial(count: number, probability: number, rng: Rng): number {
  const p = Math.max(0, Math.min(1, probability));
  if (p === 0 || count === 0) return 0;
  if (p === 1) return count;
  if (p > 0.5) return count - binomial(count, 1 - p, rng);
  const logMiss = Math.log1p(-p);
  let position = 0;
  let successes = 0;
  while (position < count) {
    position += 1 + Math.floor(Math.log1p(-rng.next()) / logMiss);
    if (position <= count) successes++;
  }
  return successes;
}

export function addStack(delta: ClaimDeltaV2, id: StackId, count: number): void {
  if (count > 0) delta.stackDeltas[id] = (delta.stackDeltas[id] ?? 0) + count;
}

export function keyCapacity(): number {
  return MATERIALS.find((material) => material.id === 'catKey')!.maxStack;
}

function gearDrop(classId: ClassId, batch: DropBatch, rarityId: GearRarityId, rng: Rng): OwnedItem {
  const slots = GEAR_SLOTS.filter((slot) => slot.unlockLevel <= batch.level);
  const slot = slots[rng.int(0, slots.length - 1)]!.id;
  const classWeapon = classOf(classId).weaponType;
  const ownWeapon = slot === 'weapon' && rng.chance(SMART_LOOT.classWeaponShare);
  const candidates = ITEMS.filter((item) => item.slot === slot && item.rarity === rarityId &&
    item.dropChapters.includes(batch.monster.chapter) &&
    (slot !== 'weapon' || (ownWeapon ? item.weaponType === classWeapon : item.weaponType !== classWeapon)));
  const item = candidates[rng.int(0, candidates.length - 1)]!;
  const rarity = GEAR_RARITIES.find((entry) => entry.id === rarityId)!;
  const available = STATS.filter((stat) => stat.bonusLine).map((stat) => stat.id);
  const bonus: OwnedItem['bonus'] = [];
  for (let line = 0; line < rarity.bonusLines; line++) {
    const [stat] = available.splice(rng.int(0, available.length - 1), 1);
    const [min, max] = BONUS_LINE_RANGES[stat!]![rarityId];
    bonus.push({ stat: stat!, value: min + rng.next() * (max - min) });
  }
  return {
    itemKey: item.id, slot, ...(item.weaponType ? { weaponType: item.weaponType } : {}),
    rarity: rarityId, level: Math.max(1, Math.min(rarity.maxLevel, batch.stage)),
    bonus, locked: false, equipped: false, source: 'drop',
  };
}

/** Roll bulk counts first; only actual gear drops enter the shared loot engine. */
export function rollDrops(
  delta: ClaimDeltaV2, batches: Iterable<DropBatch>, classId: ClassId, keysHeld: number, rng: Rng,
): void {
  const cfg = V2_CONFIG.idle;
  for (const batch of batches) {
    const multiplier = batch.monster.lootMul * (1 + batch.materialFind);
    for (const source of cfg.materialDrops) {
      if (batch.monster.chapter < source.fromChapter || (source.eliteOnly && batch.monster.kind !== 'elite')) continue;
      addStack(delta, source.id, binomial(batch.kills, source.chance * multiplier, rng));
    }
    if (batch.clearedChapter) {
      const keys = binomial(batch.kills, cfg.clearedChapterKeyChance, rng);
      addStack(delta, 'catKey', Math.min(keys, Math.max(0, keyCapacity() - keysHeld - (delta.stackDeltas.catKey ?? 0))));
    }
    const count = binomial(batch.kills, cfg.gearDropChance * batch.monster.lootMul, rng);
    if (!count) continue;
    const tableId = 'idle.gear';
    const registry: LootRegistry<GearRarityId> = {
      [tableId]: { id: tableId, lines: [{
        chance: 1, count: [count, count],
        pick: GEAR_RARITY_IDS.map((rarity) => ({ weight: cfg.gearRarityWeights[rarity], value: rarity })),
      }] },
    };
    for (const rarity of rollLoot(registry, tableId, rng.int(0, 0xffffffff))) {
      delta.items.push(gearDrop(classId, batch, rarity, rng));
    }
  }
}
