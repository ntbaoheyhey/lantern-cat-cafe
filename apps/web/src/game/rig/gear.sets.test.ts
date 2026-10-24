import { describe, expect, it } from 'vitest';
import { buildSheet } from './bake';
import { composeFrame } from './compose';
import { ARMOR_SETS, type ArmorSet } from './gear';
import { CLASS_LOOKS, RARITY_CHARS, RARITY_PALETTES, SET_CHARS, SET_PALETTES } from './palettes';
import { mapProblems } from './spriteMap';
import {
  CLASS_IDS, GEAR_RARITIES, type EquippedVisuals, type SpriteMap,
} from './types';

const ARMOR_SLOTS: readonly (keyof ArmorSet)[] = ['helmet', 'armor', 'gloves', 'boots'];
const ALLOWED_CHARS = ['.', ...SET_CHARS, ...RARITY_CHARS] as const;

function nonTransparentMask(map: SpriteMap): string[] {
  return map.rows.map((row) => row.split('').map((ch) => (ch === '.' ? '.' : '#')).join(''));
}

describe('gear sets (V23)', () => {
  it('includes cozy, ranger, and moon in ARMOR_SETS with corresponding SET_PALETTES', () => {
    expect(Object.keys(ARMOR_SETS).sort()).toEqual(['cozy', 'moon', 'ranger']);
    for (const name of Object.keys(ARMOR_SETS)) {
      expect(SET_PALETTES[name], `${name} palette`).toBeDefined();
      expect(Object.keys(SET_PALETTES[name]!).sort()).toEqual([...SET_CHARS].sort());
    }
  });

  it('for every set and every rarity, mapProblems returns []', () => {
    for (const [setName, set] of Object.entries(ARMOR_SETS)) {
      for (const rarity of GEAR_RARITIES) {
        const fullPalette = { ...SET_PALETTES[setName], ...RARITY_PALETTES[rarity] };
        for (const slot of ARMOR_SLOTS) {
          const map = set[slot];
          const problems = mapProblems(map, fullPalette, `${setName} ${slot} (${rarity})`);
          expect(problems).toEqual([]);
        }
      }
    }
  });

  it('sets use only allowed characters and include per-rarity trim', () => {
    for (const [setName, set] of Object.entries(ARMOR_SETS)) {
      for (const slot of ARMOR_SLOTS) {
        const map = set[slot];
        let hasSetChar = false;
        let hasTrimChar = false;
        map.rows.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) {
            const ch = row[x]!;
            expect(ALLOWED_CHARS, `${setName} ${slot} at (${x},${y}) uses ${ch}`).toContain(ch);
            if ((SET_CHARS as readonly string[]).includes(ch)) hasSetChar = true;
            if ((RARITY_CHARS as readonly string[]).includes(ch)) hasTrimChar = true;
          }
        });
        expect(hasSetChar, `${setName} ${slot} must use set colors a or b`).toBe(true);
        expect(hasTrimChar, `${setName} ${slot} must use rarity trim t, T, or h`).toBe(true);
      }
    }
  });

  it('each map non-transparent pixels differ from cozy', () => {
    const cozy = ARMOR_SETS.cozy;
    expect(cozy).toBeDefined();

    for (const setName of ['ranger', 'moon'] as const) {
      const set = ARMOR_SETS[setName];
      expect(set, `${setName} must exist in ARMOR_SETS`).toBeDefined();
      if (!set || !cozy) continue;

      for (const slot of ARMOR_SLOTS) {
        const cozyMap = cozy[slot];
        const targetMap = set[slot];

        // The exact character rows must differ
        expect(targetMap.rows, `${setName} ${slot} rows differ from cozy`).not.toEqual(cozyMap.rows);

        // The non-transparent pixel layout (mask) must differ from cozy
        const cozyMask = nonTransparentMask(cozyMap);
        const targetMask = nonTransparentMask(targetMap);
        expect(targetMask, `${setName} ${slot} non-transparent mask differs from cozy`).not.toEqual(cozyMask);
      }
    }
  });

  it('each armor set has identical dimensions and pivots to cozy', () => {
    const cozy = ARMOR_SETS.cozy;
    expect(cozy).toBeDefined();
    if (!cozy) return;

    for (const setName of ['ranger', 'moon'] as const) {
      const set = ARMOR_SETS[setName];
      expect(set).toBeDefined();
      if (!set) continue;

      for (const slot of ARMOR_SLOTS) {
        const target = set[slot];
        const ref = cozy[slot];
        expect(target.rows.length, `${setName} ${slot} row count`).toBe(ref.rows.length);
        expect(target.rows[0]?.length, `${setName} ${slot} column width`).toBe(ref.rows[0]?.length);
        expect(target.pivot, `${setName} ${slot} pivot`).toEqual(ref.pivot);
      }
    }
  });

  it('bakes one frame of every class wearing each set without throwing', () => {
    for (const cls of CLASS_IDS) {
      const look = CLASS_LOOKS[cls];
      for (const setName of Object.keys(ARMOR_SETS)) {
        for (const rarity of ['common', 'legendary'] as const) {
          const piece = { set: setName, rarity };
          const gear: EquippedVisuals = {
            weapon: { set: look.starterWeapon, rarity },
            helmet: piece,
            armor: piece,
            gloves: piece,
            boots: piece,
          };
          expect(() => {
            const frame = composeFrame(look, gear, 'idle', 0);
            expect(frame.clipped).toBe(0);
            expect(frame.pixels.some((px) => px !== -1)).toBe(true);
          }).not.toThrow();
        }
      }
    }
  });

  it('per-rarity trim check: different rarities produce visually distinct pixels for every set', () => {
    for (const setName of Object.keys(ARMOR_SETS)) {
      const framesByRarity = GEAR_RARITIES.map((rarity) => {
        const piece = { set: setName, rarity };
        const gear: EquippedVisuals = {
          weapon: { set: CLASS_LOOKS.warrior.starterWeapon, rarity },
          helmet: piece,
          armor: piece,
          gloves: piece,
          boots: piece,
        };
        const f = composeFrame(CLASS_LOOKS.warrior, gear, 'idle', 0);
        return Array.from(f.pixels).join();
      });

      // All 5 gear rarities should produce distinct composed pixel buffers
      const unique = new Set(framesByRarity);
      expect(unique.size, `${setName} unique frames across 5 rarities`).toBe(GEAR_RARITIES.length);
    }
  });

  it('buildSheet runs cleanly for every class and set combination', () => {
    for (const cls of CLASS_IDS) {
      const look = CLASS_LOOKS[cls];
      for (const setName of ['ranger', 'moon']) {
        const piece = { set: setName, rarity: 'rare' as const };
        const gear: EquippedVisuals = {
          helmet: piece,
          armor: piece,
          gloves: piece,
          boots: piece,
        };
        const sheet = buildSheet(look, gear);
        expect(sheet.image.width).toBeGreaterThan(0);
        expect(sheet.image.height).toBeGreaterThan(0);
        expect(sheet.anchors.size).toBeGreaterThan(0);
      }
    }
  });
});
