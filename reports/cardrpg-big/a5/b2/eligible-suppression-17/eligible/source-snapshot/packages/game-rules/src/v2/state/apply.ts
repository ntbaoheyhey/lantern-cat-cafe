import type { Seed } from '../../rng';
import type { ClaimDeltaV2 as IdleClaimDeltaV2 } from '../idle/types';
import { V2_CONFIG } from '../config';
import { CHAPTERS, CLASSES, RELIC_RECIPE } from '../content';
import { craft, craftBlock, relicForgeBlockV2, salvage } from '../forge';
import { nextItemId } from './equip';
import { addItems, applyStacks, type AutoSalvagedV2 } from './stacks';
import { cloneItem, cloneState, type ClaimDeltaV2, type OwnedItem, type PlayerStateV2,
  type StackId, type StacksV2, type StateResultV2 } from './types';

export function emptyState(): StateResultV2 {
  return { ok: true, state: {
    classId: null, level: 1, xp: 0, chapter: 1, round: 1, kills: 0, bestStage: 0,
    stacks: {}, items: [], bossClears: {}, bossCooldownUntil: null, fights: 0,
    lastDailyKeyDay: null, lastRelicDay: null, progressRev: 0,
  } };
}

/** Optional revision check mirrors the adapter's compare-and-set, without doing any I/O. */
export function applyClaim(state: PlayerStateV2, delta: ClaimDeltaV2 | IdleClaimDeltaV2,
  expectedProgressRev = state.progressRev): StateResultV2<{
    items: OwnedItem[]; autoSalvaged: AutoSalvagedV2[]; stackDeltas: StacksV2;
    gated: boolean; neededPower?: number;
  }> {
  if (!state.classId) return { ok: false, code: 'no_class' };
  if (expectedProgressRev !== state.progressRev) return { ok: false, code: 'stale' };
  const credited = applyStacks(state.stacks, delta.stackDeltas);
  if (!credited.ok) return credited;
  // V3 drops have catalog keys but no row ids yet. Allocate repeatable local ids without I/O;
  // a persistence adapter replaces these ids with UUIDs when it inserts owned rows.
  const pending = { ...state, items: [...state.items] };
  const items = delta.items.map((drop): OwnedItem => {
    const owned = 'id' in drop ? cloneItem(drop) : {
      ...drop, id: nextItemId(pending, 'drop'), itemId: drop.itemKey,
      bonus: drop.bonus.map((line) => ({ ...line })),
      bonusLines: drop.bonus.map((line) => ({ ...line })),
    };
    pending.items.push(owned);
    return owned;
  });
  const inserted = addItems({ ...state, stacks: credited.stacks }, items, V2_CONFIG.bag.limit, salvage);
  if (!inserted.ok) return inserted;
  const next = inserted.state;
  Object.assign(next, delta.progress);
  if (delta.dailyKeyDay !== undefined) next.lastDailyKeyDay = delta.dailyKeyDay;
  next.progressRev++;
  const stackDeltas = { ...credited.added };
  for (const [id, value] of Object.entries(inserted.gains) as [StackId, number][])
    stackDeltas[id] = (stackDeltas[id] ?? 0) + value;
  return { ...inserted, state: next, stackDeltas, gated: delta.gated,
    ...(delta.neededPower === undefined ? {} : { neededPower: delta.neededPower }) };
}

export interface BossApplicationV2 {
  won: boolean;
  chapter: number;
  chest: { stackDeltas: StacksV2; items: OwnedItem[] };
  keyCost: number;
  cooldownS: number;
  /** Unix seconds. */
  now: number;
  expectedProgressRev?: number;
  expectedFights?: number;
}

export function applyBossResult(state: PlayerStateV2, result: BossApplicationV2): StateResultV2<{
  keySpent: boolean; firstClear: boolean; items: OwnedItem[]; autoSalvaged: AutoSalvagedV2[];
}> {
  if (!state.classId) return { ok: false, code: 'no_class' };
  if ((result.expectedProgressRev !== undefined && result.expectedProgressRev !== state.progressRev) ||
    (result.expectedFights !== undefined && result.expectedFights !== state.fights))
    return { ok: false, code: 'stale' };
  if (!Number.isSafeInteger(result.keyCost) || result.keyCost <= 0 ||
    !Number.isFinite(result.now) || !Number.isFinite(result.cooldownS) || result.cooldownS < 0)
    return { ok: false, code: 'invalid_request' };
  if (state.bossCooldownUntil !== null && result.now < state.bossCooldownUntil)
    return { ok: false, code: 'cooldown', cooldownUntil: state.bossCooldownUntil };
  const chapter = CHAPTERS.find((entry) => entry.index === result.chapter);
  const previous = state.bossClears[result.chapter];
  if (!chapter || (!previous && (result.chapter !== state.chapter || (state.round !== chapter.roundsPerChapter || state.kills < chapter.killsPerRound))))
    return { ok: false, code: 'not_reached' };
  if ((state.stacks.catKey ?? 0) < result.keyCost) return { ok: false, code: 'no_key' };
  const next = cloneState(state);
  next.fights++;
  if (!result.won) {
    next.bossCooldownUntil = result.now + result.cooldownS;
    return { ok: true, state: next, keySpent: false, firstClear: false, items: [], autoSalvaged: [] };
  }
  const spent = applyStacks(next.stacks, { catKey: -result.keyCost });
  if (!spent.ok) return spent;
  // Check the key before crediting a chest; chest keys cannot pay for their own fight.
  const credited = applyStacks(spent.stacks, result.chest.stackDeltas);
  if (!credited.ok) return credited;
  next.stacks = credited.stacks;
  const inserted = addItems(next, result.chest.items, V2_CONFIG.bag.limit, salvage);
  if (!inserted.ok) return inserted;
  const updated = inserted.state;
  updated.bossClears[result.chapter] = { wins: (previous?.wins ?? 0) + 1 };
  const firstClear = !previous;
  if (firstClear && state.chapter === result.chapter) {
    updated.chapter++;
    updated.round = 1;
    updated.kills = 0;
    const stage = CHAPTERS.filter((entry) => entry.index <= result.chapter)
      .reduce((sum, entry) => sum + entry.roundsPerChapter, 0);
    updated.bestStage = Math.max(updated.bestStage, stage);
  }
  updated.bossCooldownUntil = null;
  updated.progressRev++;
  return { ...inserted, state: updated, keySpent: true, firstClear };
}

