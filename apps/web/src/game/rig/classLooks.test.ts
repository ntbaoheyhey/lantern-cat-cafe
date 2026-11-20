import { expect, it } from 'vitest';
import { composeFrame } from './compose';
import { CLASS_LOOKS } from './palettes';
import { classTail, classTorso, HEAD, POINT_FOOT, POINT_PAW } from './parts';
import { animsFor, ATTACKS, SHARED_ANIMS } from './poses';
import { anchorsOf, shownWeapon } from './compose';
import { ANIM_NAMES, CLASS_IDS } from './types';
import { mapProblems } from './spriteMap';
import { BODY_CHARS } from './palettes';

it('uses seven palette-locked class ramps and unchanged weapon/marking contracts', () => {
  const approved = {
    warrior: [0xffbd79, 0xd98a51, 0xffe0aa, 0x35534e, 0xf2a6b5, 'sword', 'tabby'],
    guardian: [0x8495ae, 0x46516b, 0xfff1d6, 0xf5cb7b, 0xf2a6b5, 'hammer', 'plain'],
    rogue: [0x2d354d, 0x1d2335, 0xe6d6f5, 0xf5cb7b, 0xd87c88, 'daggers', 'plain'],
    hunter: [0xae7961, 0x543b45, 0xffe0aa, 0xa5d5ad, 0xf2a6b5, 'spear', 'tabby'],
    archer: [0xfff1d6, 0xae7961, 0xffe0aa, 0x92c6ff, 0xf2a6b5, 'bow', 'points'],
    witch: [0xe6d6f5, 0x8c628d, 0xfff1d6, 0xcfadf5, 0xf2a6b5, 'staff', 'plain'],
    alchemist: [0xffe0aa, 0xd98a51, 0xfff1d6, 0xa5d5ad, 0xf2a6b5, 'flasks', 'patches'],
  };
  for (const id of CLASS_IDS) {
    const { fur, weaponType, markings, starterWeapon } = CLASS_LOOKS[id];
    expect([fur.o, fur.d, fur.w, fur.e, fur.n, weaponType, markings]).toEqual(approved[id]);
    expect(fur.k).toBe(0x121522);
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
