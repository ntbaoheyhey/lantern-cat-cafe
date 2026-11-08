import { CARD_BY_ID, ITEM_BY_ID, SET_BONUSES } from './catalog';
import { CARD_RPG_CONFIG as C } from './config';
import { EQUIPMENT_SLOTS, type AccountState, type Cost, type EnhanceResult, type EquipPreview, type ItemInstance, type Preview, type Result, type SalvageResult, type SetBonus, type Slot, type Stat, type Stats } from './contract';
import { afford, clone, noBattle, preview, progress, requireRule, spend, transact, grant } from './internal';
export function findItem(s: AccountState, id: string): ItemInstance { const i = s.inventory.items.find(x => x.id === id); requireRule(i && ITEM_BY_ID[i.itemId], 'UNKNOWN_ID', 'Equipment not found.'); return i; }
export function equippedBy(s: AccountState, id: string): string | undefined { return Object.keys(s.loadouts).find(card => Object.values(s.loadouts[card]!).includes(id)); }
export function activeSets(s: AccountState, cardId: string): SetBonus[] {
  const counts: Record<string, number> = {};
  for (const id of Object.values(s.loadouts[cardId] ?? {})) { const i = s.inventory.items.find(i => i.id === id), t = i && ITEM_BY_ID[i.itemId]; if (t) counts[t.setId] = (counts[t.setId] ?? 0) + 1; }
  return SET_BONUSES.filter(set => (counts[set.id] ?? 0) >= set.pieces);
}
export function computeCardStats(s: AccountState, cardId: string): Stats {
  const instance = s.cards.find(c => c.id === cardId), card = instance && CARD_BY_ID[instance.cardId];
  requireRule(instance && card, 'UNKNOWN_ID', 'Cat not found.');
  const stats: Stats = { ...card.baseStats };
  for (const key of ['hp', 'attack', 'defense'] as const) stats[key] = Math.round(stats[key] * (1 + (instance.level - 1) * C.level.statGrowth + (instance.stars - 1) * C.level.starGrowth));
  for (const slot of EQUIPMENT_SLOTS) {
    const id = s.loadouts[cardId]?.[slot]; if (!id) continue;
    const i = findItem(s, id), t = ITEM_BY_ID[i.itemId]!;
    stats[t.main.stat] += Math.round(t.main.value * (1 + i.enhancement * C.enhance.growth));
    for (const a of i.affixes) stats[a.stat] += a.value;
  }
  for (const set of activeSets(s, cardId)) for (const [stat, value] of Object.entries(set.stats)) stats[stat as Stat] += value;
  for (const key of Object.keys(stats) as Stat[]) stats[key] = Math.max(key === 'initiative' ? 1 : 0, Math.min(C.statCaps[key], Math.round(stats[key])));
  return stats;
}
function equipDraft(s: AccountState, cardId: string, instanceId: string): Slot {
  noBattle(s); const c = s.cards.find(c => c.id === cardId); requireRule(c, 'UNKNOWN_ID', 'Cat not found.');
  const i = findItem(s, instanceId), item = ITEM_BY_ID[i.itemId]!;
  requireRule(item.fit.includes(CARD_BY_ID[c.cardId]!.role), 'WRONG_ROLE', 'This weapon belongs to another role.');
  const owner = equippedBy(s, instanceId); requireRule(!owner || owner === cardId, 'EQUIPPED', 'Unequip this piece from its current cat first.');
  (s.loadouts[cardId] ??= {})[item.slot] = instanceId; return item.slot;
}
export function previewEquip(state: AccountState, cardId: string, instanceId: string): Preview<EquipPreview> {
  return preview(() => { const before = computeCardStats(state, cardId), s = clone(state); equipDraft(s, cardId, instanceId); const after = computeCardStats(s, cardId); return { before, after, delta: Object.fromEntries(Object.keys(before).map(k => [k, after[k as Stat] - before[k as Stat]])) as Stats, activatedSets: activeSets(s, cardId) }; });
}
export function equip(state: AccountState, cardId: string, instanceId: string): Result {
  return transact(state, (s, events) => { const before = activeSets(s, cardId), slot = equipDraft(s, cardId, instanceId); events.push({ type: 'item.equipped', cardId, instanceId, slot }); for (const set of activeSets(s, cardId)) if (!before.some(b => b.id === set.id && b.pieces === set.pieces)) events.push({ type: 'set.activated', cardId, setId: set.id, pieces: set.pieces }); });
}
export function unequip(state: AccountState, cardId: string, slot: Slot): Result { return transact(state, (s, events) => { noBattle(s); requireRule(s.cards.some(c => c.id === cardId), 'UNKNOWN_ID', 'Cat not found.'); requireRule(EQUIPMENT_SLOTS.includes(slot), 'WRONG_SLOT', 'Unknown equipment slot.'); delete s.loadouts[cardId]?.[slot]; events.push({ type: 'item.equipped', cardId, instanceId: null, slot }); }); }
export function enhanceCost(level: number): Cost { return { fish: C.enhance.fishBase * (level + 1) ** 2, threads: C.enhance.threadsBase * (level + 1) }; }
export function previewEnhance(s: AccountState, instanceId: string): Preview<EnhanceResult> {
  return preview(() => { noBattle(s); const i = findItem(s, instanceId); requireRule(i.enhancement < C.enhance.max, 'MAX_LEVEL', 'Enhancement is already +12.'); const cost = enhanceCost(i.enhancement); afford(s, cost); return { instanceId, before: i.enhancement, after: i.enhancement + 1, cost }; });
}
export function enhance(state: AccountState, instanceId: string): Result<EnhanceResult> { return transact(state, (s, events) => { const p = previewEnhance(s, instanceId); requireRule(p.ok, p.ok ? 'NOT_READY' : p.error.code, p.ok ? '' : p.error.message); spend(s, p.value.cost); findItem(s, instanceId).enhancement++; progress(s, 'enhances'); events.push({ type: 'item.enhanced', instanceId, level: p.value.after }); return p.value; }); }
export function previewSalvage(s: AccountState, instanceId: string): Preview<SalvageResult> { return preview(() => { noBattle(s); const i = findItem(s, instanceId); requireRule(!i.locked && !i.favourite, 'LOCKED', 'Unlock and unfavourite before salvaging.'); requireRule(!equippedBy(s, instanceId), 'EQUIPPED', 'Unequip before salvaging.'); return { instanceId, reward: { currencies: { threads: C.rarity[ITEM_BY_ID[i.itemId]!.rarity].salvage }, xp: 0 } }; }); }
export function salvage(state: AccountState, instanceId: string): Result<SalvageResult> { return transact(state, (s, events) => { const p = previewSalvage(s, instanceId); requireRule(p.ok, p.ok ? 'NOT_READY' : p.error.code, p.ok ? '' : p.error.message); s.inventory.items = s.inventory.items.filter(i => i.id !== instanceId); grant(s, p.value.reward, false); events.push({ type: 'item.salvaged', id: instanceId }); return p.value; }); }
export function lockItem(state: AccountState, instanceId: string, locked: boolean, favourite?: boolean): Result { return transact(state, s => { const i = findItem(s, instanceId); i.locked = locked; if (favourite !== undefined) i.favourite = favourite; }); }
export const REFORGE_POOL: readonly Stat[] = ['hp', 'attack', 'defense', 'critBp', 'effectHitBp', 'effectResistBp', 'healingBp', 'shieldBp'];
export function reforge(state: AccountState, instanceId: string, affixIndex: number, stat: Stat): Result { return transact(state, s => { noBattle(s); const i = findItem(s, instanceId); requireRule(Number.isInteger(affixIndex) && !!i.affixes[affixIndex], 'INVALID_AMOUNT', 'Choose an existing affix.'); requireRule(REFORGE_POOL.includes(stat), 'UNKNOWN_ID', 'This stat cannot be reforged.'); requireRule(!i.locked && !i.favourite, 'LOCKED', 'Unlock and unfavourite before reforging.'); requireRule(!i.affixes.some((a, n) => n !== affixIndex && a.stat === stat), 'NOT_READY', 'Affixes must remain distinct.'); spend(s, C.reforge); const tier = i.affixes[affixIndex]!.tier; i.affixes[affixIndex] = { stat, tier, value: C.reforgeValues[stat as keyof typeof C.reforgeValues] * tier }; i.reforgeCount++; }); }
export function previewLevel(s: AccountState, cardId: string): Preview<{ cost: Cost; level: number }> { return preview(() => { noBattle(s); const c = s.cards.find(c => c.id === cardId); requireRule(c, 'UNKNOWN_ID', 'Cat not found.'); requireRule(c.level < CARD_BY_ID[c.cardId]!.levelCap, 'MAX_LEVEL', 'Cat reached its rarity level cap.'); const cost = { fish: C.level.fishBase * c.level, threads: C.level.threads }; afford(s, cost); return { cost, level: c.level + 1 }; }); }
export function levelCard(state: AccountState, cardId: string): Result { return transact(state, (s, events) => { const p = previewLevel(s, cardId); requireRule(p.ok, p.ok ? 'NOT_READY' : p.error.code, p.ok ? '' : p.error.message); spend(s, p.value.cost); s.cards.find(c => c.id === cardId)!.level = p.value.level; events.push({ type: 'levelUp', cardId, level: p.value.level }); }); }
export function previewAscend(s: AccountState, cardId: string): Preview<{ cost: Cost; shards: number; stars: number }> { return preview(() => { noBattle(s); const c = s.cards.find(c => c.id === cardId); requireRule(c, 'UNKNOWN_ID', 'Cat not found.'); requireRule(c.stars < C.level.maxStars, 'MAX_LEVEL', 'Cat reached five stars.'); const shards = C.level.shardsBase * c.stars; requireRule(c.shards >= shards, 'INSUFFICIENT_FUNDS', `Need ${shards} matching shards.`); const cost = { fish: C.level.ascendFish * c.stars }; afford(s, cost); return { cost, shards, stars: c.stars + 1 }; }); }
export function ascendCard(state: AccountState, cardId: string): Result { return transact(state, s => { const p = previewAscend(s, cardId); requireRule(p.ok, p.ok ? 'NOT_READY' : p.error.code, p.ok ? '' : p.error.message); spend(s, p.value.cost); const c = s.cards.find(c => c.id === cardId)!; c.shards -= p.value.shards; c.stars = p.value.stars; }); }
