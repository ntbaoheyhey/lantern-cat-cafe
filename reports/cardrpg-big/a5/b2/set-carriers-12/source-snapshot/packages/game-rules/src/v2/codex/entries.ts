import { CONFIG } from '../../config';
import { RARITIES } from '../../content';
import { V2_CONFIG } from '../config';
import { bossOfChapter, stageOf } from '../combat/stage';
import { CHAPTERS, CLASSES, GEAR_RARITIES, GEAR_SLOTS, ITEMS, MATERIALS, MONSTERS, RECIPES, RELIC_RECIPE, SALVAGE } from '../content';
import { chestDropRateRows } from '../lootcheck';
import { allChestOdds, exactOdds } from './odds';
import { RELIC_NAMES } from './relic-metadata';
import {
  readonlyCopy, type ClassEntry, type MonsterEntry, type BossEntry, type GearEntry,
  type MaterialEntry, type RecipeEntry, type RelicEntry, type ChapterEntry,
  type CompendiumEntry, type CompendiumKind, type CompendiumSource,
} from './types';

type MutableEntry = ClassEntry | MonsterEntry | BossEntry | GearEntry | MaterialEntry | RecipeEntry | RelicEntry | ChapterEntry;
const contentPath = 'packages/game-rules/src/v2/content/';
const rulePath = 'packages/game-rules/src/v2/';
const source = (kind: CompendiumSource['kind'], ref: string, note: string, chancePct: number | null = null): CompendiumSource => ({ kind, ref, chancePct, note });
const registry = (file: string, symbol: string): CompendiumSource => source('registry', `${contentPath}${file}.ts#${symbol}`, 'Content definition.');
const rule = (file: string, symbol: string, note: string): CompendiumSource => source('rule', `${rulePath}${file}.ts#${symbol}`, note);
const base = (id: string, name: string, summary: string, definition: CompendiumSource) => ({
  id, name, summary, iconKey: null, rarity: null, tags: [], sources: [definition], unlock: null, links: [], missingFacts: [],
});

