import { expect, it } from 'vitest';
import { composeFrame } from './compose';
import { CLASS_LOOKS } from './palettes';
import { classTail, classTorso, HEAD, POINT_FOOT, POINT_PAW } from './parts';
import { animsFor, ATTACKS, SHARED_ANIMS } from './poses';
import { anchorsOf, shownWeapon } from './compose';
import { ANIM_NAMES, CLASS_IDS } from './types';
import { mapProblems } from './spriteMap';
import { BODY_CHARS } from './palettes';

it('uses all seven agreed palettes and their unchanged weapon/marking contracts', () => {
  const approved = {
    warrior: [0xf0a040, 0xc66a1a, 0xfff0d8, 0x3f9e5a, 0xff8fb1, 'sword', 'tabby'],
    guardian: [0x9aa0b4, 0x666c80, 0xe8eaf0, 0xffd75e, 0xff8fb1, 'hammer', 'plain'],
    rogue: [0x4a4258, 0x2e2838, 0xd8d8e8, 0xffd75e, 0xd07890, 'daggers', 'plain'],
    hunter: [0xa0703f, 0x6e4a26, 0xe8d2b0, 0x4aa8ff, 0xff8fb1, 'spear', 'tabby'],
    archer: [0xf3e2c4, 0x8a6a52, 0xfffaf0, 0x3a7ad0, 0xff8fb1, 'bow', 'points'],
    witch: [0xf2eefc, 0xb8b0d4, 0xffffff, 0xbb74ff, 0xff8fb1, 'staff', 'plain'],
    alchemist: [0xfff3e0, 0xe08a3a, 0xffffff, 0x6be08a, 0xff8fb1, 'flasks', 'patches'],
  };
  for (const id of CLASS_IDS) {
    const { fur, weaponType, markings, starterWeapon } = CLASS_LOOKS[id];
    expect([fur.o, fur.d, fur.w, fur.e, fur.n, weaponType, markings]).toEqual(approved[id]);
    expect(fur.k).toBe(0x140a12);
    expect(starterWeapon).toBe(`${weaponType}.basic`);
  }
});

it('keeps the original anchors, frame counts and hit/release times for every class and animation', () => {
  for (const id of CLASS_IDS) {
    const look = CLASS_LOOKS[id];
    for (const name of ANIM_NAMES) {
      const original = name === 'attack' ? ATTACKS[look.weaponType] : SHARED_ANIMS[name];
      const actual = animsFor(look.weaponType)[name];
      expect(actual.frameMs).toEqual(original.frameMs);
      expect(actual.hitFrames).toEqual(original.hitFrames);
      expect(actual.frames).toHaveLength(original.frames.length);
      actual.frames.forEach((_, i) => {
        expect(composeFrame(look, {}, name, i).anchors).toEqual(anchorsOf(original.frames[i]!, shownWeapon(look, {})));
      });
    }
  }
});

it('reads as seven different solid silhouettes even with the same fur palette', () => {
  const masks = CLASS_IDS.map(id => Array.from(composeFrame({ ...CLASS_LOOKS[id], fur: CLASS_LOOKS.warrior.fur }, {}, 'idle', 0).pixels, p => p < 0 ? '.' : '#').join(''));
  expect(new Set(masks).size).toBe(7);
  expect(classTorso('guardian', 'stand').rows[0]!.length).toBeGreaterThan(classTorso('rogue', 'stand').rows[0]!.length);
  expect(classTail('alchemist', 'up').rows.length).toBeLessThan(classTail('warrior', 'up').rows.length);
  expect(classTail('witch', 'up').rows.join('')).toContain('w');
  expect(HEAD.rows).toHaveLength(11);
});

it('draws Siamese points on all paws and the whole tail while preserving the white chin', () => {
  expect(POINT_PAW.rows.join('')).not.toContain('w');
  expect(POINT_FOOT.rows.join('')).not.toContain('w');
  const { pixels } = composeFrame(CLASS_LOOKS.archer, {}, 'idle', 0);
  const at = (x: number, y: number) => pixels[(y + 14) * 56 + x + 12];
  expect(at(12, 31)).toBe(CLASS_LOOKS.archer.fur.d);
  // The carried bow can overlap a toe; the exposed front toes must still be mocha.
  expect([16, 17, 18, 19].map(x => at(x, 31))).toContain(CLASS_LOOKS.archer.fur.d);
  expect(pixels).toContain(CLASS_LOOKS.archer.fur.w);
});


it('validates class-specific body maps and tail pivots in all poses', () => {
  for (const id of CLASS_IDS) {
    for (const shape of ['stand', 'crouch', 'flat'] as const) expect(mapProblems(classTorso(id, shape), BODY_CHARS, `${id} ${shape}`)).toEqual([]);
    for (const tail of ['up', 'mid', 'down', 'flat'] as const) expect(mapProblems(classTail(id, tail), BODY_CHARS, `${id} ${tail}`)).toEqual([]);
  }
});
