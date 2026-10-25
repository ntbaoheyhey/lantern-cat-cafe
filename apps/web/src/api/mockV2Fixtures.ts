import { v2 } from '@taskbar-hero/game-rules';

export const MOCK_V2_FIXTURE_KINDS = ['fresh', 'bossReadyStrong', 'bossReadyWeak', 'forgeRich', 'bagNearFull', 'midGame'] as const;
export type MockV2FixtureKind = (typeof MOCK_V2_FIXTURE_KINDS)[number];
export interface MockV2FixtureOptions {
  nowMs: number;
  classId?: v2.ClassId;
  /** Default 1; midGame uses at least chapter 2. */
  chapter?: number;
}
export interface MockV2Save {
  v: 1;
  state: v2.PlayerStateV2;
  lastClaimMs: number;
  counter: number;
  voucherNonce: number;
  founder: false;
}

function accept<T extends object>(result: v2.StateResultV2<T>): Extract<v2.StateResultV2<T>, { ok: true }> {
  if (!result.ok) throw new Error(`Fixture rule refused: ${result.code}`);
  return result;
}

function recipeStacks(recipes: readonly v2.RecipeDef[], times: number): v2.StacksV2 {
  const stacks: v2.StacksV2 = {};
  for (const recipe of recipes) {
    for (const [id, qty] of Object.entries({ ...recipe.materials, fish: recipe.fish }) as [v2.StateStackIdV2, number][]) {
      stacks[id] = (stacks[id] ?? 0) + times * qty;
    }
  }
  return stacks;
}

/** Let applyCraft construct owned rows, including their catalog metadata and bonus lines.
 * Search a fixed seed stream for each catalog design rather than inventing item objects.
 * The temporary crafting wallet and stage never become part of the fixture's progress.
 */
function catalogItem(state: v2.PlayerStateV2, definition: v2.ItemDef, level: number): v2.StateOwnedItemV2 {
  const recipe = v2.RECIPES.find(entry => entry.rarity === definition.rarity)!;
  const workshop = { ...state, items: [], bestStage: level, stacks: recipeStacks([recipe], 1) };
  for (let seed = 1; seed <= 1024; seed++) {
    const { item } = accept(v2.applyCraft(workshop, recipe.id, definition.slot, seed, 0));
    if (item.itemKey === definition.id) return item;
  }
  throw new Error(`No deterministic craft seed for ${definition.id}`);
}

export function mockV2Save(kind: MockV2FixtureKind, opts: MockV2FixtureOptions): MockV2Save {
  if (!Number.isFinite(opts.nowMs)) throw new RangeError('nowMs must be finite');
  if (!MOCK_V2_FIXTURE_KINDS.includes(kind)) throw new RangeError('Unknown fixture kind');
  const classId = opts.classId ?? 'warrior';
  const chosen = accept(v2.chooseClass(accept(v2.emptyState()).state, classId));
  let state = chosen.state;
  const insert = (item: v2.StateOwnedItemV2) => {
    const owned = { ...item, id: `fx:${kind}:${state.items.length}` };
    state = accept(v2.addItems(state, [owned], v2.V2_CONFIG.bag.limit, v2.salvage)).state;
    return owned.id;
  };
  const starterId = insert(chosen.starterWeapon!);
  state = accept(v2.equip(state, starterId, 'weapon')).state;

  if (kind === 'bossReadyStrong' || kind === 'bossReadyWeak' || kind === 'midGame') {
    const index = kind === 'midGame' ? Math.max(2, opts.chapter ?? 1) : opts.chapter ?? 1;
    const chapter = v2.CHAPTERS.find(entry => entry.index === index);
    if (!chapter) throw new RangeError('chapter must name a registered chapter');
    state.chapter = chapter.index;
    state.round = kind === 'midGame' ? Math.ceil(chapter.roundsPerChapter / 2) : chapter.roundsPerChapter;
    state.kills = kind === 'midGame' ? Math.floor(chapter.killsPerRound / 2) : chapter.killsPerRound;
    state.bestStage = v2.CHAPTERS.filter(entry => entry.index < index)
      .reduce((sum, entry) => sum + entry.roundsPerChapter, 0) + state.round - 1;
    state.stacks.catKey = v2.V2_CONFIG.boss.keyCost;
  }

  if (kind === 'bossReadyStrong' || kind === 'midGame') {
    state.level = kind === 'bossReadyStrong' ? v2.V2_CONFIG.cat.maxLevel : Math.min(20, v2.V2_CONFIG.cat.maxLevel);
    const weaponType = v2.CLASSES.find(entry => entry.id === classId)!.weaponType;
    const rarity = kind === 'bossReadyStrong' ? v2.GEAR_RARITIES.at(-1)! : v2.GEAR_RARITIES.find(entry => entry.id === 'rare')!;
    const candidates = v2.ITEMS.filter(item => item.rarity === rarity.id && item.dropChapters.includes(state.chapter)
      && (item.slot !== 'weapon' || item.weaponType === weaponType));
    // Select among all eligible catalog designs, then retain only the selected loadout.
    const original = state;
    const pool = candidates.map(def => catalogItem(original, def, Math.min(state.level, rarity.maxLevel)));
    const ids = pool.map(item => insert(item));
    const best = v2.bestLoadout({ classId, level: state.level }, state.items);
    for (const id of best.equip) {
      const item = state.items.find(entry => entry.id === id)!;
      state = accept(v2.equip(state, id, item.slot)).state;
    }
    // bestLoadout can leave a utility-only slot empty (no power gain). Fill those too.
    for (const slot of v2.GEAR_SLOTS.filter(entry => entry.unlockLevel <= state.level)) {
      if (state.items.some(item => item.slot === slot.id && item.equipped)) continue;
      const item = state.items.find(entry => ids.includes(entry.id) && entry.slot === slot.id)!;
      state = accept(v2.equip(state, item.id, slot.id)).state;
    }
    state.items = state.items.filter(item => item.equipped);
    if (kind === 'midGame') state.stacks = { ...recipeStacks(v2.RECIPES.slice(0, 2), 1), catKey: v2.V2_CONFIG.boss.keyCost * 2 };
  }

  if (kind === 'forgeRich') {
    const recipes = v2.RECIPES.filter(entry => entry.id === 'rcp.common' || entry.id === 'rcp.uncommon');
    state.stacks = recipeStacks(recipes, 2);
    for (let i = 0; i < 4; i++) {
      const id = insert(chosen.starterWeapon!);
      if (i === 3) state = accept(v2.lockItem(state, id, true)).state;
    }
  }
  if (kind === 'bagNearFull') {
    const count = Math.ceil(v2.V2_CONFIG.bag.limit * v2.V2_CONFIG.bag.nearFullRatio);
    while (state.items.length < count) insert(chosen.starterWeapon!);
  }
  return { v: 1, state, lastClaimMs: opts.nowMs, counter: 0, voucherNonce: 0, founder: false };
}

export function mockV2SaveJson(kind: MockV2FixtureKind, opts: MockV2FixtureOptions): string {
  return JSON.stringify(mockV2Save(kind, opts));
}