export function applyCraft(state: PlayerStateV2, recipeId: string, slot: string, seed: Seed,
  now: number): StateResultV2<{ item: OwnedItem; spent: StacksV2 }> {
  if (!state.classId) return { ok: false, code: 'no_class' };
  const forgeState = { stacks: state.stacks, lastRelicDay: -1 };
  const block = craftBlock(forgeState, recipeId, slot);
  if (block === 'unknown_recipe' || block === 'unknown_slot') return { ok: false, code: 'invalid_request' };
  if (block) return { ok: false, code: 'not_enough', stack: block.slice('not_enough_'.length) as StackId };
  if (state.items.length >= V2_CONFIG.bag.limit) return { ok: false, code: 'bag_full' };
  if (!Number.isFinite(now) || !Number.isFinite(seed)) return { ok: false, code: 'invalid_request' };
  const rolled = craft(forgeState, recipeId, slot,
    CLASSES.find((entry) => entry.id === state.classId)!.weaponType, state.bestStage, seed);
  const spent: StacksV2 = { ...rolled.spent.materials, fish: rolled.spent.fish };
  const debited = applyStacks(state.stacks,
    Object.fromEntries(Object.entries(spent).map(([id, value]) => [id, -value])));
  if (!debited.ok) return debited;
  const next = cloneState(state);
  next.stacks = debited.stacks;
  const item: OwnedItem = {
    id: nextItemId(next, `craft:${now}:${seed}`), itemId: rolled.item.itemKey,
    itemKey: rolled.item.itemKey, slot: rolled.item.slot, rarity: rolled.item.rarity,
    ...(rolled.item.weaponType ? { weaponType: rolled.item.weaponType } : {}),
    level: rolled.item.itemLevel, bonus: rolled.item.bonusLines.map((line) => ({ ...line })),
    bonusLines: rolled.item.bonusLines.map((line) => ({ ...line })),
    locked: false, equipped: false, source: 'craft',
  };
  next.items.push(item);
  return { ok: true, state: next, item: { ...item, bonus: item.bonus.map((line) => ({ ...line })),
    bonusLines: item.bonusLines?.map((line) => ({ ...line })) }, spent };
}

export function applySalvage(state: PlayerStateV2, itemIds: string[]): StateResultV2<{ gains: StacksV2 }> {
  if (!itemIds.length) return { ok: false, code: 'invalid_request' };
  const ids = new Set(itemIds);
  const selected: OwnedItem[] = [];
  for (const id of ids) {
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return { ok: false, code: 'not_owner' };
    selected.push(item);
  }
  if (selected.some((item) => item.equipped)) return { ok: false, code: 'equipped' };
  if (selected.some((item) => item.locked)) return { ok: false, code: 'locked' };
  const values: StacksV2 = {};
  for (const item of selected) for (const [id, qty] of Object.entries(salvage(item)) as [StackId, number][])
    values[id] = (values[id] ?? 0) + qty;
  const credited = applyStacks(state.stacks, values);
  if (!credited.ok) return credited;
  const next = cloneState(state);
  next.stacks = credited.stacks;
  next.items = next.items.filter((item) => !ids.has(item.id));
  return { ok: true, state: next, gains: credited.added };
}

export function lockItem(state: PlayerStateV2, itemId: string, locked: boolean): StateResultV2 {
  if (!state.items.some((item) => item.id === itemId)) return { ok: false, code: 'not_owner' };
  const next = cloneState(state);
  next.items.find((item) => item.id === itemId)!.locked = locked;
  return { ok: true, state: next };
}

/** Dates are explicit UTC+7 game-date strings, not timestamps or the host's local day. */
export function applyRelicForge(state: PlayerStateV2, today: string): StateResultV2<{ spent: StacksV2 }> {
  const dayMs = Date.parse(`${today}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isFinite(dayMs) ||
    new Date(dayMs).toISOString().slice(0, 10) !== today) return { ok: false, code: 'invalid_request' };
  // V5 uses numeric day indices; the supplied string is already the caller's game date.
  const day = dayMs / 86_400_000;
  const reason = relicForgeBlockV2({ stacks: state.stacks, lastRelicDay: state.lastRelicDay === today ? day : -1 }, day);
  if (reason) return { ok: false, code: 'forge_blocked', reason };
  const spent: StacksV2 = { ...RELIC_RECIPE.materials };
  const debited = applyStacks(state.stacks,
    Object.fromEntries(Object.entries(spent).map(([id, value]) => [id, -value])));
  if (!debited.ok) return debited;
  const next = cloneState(state);
  next.stacks = debited.stacks;
  next.lastRelicDay = today;
  return { ok: true, state: next, spent };
}
