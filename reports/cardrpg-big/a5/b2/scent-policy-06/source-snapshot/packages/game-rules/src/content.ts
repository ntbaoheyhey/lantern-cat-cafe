/**
 * Content registry: the lists of game content (gear slots, rarity tiers) in one place.
 * CONFIG.slots / CONFIG.rarities and the Slot / Rarity types are derived from here.
 *
 * Adding content (docs/extending.md):
 * - Slot: append to SLOTS, then add its numbers to CONFIG.gear.baseStat.
 * - Rarity: append to RARITIES with the NEXT relicId, then add a row to every per-rarity table in
 *   config.ts and a Relic art + metadata entry in scripts/gen-relics.mjs. Never reorder or remove.
 *
 * Why append-only: a rarity's position is its on-chain `rarity` (uint8, rarityIndex) and its
 * relicId is the ERC-1155 token id. Both are stored in the database and on Fuji, so changing either
 * for an existing rarity would silently re-label Relics that already exist. `relicId` is pinned
 * explicitly (not computed from the position) so a future reorder cannot move it by accident.
 */

/** Gear slots, in display order. */
export const SLOTS = [{ id: 'weapon' }, { id: 'helm' }, { id: 'armor' }, { id: 'ring' }] as const;

/** Rarity tiers, lowest to highest, each with its pinned RelicNFT token id. */
export const RARITIES = [
  { id: 'common', relicId: 1 },
  { id: 'rare', relicId: 2 },
  { id: 'epic', relicId: 3 },
  { id: 'legendary', relicId: 4 },
] as const;

type Ids<T extends readonly { readonly id: string }[]> = { readonly [K in keyof T]: T[K]['id'] };

export type SlotId = (typeof SLOTS)[number]['id'];
export type RarityId = (typeof RARITIES)[number]['id'];

/** Slot ids in display order, typed as the exact tuple (same type the literal list had). */
export const SLOT_IDS = SLOTS.map((s) => s.id) as unknown as Ids<typeof SLOTS>;
/** Rarity ids, lowest to highest, typed as the exact tuple. */
export const RARITY_IDS = RARITIES.map((r) => r.id) as unknown as Ids<typeof RARITIES>;

/** The pinned RelicNFT token id for a rarity (one id per tier; a tier's id never changes). */
export function relicIdOf(rarity: RarityId): number {
  const entry = RARITIES.find((r) => r.id === rarity);
  if (!entry) throw new Error(`Unknown rarity: ${rarity}`);
  return entry.relicId;
}
