import { CHAPTERS, type ChapterDef } from './chapters';
import { CHESTS, type ChestReward, type LootRegistry } from './chests';
import { CLASSES, WEAPON_TYPES, type ClassDef, type WeaponProfile } from './classes';
import { ITEMS, type ItemDef } from './items';
import { MATERIALS, type MaterialDef } from './materials';
import { MONSTERS, type MonsterDef } from './monsters';
import { GEAR_RARITIES, type GearRarityDef } from './rarities';
import { RECIPES, SALVAGE, type MaterialCost, type RecipeDef, type SalvageDef } from './recipes';
import { GEAR_SLOTS, type GearSlotDef } from './slots';
import { BONUS_LINE_RANGES, STATS, type StatDef } from './stats';

/** Everything validateContent() checks. Tests pass a modified copy to check one change. */
export interface ContentRegistry {
  classes: readonly ClassDef[];
  weaponTypes: readonly WeaponProfile[];
  slots: readonly GearSlotDef[];
  rarities: readonly GearRarityDef[];
  stats: readonly StatDef[];
  bonusLineRanges: typeof BONUS_LINE_RANGES;
  items: readonly ItemDef[];
  materials: readonly MaterialDef[];
  monsters: readonly MonsterDef[];
  chapters: readonly ChapterDef[];
  chests: LootRegistry<ChestReward>;
  recipes: readonly RecipeDef[];
  salvage: readonly SalvageDef[];
}

export const CONTENT: ContentRegistry = {
  classes: CLASSES,
  weaponTypes: WEAPON_TYPES,
  slots: GEAR_SLOTS,
  rarities: GEAR_RARITIES,
  stats: STATS,
  bonusLineRanges: BONUS_LINE_RANGES,
  items: ITEMS,
  materials: MATERIALS,
  monsters: MONSTERS,
  chapters: CHAPTERS,
  chests: CHESTS,
  recipes: RECIPES,
  salvage: SALVAGE,
};

