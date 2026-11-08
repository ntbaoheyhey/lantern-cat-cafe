import { CHAPTERS, GEAR_SLOTS, GEAR_SLOT_IDS, type GearSlotId } from '../content';
import { V2_CONFIG } from '../config';
import { xpToNextV2 } from '../idle';
import type { OwnedItem, PlayerStateV2 } from '../state/types';
import { lootViewV2 } from './loot';
import type { ItemViewV2, StateViewContextV2, StateViewV2 } from './types';

export function itemViewV2(item: OwnedItem): ItemViewV2 {
  return { id: item.id, itemKey: item.itemKey, slot: item.slot,
    ...(item.weaponType === undefined ? {} : { weaponType: item.weaponType }),
    rarity: item.rarity, level: item.level, bonus: item.bonus.map(line => ({ ...line })),
    locked: item.locked, equipped: item.equipped };
}
export function unlockedSlotsV2(level: number): GearSlotId[] {
  return GEAR_SLOTS.filter(slot => slot.unlockLevel <= level).map(slot => slot.id);
}
export function frontierV2(state: Pick<PlayerStateV2, 'chapter' | 'round' | 'kills'>): { chapter: number; round: number; kills: number } {
  const last = CHAPTERS[CHAPTERS.length - 1]!;
  return state.chapter > last.index
    ? { chapter: last.index, round: last.roundsPerChapter, kills: last.killsPerRound }
    : { chapter: state.chapter, round: state.round, kills: state.kills };
}
export function stateViewV2<F>(state: PlayerStateV2, ctx: StateViewContextV2<F>): StateViewV2<F> {
  const frontier = frontierV2(state);
  const chapter = CHAPTERS.find(ch => ch.index === frontier.chapter)!;
  const loot = lootViewV2(state.stacks, [], []);
  return {
    cat: { classId: state.classId, level: state.level, xp: state.xp, xpToNext: xpToNextV2(state.level) },
    progress: { ...frontier, killsPerRound: chapter.killsPerRound, gated: ctx.gate.gated,
      neededPower: ctx.gate.gated ? ctx.gate.neededPower : 0 },
    currencies: { fish: loot.fish, yarn: loot.yarn, keys: loot.keys }, materials: loot.materials,
    inventory: state.items.map(itemViewV2), bagLimit: V2_CONFIG.bag.limit,
    equipped: Object.fromEntries(GEAR_SLOT_IDS.map(slot => [slot, state.items.find(item => item.slot === slot && item.equipped)?.id ?? null])) as Record<GearSlotId, string | null>,
    unlockedSlots: unlockedSlotsV2(state.level),
    bosses: { chapters: CHAPTERS.map(ch => ({ chapter: ch.index, cleared: (state.bossClears[ch.index]?.wins ?? 0) > 0, wins: state.bossClears[ch.index]?.wins ?? 0 })),
      cooldownUntil: state.bossCooldownUntil !== null && state.bossCooldownUntil > ctx.nowS ? state.bossCooldownUntil : null },
    forge: ctx.forge, founder: ctx.founder, serverTime: Math.floor(ctx.nowS),
  };
}
