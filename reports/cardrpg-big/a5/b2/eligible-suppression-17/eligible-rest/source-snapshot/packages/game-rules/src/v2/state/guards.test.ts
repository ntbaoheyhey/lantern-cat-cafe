import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../config';
import { V2_CONFIG } from '../config';
import { CHAPTERS, ITEMS, RECIPES, RELIC_RECIPE } from '../content';
import { computeClaimV2, type ClaimInputV2 } from '../idle';
import { applyBossResult, applyCraft, applyRelicForge, applySalvage, emptyState, equip, lockItem } from './index';
import { guardBoss, guardChooseClass, guardClaim, guardCraft, guardEquip, guardLock, guardRelicForge,
  guardSalvage, MIN_CLAIM_INTERVAL_SECONDS_V2 } from './guards';
import type { OwnedItem, PlayerStateV2 } from './types';

const base = (): PlayerStateV2 => {
  const r = emptyState();
  if (!r.ok) throw new Error('emptyState');
  return { ...r.state, classId: 'warrior' };
};
const item = (id: string, key = 'wpn.sword.twig', o: Partial<OwnedItem> = {}): OwnedItem => {
  const d = ITEMS.find((e) => e.id === key)!;
  return { id, itemId: key, itemKey: key, slot: d.slot, weaponType: d.weaponType, rarity: d.rarity, level: 1,
    bonus: [], bonusLines: [], locked: false, equipped: false, source: 'drop', ...o };
};
const code = (g: ReturnType<typeof guardEquip>) => g?.code ?? null;

