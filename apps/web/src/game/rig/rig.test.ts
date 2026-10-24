import { describe, expect, it } from 'vitest';
import { composeFrame, FRAME } from './compose';
import { ARMOR_SETS, diagonalOf, WEAPON_SETS } from './gear';
import { EYES, FOOT, HEAD, MARKINGS, PAW, PAW_RING, TAILS, TORSO } from './parts';
import { BODY_CHARS, CLASS_LOOKS, RARITY_CHARS, RARITY_PALETTES, SET_CHARS, SET_PALETTES, WEAPON_PALETTE } from './palettes';
import { animsFor, ATTACKS } from './poses';
import { atAngle, mapProblems, rotate90 } from './spriteMap';
import {
  ANCHOR_NAMES, ANIM_NAMES, CLASS_IDS, GEAR_RARITIES, WEAPON_TYPES, type EquippedVisuals, type GearRarity, type SpriteMap,
} from './types';

const FRAME_COUNTS = { idle: 4, walk: 6, attack: 6, hurt: 2, defeat: 4, victory: 4 } as const;

function gearFor(cls: (typeof CLASS_IDS)[number], armor: boolean, rarity: GearRarity): EquippedVisuals {
  const weapon = { set: CLASS_LOOKS[cls].starterWeapon, rarity };
  const piece = { set: 'cozy', rarity };
  return armor ? { weapon, helmet: piece, armor: piece, gloves: piece, boots: piece } : { weapon };
}

describe('animations', () => {
  it('have the planned frame counts, a time per frame and the same rig for every class', () => {
    for (const type of WEAPON_TYPES) {
      const anims = animsFor(type);
      for (const name of ANIM_NAMES) {
        const want = name === 'attack' && type === 'daggers' ? 8 : FRAME_COUNTS[name];
        expect(anims[name].frames, `${type} ${name}`).toHaveLength(want);
        expect(anims[name].frameMs).toHaveLength(want);
        expect(anims[name].frameMs.every((ms) => ms > 0)).toBe(true);
      }
    }
  });

  it('start each attack hit frame at the plan\'s hit time', () => {
    const hitAt = { sword: [240], hammer: [520], daggers: [140, 300], spear: [300], bow: [300], staff: [500], flasks: [260] };
    for (const type of WEAPON_TYPES) {
      const a = ATTACKS[type];
      const starts = (a.hitFrames ?? []).map((f) => a.frameMs.slice(0, f).reduce((s, ms) => s + ms, 0));
      expect(starts, type).toEqual(hitAt[type]);
    }
  });

  it('give every frame of every animation all anchors, inside the frame, with a 45 degree grip angle', () => {
    for (const cls of CLASS_IDS) {
      const look = CLASS_LOOKS[cls];
      for (const name of ANIM_NAMES) {
        animsFor(look.weaponType)[name].frames.forEach((_, i) => {
          const { anchors } = composeFrame(look, {}, name, i);
          for (const key of ANCHOR_NAMES) {
            const p = anchors[key];
            const where = `${cls} ${name} ${i} ${key}`;
            expect(p, where).toBeDefined();
            expect(Number.isInteger(p.x) && Number.isInteger(p.y), where).toBe(true);
            expect(p.x + FRAME.cellX, where).toBeGreaterThanOrEqual(0);
            expect(p.x + FRAME.cellX, where).toBeLessThan(FRAME.w);
            expect(p.y + FRAME.cellY, where).toBeGreaterThanOrEqual(0);
            expect(p.y + FRAME.cellY, where).toBeLessThan(FRAME.h);
          }
          expect(anchors.gripAngle % 45, `${cls} ${name} ${i} angle`).toBe(0);
        });
      }
    }
  });
});

