import { CONFIG } from '@taskbar-hero/game-rules';
import { AFFIXES, BOSSES, ENCOUNTERS, SETS, SLOTS, cafeQuests, createCafe, type CafeState } from '@taskbar-hero/game-rules/client/cafe';

export const CAFE_SAVE_KEY = 'taskbar-hero:cafe-sample:1';
export type CafeSave = { state: CafeState; lastSeen: number };
const object = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const member = (x: unknown, values: readonly unknown[]) => values.includes(x);

/** Validate every persisted field consumed by the UI/reducer. Invalid saves never reach gameplay. */
export function parseCafeSave(raw: string | null): CafeSave | null {
  try {
    const data: unknown = JSON.parse(raw ?? 'null'); if (!object(data) || !count(data.lastSeen) || !object(data.state)) return null;
    const s = data.state, C = CONFIG.cafe;
    const numeric = ['version', 'seed', 'rngStep', 'seconds', 'chapter', 'tier', 'patches', 'xp', 'tours', 'insight', 'nextEncounterAt', 'encounters', 'lucky', 'losses', 'retryAt', 'crafts', 'counters', 'perfects'];
    if (!numeric.every(k => count(s[k])) || s.version !== C.version || !member(s.chapter, BOSSES.map((_, i) => i + 1)) || !C.tiers[s.tier as number]) return null;
    if ((s.patches as number) > C.maxPatches || (s.insight as number) > C.maxInsight || (s.lucky as number) > C.luckyCapPerTour) return null;
    if (!member(s.mastery, ['bold', 'gentle', 'curious']) || typeof s.assist !== 'boolean') return null;
    if (!Array.isArray(s.inventory) || s.inventory.length > C.maxItems || !s.inventory.every(i => object(i) && typeof i.id === 'string' &&
      member(i.slot, SLOTS) && member(i.set, SETS) && member(i.affix, AFFIXES) && member(i.quality, ['plain', 'fine', 'bright']) &&
      count(i.level) && i.level <= C.gear.maxLevel && count(i.misses) && i.misses <= C.forge.pityMisses && member(i.chapter, BOSSES.map((_, n) => n + 1)))) return null;
    const items = s.inventory as CafeState['inventory']; if (new Set(items.map(i => i.id)).size !== items.length) return null;
    const kit = (k: unknown) => object(k) && SLOTS.every(slot => items.some(i => i.slot === slot && i.id === k[slot]));
    if (!kit(s.equipped) || !object(s.loadouts) || !Object.entries(s.loadouts).every(([name, k]) => member(name, ['A', 'B']) && kit(k))) return null;
    const unique = (x: unknown, valid: (v: unknown) => boolean) => Array.isArray(x) && new Set(x).size === x.length && x.every(valid);
    const codex = [...BOSSES.flatMap((_, i) => [...ENCOUNTERS, 'boss'].map(k => `${i + 1}:${k}`)), ...SETS.flatMap(set => SLOTS.map(slot => `gear:${set}:${slot}`))];
    if (!unique(s.discovered, x => member(x, codex)) || !unique(s.clears, x => member(x, BOSSES.map((_, i) => i + 1))) ||
      !unique(s.claimed, x => member(x, cafeQuests(createCafe()).map(q => q.id)))) return null;
    if (!Array.isArray(s.events) || s.events.length > C.maxLog || !s.events.every(e => object(e) && count(e.at) &&
      member(e.kind, ['reward', 'decision', 'boss', 'craft', 'goal', 'return']) && typeof e.text === 'string')) return null;
    if (s.encounter !== null && (!object(s.encounter) || !member(s.encounter.kind, ENCOUNTERS) ||
      !['ordinal', 'openedAt', 'closesAt'].every(k => count((s.encounter as Record<string, unknown>)[k])))) return null;
    if (s.boss !== null) {
      const b = s.boss;
      if (!object(b) || !['chapter', 'elapsed', 'phase', 'move', 'remaining', 'exposure', 'pounceAt', 'correct', 'missed'].every(k => count(b[k])) ||
        !['hp', 'maxHp', 'catHp', 'maxCatHp', 'damageTaken'].every(k => number(b[k])) || (b.hp as number) <= 0 || (b.maxHp as number) <= 0 ||
        (b.catHp as number) <= 0 || (b.maxCatHp as number) <= 0 || b.chapter !== s.chapter || !member(b.phase, [1, 2, 3]) ||
        !member(b.stage, ['windup', 'recovery']) || !member(b.counter, ['dodge', 'break', 'interrupt']) ||
        !member(b.chosen, [null, 'dodge', 'break', 'interrupt']) || typeof b.assisted !== 'boolean') return null;
    }
    if (s.lastBoss !== null) {
      const b = s.lastBoss;
      if (!object(b) || !['chapter', 'seconds', 'counters', 'hp'].every(k => count(b[k])) || typeof b.won !== 'boolean' || typeof b.assisted !== 'boolean' ||
        !member(b.grade, ['Perfect', 'Close call', 'Clear', 'Try again']) || typeof b.hint !== 'string') return null;
    }
    return { state: s as unknown as CafeState, lastSeen: data.lastSeen };
  } catch { return null; }
}

export function cafeEnabled(search: string, demo: boolean) {
  const query = new URLSearchParams(search);
  return demo && (CONFIG.features.cafeAdventure || query.has('demo') && query.get('adventure') === '1');
}