// The package has no Node typings; read the Deno sources the guards must stay in sync with.
// @ts-ignore node:fs is available at test time only
import * as nodeFs from 'node:fs';
const fs = nodeFs as unknown as { readFileSync(path: string, encoding: 'utf8'): string };
const here = (import.meta as unknown as { url: string }).url.replace(/^file:\/\//, '');
const serverFile = (path: string): string =>
  fs.readFileSync(`${here.slice(0, here.indexOf('/packages/'))}/${path}`, 'utf8');

describe('guards use the server codes', () => {
  it('only emit codes the server HTTP table knows', () => {
    const table = serverFile('supabase/functions/_shared/v2/http.ts');
    const known = new Set([...table.matchAll(/^\s+([a-z_]+): \d{3},/gm)].map((m) => m[1]));
    const s = base();
    const refusals = [
      guardChooseClass(s, 'nope'), guardEquip({ ...s, classId: null }, null, 'weapon'), guardEquip(s, 'x', 'weapon'),
      guardEquip(s, null, 'bogus'), guardCraft(s, 'bogus', 'weapon'), guardSalvage(s, []), guardLock(s, 'x'),
      guardRelicForge(s, 'not-a-date'), guardBoss(s, 1, 0), guardBoss(s, 99, 0),
    ];
    for (const r of refusals) {
      expect(r).not.toBeNull();
      expect(known.has(r!.code.split(':')[0]!)).toBe(true);
    }
  });

  it('keeps the minimum claim interval equal to the server constant', () => {
    const m = serverFile('supabase/functions/_shared/game.ts').match(/MIN_CLAIM_INTERVAL_SECONDS = (\d+)/);
    expect(Number(m![1])).toBe(MIN_CLAIM_INTERVAL_SECONDS_V2);
  });
});

describe('per-action guards match the pure rules', () => {
  it('chooseClass', () => {
    expect(guardChooseClass(base(), 'warrior')).toBeNull();
    expect(code(guardChooseClass(base(), 'ghost'))).toBe('invalid_request');
  });

  it('equip: no_class, not_owner, wrong_slot, slot_locked, wrong_weapon, ok', () => {
    const sword = item('w1');
    const bow = item('w2', ITEMS.find((i) => i.slot === 'weapon' && i.weaponType !== sword.weaponType)!.id);
    const s = { ...base(), items: [sword, bow] };
    expect(code(guardEquip({ ...s, classId: null }, 'w1', 'weapon'))).toBe('no_class');
    expect(code(guardEquip(s, 'missing', 'weapon'))).toBe('not_owner');
    expect(code(guardEquip(s, 'w1', 'armor'))).toBe('wrong_slot');
    expect(code(guardEquip(s, 'w2', 'weapon'))).toBe('wrong_weapon');
    expect(guardEquip(s, 'w1', 'weapon')).toBeNull();
    expect(guardEquip(s, null, 'weapon')).toBeNull();
    expect(equip(s, 'w1', 'weapon').ok).toBe(true);
  });

  it('craft: no_class, invalid_request, not_enough, bag_full', () => {
    const recipe = RECIPES[0]!;
    const rich = { fish: 1e6, yarn: 1e5, fluffTuft: 1e4, shinyButton: 1e4, catnipCrystal: 1e4, starlightScale: 1e4, moonPearl: 3 };
    const s = { ...base(), stacks: rich };
    expect(code(guardCraft({ ...s, classId: null }, recipe.id, 'weapon'))).toBe('no_class');
    expect(code(guardCraft(s, 'bogus', 'weapon'))).toBe('invalid_request');
    expect(code(guardCraft({ ...s, stacks: {} }, recipe.id, 'weapon'))).toBe('not_enough');
    const full = { ...s, items: Array.from({ length: V2_CONFIG.bag.limit }, (_, i) => item(`b${i}`)) };
    expect(code(guardCraft(full, recipe.id, 'weapon'))).toBe('bag_full');
    expect(guardCraft(s, recipe.id, 'weapon')).toBeNull();
    expect(applyCraft(s, recipe.id, 'weapon', 7, 7).ok).toBe(true);
  });

  it('salvage and lock: invalid_request, not_owner, equipped, locked', () => {
    const s = { ...base(), items: [item('a'), item('b', 'wpn.sword.twig', { equipped: true }), item('c', 'wpn.sword.twig', { locked: true })] };
    expect(code(guardSalvage(s, []))).toBe('invalid_request');
    expect(code(guardSalvage(s, ['zz']))).toBe('not_owner');
    expect(code(guardSalvage(s, ['b']))).toBe('equipped');
    expect(code(guardSalvage(s, ['c']))).toBe('locked');
    expect(guardSalvage(s, ['a'])).toBeNull();
    expect(code(guardLock(s, 'zz'))).toBe('not_owner');
    expect(guardLock(s, 'a')).toBeNull();
    expect(applySalvage(s, ['a']).ok).toBe(true);
    expect(lockItem(s, 'a', true).ok).toBe(true);
  });

  it('relic forge: invalid date, not enough materials', () => {
    expect(code(guardRelicForge(base(), '2026-13-40'))).toBe('invalid_request');
    const r = guardRelicForge(base(), '2026-10-30');
    expect(r?.code).toBe('forge_blocked');
    const rich = { ...base(), stacks: Object.fromEntries(Object.entries(RELIC_RECIPE.materials).map(([k, v]) => [k, v * 2])) };
    expect(applyRelicForge(rich, '2026-10-30').ok).toBe(guardRelicForge(rich, '2026-10-30') === null);
  });

  it('boss: invalid chapter, not_reached, no_key, cooldown, ok', () => {
    const ch = CHAPTERS[0]!;
    const ready: PlayerStateV2 = { ...base(), round: ch.roundsPerChapter, kills: ch.killsPerRound, stacks: { catKey: 3 } };
    expect(code(guardBoss(ready, 0, 0))).toBe('invalid_request');
    expect(code(guardBoss({ ...ready, classId: null }, 1, 0))).toBe('no_class');
    expect(code(guardBoss({ ...ready, kills: 0 }, 1, 0))).toBe('not_reached');
    expect(code(guardBoss({ ...ready, stacks: {} }, 1, 0))).toBe('no_key');
    const cooling = guardBoss({ ...ready, bossCooldownUntil: 500 }, 1, 100);
    expect(cooling).toMatchObject({ code: 'cooldown', cooldownUntil: 500 });
    expect(guardBoss({ ...ready, bossCooldownUntil: 500 }, 1, 500)).toBeNull();
    expect(guardBoss(ready, 1, 0)).toBeNull();
    // Same answer as the real (winning) application for the refusal paths.
    const win = { won: true, chapter: 1, chest: { stackDeltas: {}, items: [] }, keyCost: V2_CONFIG.boss.keyCost, cooldownS: 60, now: 0 };
    for (const s of [{ ...ready, kills: 0 }, { ...ready, stacks: {} }, { ...ready, bossCooldownUntil: 500 }]) {
      const real = applyBossResult(s, win);
      expect(real.ok ? null : real.code).toBe(guardBoss(s, 1, 0)?.code ?? null);
    }
  });
});

describe('guardClaim', () => {
  const s = base();
  const now = 2_000_000_000_000;
  const at = (agoS: number) => now * 1000 - agoS * 1e6;
  it('refuses a cat without a class', () => {
    expect(guardClaim({ ...s, classId: null }, now, at(100)).refusal?.code).toBe('no_class');
  });
  it('pays nothing inside the 10 s minimum interval', () => {
    expect(guardClaim(s, now, at(9)).creditedSeconds).toBe(0);
    expect(guardClaim(s, now, at(10)).creditedSeconds).toBe(10);
  });
  it('pays nothing and flags a rewound clock', () => {
    const g = guardClaim(s, now, at(-5000));
    expect(g).toMatchObject({ creditedSeconds: 0, clockRewound: true, capped: false });
    expect(guardClaim(s, NaN, at(10)).creditedSeconds).toBe(0);
  });
  it('caps at the 8 h offline limit, including after 31 days', () => {
    const cap = CONFIG.idle.offlineCapSeconds;
    expect(cap).toBe(8 * 3600);
    expect(guardClaim(s, now, at(cap)).capped).toBe(false);
    const long = guardClaim(s, now, at(31 * 86400));
    expect(long).toMatchObject({ creditedSeconds: cap, capped: true });
  });
});

describe('offline reward (computeClaimV2)', () => {
  const input = (o: Partial<ClaimInputV2> = {}): ClaimInputV2 => ({
    classId: 'warrior', level: 1, xp: 0, chapter: 1, round: 1, kills: 0, bestStage: 0, equipped: [],
    keysHeld: 0, lastDailyKeyDay: '2026-10-24', today: '2026-10-24', offline: true, ...o });
  const cap = CONFIG.idle.offlineCapSeconds;
  const gold = (d: ReturnType<typeof computeClaimV2>) => d.stackDeltas.fish ?? 0;

  it('pays the same for 8 h, 30 days and 31 days away', () => {
    const eight = computeClaimV2(input(), cap, 1);
    for (const days of [30, 31]) {
      const long = computeClaimV2(input(), days * 86400, 1);
      expect(long.progress).toEqual(eight.progress);
      expect(long.stackDeltas).toEqual(eight.stackDeltas);
    }
    expect(gold(eight)).toBeGreaterThan(0);
  });
  it('pays nothing for a rewound clock (negative elapsed) or NaN', () => {
    for (const e of [-1, -86400, NaN, -Infinity]) {
      const d = computeClaimV2(input(), e, 1);
      expect(d.stackDeltas).toEqual({});
      expect(d.progress.xp).toBe(0);
    }
  });
  it('is monotone below the cap and flat above it', () => {
    const g = (s: number) => gold(computeClaimV2(input(), s, 1));
    expect(g(3600)).toBeLessThan(g(cap));
    expect(g(cap + 1)).toBe(g(cap));
  });
  it('rewards by the current stage, not the best stage', () => {
    const early = computeClaimV2(input({ chapter: 1, round: 1, bestStage: 50 }), 3600, 1);
    const later = computeClaimV2(input({ chapter: 2, round: 1, bestStage: 50, level: 30 }), 3600, 1);
    expect(early.progress.chapter).toBe(1);
    expect(later.progress.chapter).toBeGreaterThanOrEqual(2);
    const same = computeClaimV2(input({ chapter: 1, round: 1, bestStage: 0 }), 3600, 1);
    expect(early.stackDeltas.fish).toBe(same.stackDeltas.fish);
  });
});