/** Pure, lazy, detached snapshot. No gameplay writes, random draws, cache or player state. */
export function toCompendiumEntries(): readonly CompendiumEntry[] {
  const entries: MutableEntry[] = [];
  const odds = allChestOdds();
  const dropRows = chestDropRateRows();
  for (const cls of CLASSES) {
    entries.push({
      ...base(cls.id, cls.name, `${cls.range}; ${cls.weaponType}; ${cls.passive.id}.`, registry('classes', 'CLASSES')),
      kind: 'class', iconKey: cls.id, tags: [cls.weaponType, cls.range, cls.passive.id],
      stats: { multipliers: cls.stats, attackIntervalMs: cls.attackIntervalMs, critChance: cls.critChance,
        critMultiplier: cls.critMultiplier, dodge: cls.dodge, passive: cls.passive },
      missingFacts: ['HP, ATK and DEF here are class multipliers, not equipped character totals.'],
    });
  }
  for (const monster of MONSTERS) {
    const chapter = CHAPTERS.find(ch => ch.index === monster.chapter)!;
    const common = {
      ...base(monster.id, monster.name, `${monster.kind} in ${chapter.name}.`, registry('monsters', 'MONSTERS')),
      iconKey: monster.id, tags: [monster.kind, chapter.id],
      unlock: { kind: 'chapter' as const, chapterId: chapter.id },
    };
    if (monster.kind === 'boss') {
      const { hp, atk, def, attackIntervalMs } = bossOfChapter(monster.chapter);
      entries.push({ ...common, kind: 'boss',
        stats: { hp, atk, def, attackIntervalMs, stage: stageOf(monster.chapter, chapter.roundsPerChapter) },
        sources: [...common.sources, rule('combat/stage', 'bossOfChapter', 'Current chapter-end boss stats, including config overrides.'),
          source('chest', chapter.chests.firstClear, 'Reward table on first victory.'),
          source('chest', chapter.chests.repeat, 'Reward table on subsequent victories.')],
      });
    } else {
      entries.push({ ...common, kind: 'monster',
        stats: { hpMul: monster.hpMul, atkMul: monster.atkMul, xpMul: monster.xpMul, lootMul: monster.lootMul },
        sources: [...common.sources, rule('combat/stage', 'monsterAt', 'Absolute stats vary with the stage.')],
        missingFacts: ['No single absolute stat block: pass a stage to monsterAt.'],
      });
    }
  }
  for (const item of ITEMS) {
    const rarity = GEAR_RARITIES.find(r => r.id === item.rarity)!;
    const slot = GEAR_SLOTS.find(s => s.id === item.slot)!;
    const sources = [registry('items', 'ITEMS'),
      registry('rarities', 'GEAR_RARITIES'), registry('slots', 'GEAR_SLOTS'),
      rule('idle/drops', 'rollDrops', 'Per-item chance depends on monster lootMul, player level, class and the local candidate pool.'),
    ];
    for (const chest of Object.values(odds)) {
      const chapter = CHAPTERS.find(ch => ch.id === chest.chapterId)!;
      if (!item.dropChapters.includes(chapter.index)) continue;
      const roll = chest.rolls.find(r => r.group === slot.group);
      if (roll?.rarities.find(r => r.rarity === item.rarity)!.perChest.probability) {
        sources.push(source('chest', chest.chestId, 'Eligible catalog item; per-item odds depend on level, class and slot selection. See separate rarity odds.'));
      }
    }
    for (const recipe of RECIPES.filter(r => r.rarity === item.rarity)) {
      sources.push(source('recipe', recipe.id, 'Player chooses the slot; weapon type follows the class. Candidate item is rolled uniformly.'));
    }
    for (const cls of CLASSES.filter(c => c.starterWeaponId === item.id)) {
      sources.push(source('starter', cls.id, 'Starter weapon for this class.'));
    }
    entries.push({
      ...base(item.id, item.name, `${item.rarity} ${item.slot}${item.weaponType ? ` (${item.weaponType})` : ''}. Base stats before rarity and level scaling.`, sources[0]!),
      kind: 'gear', iconKey: item.id, rarity: item.rarity,
      stats: { baseStats: item.baseStats, statMultiplier: rarity.statMultiplier, bonusLines: rarity.bonusLines, maxLevel: rarity.maxLevel },
      tags: [item.slot, item.visual.set, ...(item.weaponType ? [item.weaponType] : [])],
      sources, unlock: { kind: 'equip-level', level: slot.unlockLevel },
      missingFacts: ['No universal per-item drop chance without player class and level; rolled bonus lines are not fixed stats.'],
    });
  }
  for (const material of MATERIALS) {
    const sources = [registry('materials', 'MATERIALS')];
    for (const row of dropRows.filter(row => row.reward === material.name && row.dropChance > 0)) {
      sources.push(source('chest', row.tableId, 'Chance of at least one material from the chest table; quantity is a separate roll.', row.dropChance * 100));
    }
    for (const drop of V2_CONFIG.idle.materialDrops.filter(drop => drop.id === material.id)) {
      for (const monster of MONSTERS.filter(m => m.kind !== 'boss' && m.chapter >= drop.fromChapter && (!drop.eliteOnly || m.kind === 'elite'))) {
        sources.push(source('monster', monster.id, `Per-kill chance = clamp(${drop.chance} × lootMul × (1 + materialFind), 0, 1). Player-dependent.`));
      }
    }
    if (material.id === 'yarn') sources.push(rule('idle/claim', 'computeClaimV2', 'Yarn accrues per kill from stage scaling and lootMul, then is floored per claim; not a drop trial.'));
    if (material.id === 'catKey') {
      sources.push(rule('idle/claim', 'computeClaimV2', `Daily grant: ${V2_CONFIG.idle.dailyKeys}, limited by stack capacity.`),
        rule('idle/drops', 'rollDrops', `Cleared-chapter per-kill chance: ${V2_CONFIG.idle.clearedChapterKeyChance}; limited by stack capacity.`));
      if (V2_CONFIG.boss.firstClearKeys > 0) sources.push(rule('view/chest', 'rollChestV2', 'Additional first-clear keys from config, outside the chest loot table.'));
    }
    const salvageRarities = SALVAGE.filter(s => (s.materials[material.id] ?? 0) > 0).map(s => s.rarity);
    if (salvageRarities.length) sources.push(source('registry', `${contentPath}recipes.ts#SALVAGE`, `Salvage returns from: ${salvageRarities.join(', ')}.`));
    entries.push({ ...base(material.id, material.name, `Material; stack cap ${material.maxStack}.`, sources[0]!),
      kind: 'material', iconKey: material.id, stats: { tier: material.tier, maxStack: material.maxStack },
      tags: [String(material.tier)], sources,
      missingFacts: ['Material tier is not a gear rarity; no material rarity is defined.'],
    });
  }
  for (const recipe of RECIPES) entries.push({
    ...base(recipe.id, recipe.id, `Forge ${recipe.rarity} gear; the player chooses a slot.`, registry('recipes', 'RECIPES')),
    kind: 'recipe', rarity: recipe.rarity, stats: { materials: recipe.materials, fish: recipe.fish, perDay: null },
    tags: ['gear', recipe.rarity], missingFacts: ['Recipe has no display name or icon in the registry; name is its stable ID.'],
  });
  entries.push({
    ...base(RELIC_RECIPE.id, RELIC_RECIPE.id, 'Daily Relic forge.', registry('recipes', 'RELIC_RECIPE')),
    kind: 'recipe', stats: { materials: RELIC_RECIPE.materials, fish: null, perDay: RELIC_RECIPE.perDay }, tags: ['relic'],
    missingFacts: ['Recipe has no display name, icon or fish field in the registry; null does not invent a cost.'],
  });
  const relicTotal = RARITIES.reduce((sum, r) => sum + CONFIG.relic.rarityOddsBp[r.id], 0);
  for (const relic of RARITIES) {
    const name = RELIC_NAMES[relic.relicId];
    if (!name) throw new Error(`Missing existing Relic metadata name for token ${relic.relicId}`);
    entries.push({
      ...base(`relic:${relic.relicId}`, name, `${relic.id} Relic; token ID ${relic.relicId}.`, source('registry', 'packages/game-rules/src/content.ts#RARITIES', 'Pinned on-chain tier/token ID.')),
      kind: 'relic', rarity: relic.id, iconKey: `relic:${relic.relicId}`,
      stats: { tokenId: relic.relicId, rarityOddsBp: CONFIG.relic.rarityOddsBp[relic.id] }, tags: ['relic', relic.id],
      sources: [source('registry', 'packages/game-rules/src/content.ts#RARITIES', 'Pinned on-chain tier/token ID.'),
        source('metadata', `apps/web/public/relics/${relic.relicId}.json`, 'Existing first-party display name.'),
        source('rule', 'packages/game-rules/src/config.ts#CONFIG', 'Relic rarity weights in basis points.'),
        source('recipe', RELIC_RECIPE.id, 'Conditional on an allowed Relic forge.', exactOdds(CONFIG.relic.rarityOddsBp[relic.id] / relicTotal).chancePct)],
      unlock: { kind: 'recipe', recipeId: RELIC_RECIPE.id },
      missingFacts: ['The Relic tier registry defines no combat stats.'],
    });
  }
  for (const chapter of CHAPTERS) {
    const previous = CHAPTERS.find(ch => ch.index === chapter.index - 1);
    entries.push({ ...base(chapter.id, chapter.name, `Chapter ${chapter.index}; ${chapter.roundsPerChapter} rounds.`, registry('chapters', 'CHAPTERS')),
      kind: 'chapter', iconKey: chapter.background, tags: [chapter.id],
      sources: [registry('chapters', 'CHAPTERS'),
        source('chest', chapter.chests.firstClear, 'First-clear boss reward table.'),
        source('chest', chapter.chests.repeat, 'Repeat boss reward table.')],
      stats: { index: chapter.index, killsPerRound: chapter.killsPerRound, roundsPerChapter: chapter.roundsPerChapter,
        firstStage: stageOf(chapter.index, 1), lastStage: stageOf(chapter.index, chapter.roundsPerChapter) },
      unlock: previous ? { kind: 'previous-boss', bossId: previous.boss } : null,
    });
  }

  const byId = new Map(entries.map(entry => [entry.id, entry]));
  if (byId.size !== entries.length) throw new Error('Duplicate Compendium ID');
  const connect = (from: string, to: string, rel: string, reverse: string): void => {
    const a = byId.get(from), b = byId.get(to);
    if (!a || !b) throw new Error(`Unresolved Compendium link: ${from} -> ${to}`);
    const add = (entry: MutableEntry, kind: CompendiumKind, id: string, relation: string): void => {
      if (!entry.links.some(link => link.id === id && link.rel === relation)) entry.links.push({ kind, id, rel: relation });
    };
    add(a, b.kind, b.id, rel); add(b, a.kind, a.id, reverse);
  };
  for (const cls of CLASSES) {
    connect(cls.id, cls.starterWeaponId, 'starter weapon', 'starter for');
    for (const item of ITEMS.filter(item => item.weaponType === cls.weaponType)) connect(cls.id, item.id, 'class weapon', 'weapon for');
  }
  for (const chapter of CHAPTERS) {
    for (const id of [...chapter.regulars, chapter.elite, chapter.boss]) connect(chapter.id, id, 'encounter', 'found in');
    for (const item of ITEMS.filter(item => item.dropChapters.includes(chapter.index))) connect(item.id, chapter.id, 'drop chapter', 'gear pool');
  }
  for (const recipe of [...RECIPES, RELIC_RECIPE]) {
    for (const id of Object.keys(recipe.materials)) connect(recipe.id, id, 'requires', 'used by');
    if ('rarity' in recipe) {
      for (const item of ITEMS.filter(item => item.rarity === recipe.rarity)) connect(recipe.id, item.id, 'can craft', 'crafted by');
    } else {
      for (const relic of RARITIES) connect(recipe.id, `relic:${relic.relicId}`, 'can forge', 'forged by');
    }
  }
  for (const material of entries.filter(entry => entry.kind === 'material')) {
    for (const src of material.sources) {
      if (src.kind === 'monster') connect(material.id, src.ref, 'drops from', 'drops');
      if (src.kind === 'chest') connect(material.id, odds[src.ref]!.chapterId, 'chest reward in', 'chest material');
    }
    for (const salvage of SALVAGE.filter(s => (s.materials[material.id as keyof typeof s.materials] ?? 0) > 0)) {
      for (const item of ITEMS.filter(item => item.rarity === salvage.rarity)) connect(item.id, material.id, 'salvages into', 'salvaged from');
    }
  }
  return readonlyCopy(entries);
}