describe('layer maps', () => {
  const check = (map: SpriteMap, chars: readonly string[], name: string) => expect(mapProblems(map, chars, name)).toEqual([]);

  it('have equal-length rows, a pivot inside, and only body palette characters', () => {
    check(HEAD, BODY_CHARS, 'head');
    check(PAW, BODY_CHARS, 'paw');
    check(PAW_RING, BODY_CHARS, 'paw ring');
    check(FOOT, BODY_CHARS, 'foot');
    for (const [k, m] of Object.entries(TORSO)) check(m, BODY_CHARS, `torso ${k}`);
    for (const [k, m] of Object.entries(TAILS)) check(m, BODY_CHARS, `tail ${k}`);
    for (const [k, [back, front]] of Object.entries(EYES)) {
      // Eye pivots may sit just outside a 1-row map (blink draws on the lower row), so only rows and chars.
      for (const m of [back, front]) expect(mapProblems({ ...m, pivot: { x: 0, y: 0 } }, BODY_CHARS, `eyes ${k}`)).toEqual([]);
    }
    for (const [k, { head, torso }] of Object.entries(MARKINGS)) {
      for (const [m] of [...head, ...torso]) check(m, BODY_CHARS, `markings ${k}`);
    }
  });

  it('armor sets use only set and rarity characters', () => {
    for (const [name, set] of Object.entries(ARMOR_SETS)) {
      expect(SET_PALETTES[name], `${name} palette`).toBeDefined();
      for (const [slot, m] of Object.entries(set)) check(m, [...SET_CHARS, ...RARITY_CHARS], `${name} ${slot}`);
    }
  });

  it('weapons use only weapon and rarity characters, at every angle', () => {
    const chars = [...Object.keys(WEAPON_PALETTE), ...RARITY_CHARS];
    for (const [name, def] of Object.entries(WEAPON_SETS)) {
      expect(WEAPON_TYPES).toContain(def.type);
      for (const [pose, m] of Object.entries(def.poses)) {
        check(m, chars, `${name} ${pose}`);
        check(diagonalOf(m), chars, `${name} ${pose} diagonal`);
        for (let a = 0; a < 360; a += 45) check(atAngle(m, diagonalOf(m), a), chars, `${name} ${pose} ${a}`);
      }
    }
  });

  it('every class has a starter weapon of its own type and every palette fills its characters', () => {
    for (const cls of CLASS_IDS) {
      const look = CLASS_LOOKS[cls];
      expect(WEAPON_SETS[look.starterWeapon]?.type, cls).toBe(look.weaponType);
      expect(Object.keys(look.fur).sort()).toEqual([...BODY_CHARS].sort());
    }
    for (const r of GEAR_RARITIES) expect(Object.keys(RARITY_PALETTES[r]).sort()).toEqual([...RARITY_CHARS].sort());
    for (const p of Object.values(SET_PALETTES)) expect(Object.keys(p).sort()).toEqual([...SET_CHARS].sort());
  });
});

describe('composeFrame', () => {
  it('draws every class, armor set and rarity in every frame without clipping', () => {
    for (const cls of CLASS_IDS) {
      const look = CLASS_LOOKS[cls];
      for (const armor of [false, true]) {
        for (const rarity of GEAR_RARITIES) {
          for (const name of ANIM_NAMES) {
            animsFor(look.weaponType)[name].frames.forEach((_, i) => {
              const f = composeFrame(look, gearFor(cls, armor, rarity), name, i);
              expect(f.clipped, `${cls} ${armor} ${rarity} ${name} ${i}`).toBe(0);
              expect(f.pixels.some((c) => c !== -1)).toBe(true);
            });
          }
        }
      }
    }
  });

  it('changes the picture with gear and rarity, and falls back to the starter weapon for a wrong type', () => {
    const look = CLASS_LOOKS.warrior;
    const px = (g: EquippedVisuals) => Array.from(composeFrame(look, g, 'idle', 0).pixels).join();
    expect(px(gearFor('warrior', true, 'rare'))).not.toBe(px(gearFor('warrior', false, 'rare')));
    expect(px(gearFor('warrior', true, 'rare'))).not.toBe(px(gearFor('warrior', true, 'epic')));
    expect(px({ weapon: { set: 'bow.basic', rarity: 'common' } })).toBe(px({ weapon: { set: 'sword.basic', rarity: 'common' } }));
  });

  it('rejects a frame that does not exist', () => {
    expect(() => composeFrame(CLASS_LOOKS.rogue, {}, 'hurt', 2)).toThrow();
  });
});

describe('sprite maps', () => {
  it('four quarter turns give the same map back, and 90 degrees is one turn', () => {
    const m = WEAPON_SETS['sword.basic']!.poses.base;
    expect(rotate90(rotate90(rotate90(rotate90(m))))).toEqual(m);
    expect(atAngle(m, diagonalOf(m), 90)).toEqual(rotate90(m));
    expect(atAngle(m, diagonalOf(m), -270)).toEqual(rotate90(m));
    // A sword pointing up has its tip on the top row.
    expect(rotate90(m).rows[0]).toContain('h');
  });

  it('reports ragged rows and unknown characters', () => {
    expect(mapProblems({ rows: ['ab', 'a'], pivot: { x: 0, y: 0 } }, ['a', 'b'], 'x')).toHaveLength(1);
    expect(mapProblems({ rows: ['az'], pivot: { x: 0, y: 0 } }, ['a'], 'x')).toHaveLength(1);
    expect(mapProblems({ rows: ['a'], pivot: { x: 3, y: 0 } }, ['a'], 'x')).toHaveLength(1);
  });
});
