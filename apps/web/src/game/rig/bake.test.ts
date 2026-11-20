import { describe, expect, it, vi } from 'vitest';
import { bakeCatInto, buildSheet, catTextureKey, type AnimSink, type SheetImage, type TextureSink } from './bake';
import { FRAME } from './compose';
import { CLASS_LOOKS } from './palettes';
import { ANIM_NAMES, type EquippedVisuals } from './types';

function fakeSinks() {
  const store = new Map<string, SheetImage>();
  const textures: TextureSink = { has: (k) => store.has(k), add: vi.fn((k: string, img: SheetImage) => void store.set(k, img)) };
  const created = new Set<string>();
  const anims: AnimSink = { exists: (k) => created.has(k), create: vi.fn((c) => created.add(c.key!)) };
  return { store, textures, anims };
}

const cozy: EquippedVisuals = {
  weapon: { set: 'sword.basic', rarity: 'epic' },
  helmet: { set: 'cozy', rarity: 'epic' },
  armor: { set: 'cozy', rarity: 'rare' },
};

describe('catTextureKey', () => {
  it('is the same for the same inputs and differs when anything visible changes', () => {
    const look = CLASS_LOOKS.warrior;
    expect(catTextureKey(look, cozy)).toBe(catTextureKey(look, { ...cozy }));
    expect(catTextureKey(look, cozy)).not.toBe(catTextureKey(look, { ...cozy, armor: { set: 'cozy', rarity: 'epic' } }));
    expect(catTextureKey(look, cozy)).not.toBe(catTextureKey(CLASS_LOOKS.rogue, cozy));
    expect(catTextureKey(look, cozy, 1)).not.toBe(catTextureKey(look, cozy, 2));
    expect(catTextureKey(look, {})).toContain('bare');
    // An edited look with the same id (dev preview) gets its own key.
    expect(catTextureKey(look, cozy)).not.toBe(catTextureKey({ ...look, fur: { ...look.fur, o: 0 } }, cozy));
  });
});

describe('bakeCatInto', () => {
  it('builds once and returns the cached sheet with the same key for the same inputs', () => {
    const { textures, anims } = fakeSinks();
    const a = bakeCatInto(textures, anims, CLASS_LOOKS.warrior, cozy);
    const b = bakeCatInto(textures, anims, CLASS_LOOKS.warrior, { ...cozy });
    expect(b).toBe(a);
    expect(b.key).toBe(a.key);
    expect(textures.add).toHaveBeenCalledTimes(1);
    expect(anims.create).toHaveBeenCalledTimes(ANIM_NAMES.length);
  });

  it('is lazy per class: only the baked class gets a texture', () => {
    const { store, textures, anims } = fakeSinks();
    expect(store.size).toBe(0);
    bakeCatInto(textures, anims, CLASS_LOOKS.archer, {});
    expect([...store.keys()]).toHaveLength(1);
    expect([...store.keys()][0]).toContain(':archer:');
  });

  it('bakes again when the texture was removed', () => {
    const { store, textures, anims } = fakeSinks();
    const a = bakeCatInto(textures, anims, CLASS_LOOKS.witch, {});
    store.delete(a.key);
    bakeCatInto(textures, anims, CLASS_LOOKS.witch, {});
    expect(textures.add).toHaveBeenCalledTimes(2);
    expect(anims.create).toHaveBeenCalledTimes(ANIM_NAMES.length);
  });

  it('names one frame per animation frame and keeps per-frame times and hit frames', () => {
    const { store, textures, anims } = fakeSinks();
    const sheet = bakeCatInto(textures, anims, CLASS_LOOKS.rogue, {});
    const image = store.get(sheet.key)!;
    expect(sheet.anims.attack.frames).toHaveLength(8);
    expect(sheet.anims.attack.hitFrames).toEqual([3, 5]);
    expect(image.frames.map((f) => f.name)).toEqual(ANIM_NAMES.flatMap((n) => sheet.anims[n].frames));
    const create = vi.mocked(anims.create).mock.calls.find(([c]) => c.key === sheet.anims.idle.key)![0];
    expect(create.repeat).toBe(-1);
    expect((create.frames as { duration: number }[]).map((f) => f.duration)).toEqual(sheet.anims.idle.frameMs);
    expect(sheet.origin.y).toBeCloseTo((FRAME.cellY + 32) / FRAME.h);
    expect(sheet.anchors('attack', 3).grip.x).toBeGreaterThan(sheet.anchors('idle', 0).grip.x);
    expect(() => sheet.anchors('hurt', 9)).toThrow();
  });
});

describe('buildSheet', () => {
  it('lays frames out on a grid that holds every frame', () => {
    const { image, anchors } = buildSheet(CLASS_LOOKS.guardian, cozy);
    expect(image.frames).toHaveLength(36);
    expect(anchors.size).toBe(36);
    expect(image.width % FRAME.w).toBe(0);
    expect(image.pixels).toHaveLength(image.width * image.height);
    for (const f of image.frames) {
      expect(f.x + FRAME.w).toBeLessThanOrEqual(image.width);
      expect(f.y + FRAME.h).toBeLessThanOrEqual(image.height);
    }
  });
});
