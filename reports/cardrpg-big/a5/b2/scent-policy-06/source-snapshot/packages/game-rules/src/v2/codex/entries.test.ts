import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { RARITIES } from '../../content';
import { V2_CONFIG } from '../config';
import { bossOfChapter, stageOf } from '../combat/stage';
import { CHAPTERS, CHESTS, CLASSES, GEAR_RARITIES, GEAR_SLOTS, ITEMS, MATERIALS, MONSTERS, RECIPES, RELIC_RECIPE, SALVAGE } from '../content';
import { allChestOdds, compendiumData, toCompendiumEntries, type CompendiumEntry, type CompendiumKind } from './index';

const entries = toCompendiumEntries();
function entry(id: string): CompendiumEntry {
  const result = entries.find(e => e.id === id);
  expect(result, id).toBeDefined();
  return result!;
}
const link = (from: string, to: string, rel: string) => {
  expect(entry(from).links).toContainEqual({ id: to, kind: entry(to).kind, rel });
};

describe('Compendium registry adapter', () => {
  it('snapshots counts for all eight kinds and preserves every source ID', () => {
    const counts: Record<CompendiumKind, number> = { class: 0, monster: 0, boss: 0, gear: 0, material: 0, recipe: 0, relic: 0, chapter: 0 };
    for (const e of entries) counts[e.kind]++;
    expect(counts).toMatchInlineSnapshot(`
      {
        "boss": 5,
        "chapter": 5,
        "class": 7,
        "gear": 155,
        "material": 7,
        "monster": 20,
        "recipe": 6,
        "relic": 4,
      }
    `);
    const expectedIds = [...CLASSES, ...MONSTERS, ...ITEMS, ...MATERIALS, ...RECIPES, RELIC_RECIPE, ...CHAPTERS].map(e => e.id)
      .concat(RARITIES.map(r => `relic:${r.relicId}`));
    expect(entries.map(e => e.id).sort()).toEqual(expectedIds.sort());
    expect(new Set(entries.map(e => e.id)).size).toBe(entries.length);
  });

  it('retains every original name and uses IDs only where recipe names are absent', () => {
    for (const def of [...CLASSES, ...MONSTERS, ...ITEMS, ...MATERIALS, ...CHAPTERS]) expect(entry(def.id).name).toBe(def.name);
    for (const recipe of [...RECIPES, RELIC_RECIPE]) {
      expect(entry(recipe.id).name).toBe(recipe.id);
      expect(entry(recipe.id).iconKey).toBeNull();
      expect(entry(recipe.id).missingFacts.join(' ')).toContain('no display name');
    }
    expect(RARITIES.map(r => entry(`relic:${r.relicId}`).name)).toEqual(['Paw Charm', 'Silver Bell', 'Moon Collar', 'Golden Maneki']);
  });

  it('resolves every relationship with the correct kind and no duplicate/self links', () => {
    for (const e of entries) {
      expect(e.links.length, e.id).toBeGreaterThan(0);
      expect(new Set(e.links.map(l => `${l.id}/${l.rel}`)).size).toBe(e.links.length);
      for (const linked of e.links) {
        expect(linked.id).not.toBe(e.id);
        expect(entry(linked.id).kind).toBe(linked.kind);
        expect(entry(linked.id).links.some(reverse => reverse.id === e.id)).toBe(true);
      }
      if (e.unlock?.kind === 'chapter') expect(entry(e.unlock.chapterId).kind).toBe('chapter');
      if (e.unlock?.kind === 'previous-boss') expect(entry(e.unlock.bossId).kind).toBe('boss');
      if (e.unlock?.kind === 'recipe') expect(entry(e.unlock.recipeId).kind).toBe('recipe');
    }
  });

  it('maps starter weapons, class families, chapter rosters and drop eligibility exactly', () => {
    for (const cls of CLASSES) {
      link(cls.id, cls.starterWeaponId, 'starter weapon');
      link(cls.starterWeaponId, cls.id, 'starter for');
      expect(entry(cls.id).links.filter(l => l.rel === 'class weapon').map(l => l.id)).toEqual(ITEMS.filter(i => i.weaponType === cls.weaponType).map(i => i.id));
    }
    for (const ch of CHAPTERS) {
      expect(entry(ch.id).links.filter(l => l.rel === 'encounter').map(l => l.id)).toEqual([...ch.regulars, ch.elite, ch.boss]);
      expect(entry(ch.id).stats).toEqual({ index: ch.index, killsPerRound: ch.killsPerRound, roundsPerChapter: ch.roundsPerChapter,
        firstStage: stageOf(ch.index, 1), lastStage: stageOf(ch.index, ch.roundsPerChapter) });
      for (const id of [ch.id, ch.boss]) expect(entry(id).sources.filter(s => s.kind === 'chest').map(s => s.ref)).toEqual(Object.values(ch.chests));
      expect(entry(ch.id).unlock).toEqual(ch.index === 1 ? null : { kind: 'previous-boss', bossId: CHAPTERS[ch.index - 2]!.boss });
    }
    for (const item of ITEMS) expect(entry(item.id).links.filter(l => l.rel === 'drop chapter').map(l => l.id))
      .toEqual(CHAPTERS.filter(ch => item.dropChapters.includes(ch.index)).map(ch => ch.id));
  });

  it('reads class multipliers and real boss overrides; leaves monster stage totals unspecified', () => {
    for (const c of CLASSES) expect(entry(c.id).stats).toEqual({ multipliers: c.stats, attackIntervalMs: c.attackIntervalMs,
      critChance: c.critChance, critMultiplier: c.critMultiplier, dodge: c.dodge, passive: c.passive });
    for (const monster of MONSTERS) {
      if (monster.kind === 'boss') {
        const { id: _id, ...stats } = bossOfChapter(monster.chapter);
        expect(entry(monster.id).stats).toEqual({ ...stats, stage: stageOf(monster.chapter, CHAPTERS[monster.chapter - 1]!.roundsPerChapter) });
      } else {
        expect(entry(monster.id).kind).toBe('monster');
        expect(entry(monster.id).stats).toEqual({ hpMul: monster.hpMul, atkMul: monster.atkMul, xpMul: monster.xpMul, lootMul: monster.lootMul });
      }
      expect(entry(monster.id).rarity).toBeNull();
    }
  });

  it('retains gear base stats, rarity multipliers and real equipment slot unlocks', () => {
    for (const item of ITEMS) {
      const r = GEAR_RARITIES.find(r => r.id === item.rarity)!;
      expect(entry(item.id).stats).toEqual({ baseStats: item.baseStats, statMultiplier: r.statMultiplier, bonusLines: r.bonusLines, maxLevel: r.maxLevel });
      expect(entry(item.id).rarity).toBe(item.rarity);
      expect(entry(item.id).unlock).toEqual({ kind: 'equip-level', level: GEAR_SLOTS.find(s => s.id === item.slot)!.unlockLevel });
    }
  });

  it('links every recipe cost/output and salvage return without inventing relic cost fields', () => {
    for (const r of RECIPES) {
      expect(entry(r.id).stats).toEqual({ materials: r.materials, fish: r.fish, perDay: null });
      expect(entry(r.id).links.filter(l => l.rel === 'can craft').map(l => l.id)).toEqual(ITEMS.filter(i => i.rarity === r.rarity).map(i => i.id));
    }
    expect(entry(RELIC_RECIPE.id).stats).toEqual({ materials: RELIC_RECIPE.materials, fish: null, perDay: RELIC_RECIPE.perDay });
    for (const r of [...RECIPES, RELIC_RECIPE]) for (const id of Object.keys(r.materials)) {
      link(r.id, id, 'requires'); link(id, r.id, 'used by');
    }
    for (const s of SALVAGE) for (const id of Object.keys(s.materials)) for (const i of ITEMS.filter(i => i.rarity === s.rarity)) link(i.id, id, 'salvages into');
  });

  it('separates four pinned Relic tiers from the five gear tiers and publishes actual forge weights', () => {
    const total = Object.values(CONFIG.relic.rarityOddsBp).reduce((s, n) => s + n, 0);
    for (const r of RARITIES) {
      const e = entry(`relic:${r.relicId}`);
      expect(e.rarity).toBe(r.id);
      expect(e.stats).toEqual({ tokenId: r.relicId, rarityOddsBp: CONFIG.relic.rarityOddsBp[r.id] });
      expect(e.sources.find(s => s.kind === 'recipe')!.chancePct).toBe(CONFIG.relic.rarityOddsBp[r.id] / total * 100);
      link(e.id, RELIC_RECIPE.id, 'forged by');
    }
    expect(entries.filter(e => e.kind === 'relic' && e.rarity === 'uncommon')).toEqual([]);
  });

  it('resolves acquisition references and does not present contextual item chances as constants', () => {
    for (const e of entries) for (const src of e.sources) {
      if (src.kind === 'chest') expect(CHESTS[src.ref], src.ref).toBeDefined();
      if (src.kind === 'recipe') expect(entry(src.ref).kind).toBe('recipe');
      if (src.kind === 'starter') expect(entry(src.ref).kind).toBe('class');
      if (src.kind === 'monster') expect(entry(src.ref).kind).toBe('monster');
      if (src.chancePct !== null) { expect(src.chancePct).toBeGreaterThanOrEqual(0); expect(src.chancePct).toBeLessThanOrEqual(100); }
    }
    for (const e of entries.filter(e => e.kind === 'gear')) {
      expect(e.sources.some(s => s.kind === 'chest')).toBe(true);
      expect(e.sources.every(s => s.chancePct === null)).toBe(true);
    }
    const pearls = entry('moonPearl').sources.filter(s => s.kind === 'chest');
    expect(pearls).toHaveLength(CHAPTERS.length * 2);
    for (const pearl of pearls) expect(pearl.chancePct).toBeCloseTo(pearl.ref.endsWith('.first') ? 100 : 30, 12);
    for (const item of ITEMS) {
      const group = GEAR_SLOTS.find(slot => slot.id === item.slot)!.group;
      const expectedChests = Object.values(allChestOdds()).filter(chest =>
        item.dropChapters.includes(CHAPTERS.find(ch => ch.id === chest.chapterId)!.index) &&
        chest.rolls.some(roll => roll.group === group && roll.rarities.some(row => row.rarity === item.rarity && row.weight > 0))
      ).map(chest => chest.chestId);
      expect(entry(item.id).sources.filter(s => s.kind === 'chest').map(s => s.ref)).toEqual(expectedChests);
    }
    expect(entry('starlightScale').sources.filter(s => s.kind === 'chest').every(s => !s.ref.includes('ch1') && !s.ref.includes('ch2'))).toBe(true);
    for (const material of MATERIALS) {
      expect(entry(material.id).stats).toEqual({ tier: material.tier, maxStack: material.maxStack });
      const expectedMonsters = V2_CONFIG.idle.materialDrops.filter(d => d.id === material.id).flatMap(d => MONSTERS.filter(m => m.kind !== 'boss' && m.chapter >= d.fromChapter && (!d.eliteOnly || m.kind === 'elite')).map(m => m.id));
      expect(entry(material.id).sources.filter(s => s.kind === 'monster').map(s => s.ref)).toEqual(expectedMonsters);
    }
  });

  it('returns deterministic deeply frozen copies without freezing or mutating source registries', () => {
    const before = JSON.stringify({ CLASSES, ITEMS, CHAPTERS, CHESTS, RECIPES, MATERIALS });
    const result = compendiumData();
    expect(result).toEqual(compendiumData());
    const walk = (value: unknown): void => {
      if (value && typeof value === 'object') { expect(Object.isFrozen(value)).toBe(true); Object.values(value).forEach(walk); }
    };
    walk(result);
    expect(Object.isFrozen(ITEMS[0]!.baseStats)).toBe(false);
    expect(Object.isFrozen(CLASSES[0]!.passive)).toBe(false);
    expect(JSON.stringify({ CLASSES, ITEMS, CHAPTERS, CHESTS, RECIPES, MATERIALS })).toBe(before);
    const gear = result.entries.find(e => e.kind === 'gear');
    expect(gear?.stats.baseStats).not.toBe(ITEMS[0]!.baseStats);
    expect(() => Object.assign(gear!.stats.baseStats, { atk: -1 })).toThrow(TypeError);
  });
});