/** Ids of stored content (items, classes, slots, monsters, chests...): lowercase words and dots. */
export const STORED_ID = /^[a-z0-9.]+$/;
/** Stat and material ids are camelCase code keys (fluffTuft, critChance), as named in the plan. */
export const CODE_KEY = /^[a-z][a-zA-Z0-9]*$/;

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Returns a list of problems; [] means the registry is consistent. */
export function validateContent(c: ContentRegistry = CONTENT): string[] {
  const errs: string[] = [];
  const err = (m: string) => errs.push(m);

  const uniq = (what: string, ids: readonly string[], pattern = STORED_ID) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (!pattern.test(id)) err(`${what} id "${id}" does not match ${pattern}`);
      if (seen.has(id)) err(`duplicate ${what} id "${id}"`);
      seen.add(id);
    }
    return seen;
  };

  const weaponTypes = uniq('weapon type', c.weaponTypes.map((w) => w.id));
  uniq('class', c.classes.map((x) => x.id));
  uniq('slot', c.slots.map((s) => s.id));
  const rarityIds = uniq('rarity', c.rarities.map((r) => r.id));
  const statIds = uniq('stat', c.stats.map((s) => s.id), CODE_KEY);
  uniq('item', c.items.map((i) => i.id));
  const materialIds = uniq('material', c.materials.map((m) => m.id), CODE_KEY);
  uniq('monster', c.monsters.map((m) => m.id));
  uniq('chapter', c.chapters.map((x) => x.id));
  uniq('recipe', c.recipes.map((r) => r.id));

  const items = new Map(c.items.map((i) => [i.id, i]));
  const monsters = new Map(c.monsters.map((m) => [m.id, m]));
  const slots = new Map(c.slots.map((s) => [s.id, s]));
  const stats = new Map(c.stats.map((s) => [s.id, s]));
  const chapterIndexes = new Set(c.chapters.map((x) => x.index));

  // Weapon profiles.
  for (const w of c.weaponTypes) {
    if (!isNum(w.windupMs) || w.windupMs < 0) err(`weapon ${w.id}: bad windupMs`);
    if (w.hitAtMs.length === 0 || w.hitAtMs.some((t) => !isNum(t) || t < 0)) err(`weapon ${w.id}: bad hitAtMs`);
    if (w.projectile && (!isNum(w.projectile.travelMs) || w.projectile.travelMs <= 0)) err(`weapon ${w.id}: bad projectile`);
  }

  // Rarities: ascending and sane.
  c.rarities.forEach((r, i) => {
    const prev = c.rarities[i - 1];
    if (!isNum(r.statMultiplier) || r.statMultiplier <= 0) err(`rarity ${r.id}: bad statMultiplier`);
    if (!Number.isInteger(r.bonusLines) || r.bonusLines < 0) err(`rarity ${r.id}: bad bonusLines`);
    if (!Number.isInteger(r.maxLevel) || r.maxLevel < 1) err(`rarity ${r.id}: bad maxLevel`);
    if (prev && (r.statMultiplier <= prev.statMultiplier || r.maxLevel < prev.maxLevel)) err(`rarity ${r.id}: not above ${prev.id}`);
  });

  // Stats and bonus lines.
  for (const s of c.stats) {
    const ranges = c.bonusLineRanges[s.id];
    if (s.bonusLine && !ranges) err(`stat ${s.id}: bonus line stat without roll ranges`);
    if (!s.bonusLine && ranges) err(`stat ${s.id}: roll ranges for a stat that cannot roll`);
  }
  for (const [stat, ranges] of Object.entries(c.bonusLineRanges)) {
    if (!statIds.has(stat)) err(`bonus line ranges for unknown stat ${stat}`);
    for (const r of c.rarities) {
      const range = ranges?.[r.id];
      if (!range) err(`stat ${stat}: no roll range for ${r.id}`);
      else if (!isNum(range[0]) || !isNum(range[1]) || range[0] < 0 || range[0] > range[1]) err(`stat ${stat}/${r.id}: bad range`);
    }
  }

  // Slots.
  for (const s of c.slots) {
    if (!Number.isInteger(s.unlockLevel) || s.unlockLevel < 1) err(`slot ${s.id}: bad unlockLevel`);
    if (s.group === 'main' && s.primaryStats.length === 0) err(`slot ${s.id}: main slot without primary stats`);
    for (const st of s.primaryStats) if (!statIds.has(st)) err(`slot ${s.id}: unknown stat ${st}`);
  }

  // Classes.
  for (const k of c.classes) {
    if (!weaponTypes.has(k.weaponType)) err(`class ${k.id}: unknown weapon type ${k.weaponType}`);
    for (const v of [k.stats.hp, k.stats.atk, k.stats.def, k.attackIntervalMs, k.critMultiplier])
      if (!isNum(v) || v <= 0) err(`class ${k.id}: stats and attackIntervalMs must be > 0`);
    for (const v of [k.critChance, k.dodge]) if (!isNum(v) || v < 0 || v >= 1) err(`class ${k.id}: chance outside [0, 1)`);
    const starter = items.get(k.starterWeaponId);
    if (!starter) err(`class ${k.id}: starter weapon ${k.starterWeaponId} not found`);
    else if (starter.slot !== 'weapon' || starter.weaponType !== k.weaponType || starter.rarity !== 'common')
      err(`class ${k.id}: starter weapon must be a common ${k.weaponType}`);
    for (const v of Object.values(k.passive.params)) if (!isNum(v) || v < 0) err(`class ${k.id}: bad passive param`);
  }

  // Items.
  for (const it of c.items) {
    const slot = slots.get(it.slot);
    if (!slot) err(`item ${it.id}: unknown slot ${it.slot}`);
    if (!rarityIds.has(it.rarity)) err(`item ${it.id}: unknown rarity ${it.rarity}`);
    if (!rarityIds.has(it.visual.palette)) err(`item ${it.id}: unknown palette ${it.visual.palette}`);
    if (!it.visual.set) err(`item ${it.id}: no visual set`);
    if (it.slot === 'weapon' ? !it.weaponType || !weaponTypes.has(it.weaponType) : it.weaponType !== undefined)
      err(`item ${it.id}: weaponType must be set exactly on weapons`);
    const keys = Object.keys(it.baseStats);
    if (keys.length === 0) err(`item ${it.id}: no base stats`);
    for (const [st, v] of Object.entries(it.baseStats)) {
      const def = stats.get(st as StatDef['id']);
      if (!def) err(`item ${it.id}: unknown stat ${st}`);
      else if (slot?.group === 'accessory' && def.kind === 'flat') err(`item ${it.id}: accessories carry secondary stats only`);
      if (!isNum(v) || v <= 0) err(`item ${it.id}: stat ${st} must be > 0`);
    }
    for (const st of slot?.primaryStats ?? []) if (!keys.includes(st)) err(`item ${it.id}: missing primary stat ${st}`);
    if (it.dropChapters.length === 0) err(`item ${it.id}: drops nowhere`);
    for (const ch of it.dropChapters) if (!chapterIndexes.has(ch)) err(`item ${it.id}: unknown chapter ${ch}`);
  }
  // Every chapter can drop every slot x rarity (and every weapon type x rarity).
  for (const ch of c.chapters) {
    const here = c.items.filter((i) => i.dropChapters.includes(ch.index));
    for (const r of c.rarities) {
      for (const s of c.slots)
        if (s.id !== 'weapon' && !here.some((i) => i.slot === s.id && i.rarity === r.id)) err(`chapter ${ch.id}: no ${r.id} ${s.id} drops`);
      for (const w of c.weaponTypes)
        if (!here.some((i) => i.weaponType === w.id && i.rarity === r.id)) err(`chapter ${ch.id}: no ${r.id} ${w.id} drops`);
    }
  }

  // Materials.
  for (const m of c.materials) if (!Number.isInteger(m.maxStack) || m.maxStack < 1) err(`material ${m.id}: bad maxStack`);

  // Monsters and chapters.
  for (const m of c.monsters) {
    if (!chapterIndexes.has(m.chapter)) err(`monster ${m.id}: unknown chapter ${m.chapter}`);
    for (const v of [m.hpMul, m.atkMul, m.xpMul]) if (!isNum(v) || v <= 0) err(`monster ${m.id}: multipliers must be > 0`);
    if (!isNum(m.lootMul) || m.lootMul < 0) err(`monster ${m.id}: bad lootMul`);
  }
  const kindOf = (id: string, kind: MonsterDef['kind'], ch: ChapterDef) => {
    const m = monsters.get(id);
    if (!m) err(`chapter ${ch.id}: monster ${id} not found`);
    else if (m.kind !== kind) err(`chapter ${ch.id}: ${id} is not a ${kind}`);
  };
  c.chapters.forEach((ch, i) => {
    if (ch.index !== i + 1) err(`chapter ${ch.id}: index must be ${i + 1}`);
    if (ch.regulars.length === 0) err(`chapter ${ch.id}: no regular monsters`);
    ch.regulars.forEach((id) => kindOf(id, 'regular', ch));
    kindOf(ch.elite, 'elite', ch);
    kindOf(ch.boss, 'boss', ch);
    if (!Number.isInteger(ch.killsPerRound) || ch.killsPerRound < 1) err(`chapter ${ch.id}: bad killsPerRound`);
    if (!Number.isInteger(ch.roundsPerChapter) || ch.roundsPerChapter < 1) err(`chapter ${ch.id}: bad roundsPerChapter`);
    if (!c.chests[ch.chests.firstClear]) err(`chapter ${ch.id}: chest ${ch.chests.firstClear} not found`);
    if (!c.chests[ch.chests.repeat]) err(`chapter ${ch.id}: chest ${ch.chests.repeat} not found`);
  });

  // Chests: shape, references, no cycles.
  for (const [key, table] of Object.entries(c.chests)) {
    if (table.id !== key) err(`chest ${key}: id ${table.id} does not match its key`);
    if (!STORED_ID.test(key)) err(`chest id "${key}" does not match ${STORED_ID}`);
    table.lines.forEach((line, li) => {
      const where = `chest ${key} line ${li}`;
      if (!isNum(line.chance) || line.chance < 0 || line.chance > 1) err(`${where}: chance outside 0..1`);
      const [min, max] = line.count;
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || min > max) err(`${where}: bad count`);
      if (line.pick.length === 0) err(`${where}: empty pick list`);
      for (const e of line.pick) {
        if (!isNum(e.weight) || e.weight <= 0) err(`${where}: weight must be > 0`);
        const v = e.value;
        if ('table' in v) {
          if (!c.chests[v.table]) err(`${where}: unknown table ${v.table}`);
        } else if (v.kind === 'material') {
          if (!materialIds.has(v.id)) err(`${where}: unknown material ${v.id}`);
        } else if (v.kind === 'gear') {
          if (!rarityIds.has(v.rarity)) err(`${where}: unknown rarity ${v.rarity}`);
        }
        if (!('table' in v) && v.kind !== 'gear' && (!Number.isInteger(v.amount) || v.amount < 1)) err(`${where}: bad amount`);
      }
    });
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      err(`chest ${id}: nested table cycle`);
      return;
    }
    visiting.add(id);
    for (const line of c.chests[id]?.lines ?? [])
      for (const e of line.pick) if ('table' in e.value && c.chests[e.value.table]) visit(e.value.table);
    visiting.delete(id);
    done.add(id);
  };
  Object.keys(c.chests).forEach(visit);

  // Recipes and salvage: known materials, salvage worth less than the recipe.
  const costOk = (where: string, cost: MaterialCost) => {
    for (const [m, n] of Object.entries(cost)) {
      if (!materialIds.has(m)) err(`${where}: unknown material ${m}`);
      if (!Number.isInteger(n) || (n ?? 0) < 1) err(`${where}: bad amount of ${m}`);
    }
  };
  for (const r of c.recipes) {
    if (!rarityIds.has(r.rarity)) err(`recipe ${r.id}: unknown rarity`);
    if (!Number.isInteger(r.fish) || r.fish < 0) err(`recipe ${r.id}: bad fish`);
    costOk(`recipe ${r.id}`, r.materials);
  }
  for (const s of c.salvage) {
    costOk(`salvage ${s.rarity}`, s.materials);
    const recipe = c.recipes.find((r) => r.rarity === s.rarity);
    if (!recipe) err(`salvage ${s.rarity}: no recipe for that rarity`);
    else if ((s.materials.yarn ?? 0) >= (recipe.materials.yarn ?? 0)) err(`salvage ${s.rarity}: returns as much Yarn as crafting costs`);
  }
  for (const r of c.rarities) if (!c.salvage.some((s) => s.rarity === r.id)) err(`rarity ${r.id}: no salvage row`);

  return errs;
}
