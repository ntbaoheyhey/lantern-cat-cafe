import { expect, it, vi } from 'vitest';
import * as T from 'three';
import { LookVfx } from './look-vfx';
import { CARD_EFFECT_PRIMITIVES, createCardPrimitive } from './card-effect-primitives';
import { CARD_EFFECT_RECIPES } from './card-effect-data';
import { SpellVfx } from './vfx';

it.each(['cancelled', 'prepared', 'warmed'])('releases legacy pools and unused emblem placeholders exactly once (%s)', async boundary => {
  const scene = new T.Scene(), spells = new SpellVfx(scene, true);
  if (boundary !== 'cancelled') await spells.ready;
  const counts = new Map<T.BufferGeometry | T.Material, number>();
  spells.root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    for (const resource of [object.geometry, ...(Array.isArray(object.material) ? object.material : [object.material])]) {
      if (counts.has(resource)) continue;
      counts.set(resource, 0);
      resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource)! + 1));
    }
  });
  expect(counts.size).toBeGreaterThan(40);
  if (boundary === 'warmed') await spells.warm({ setRenderTarget: vi.fn(), render: vi.fn() } as unknown as T.WebGLRenderer, new T.PerspectiveCamera(), scene);
  spells.dispose();await spells.ready;spells.dispose();
  expect([...counts.values()].every(count => count === 1)).toBe(true);
  expect(scene.children).toHaveLength(0);
});

it('retains original structural vertices and shares mask/overdraw controls across materials', () => {
  const scene = new T.Scene(), shared = { overdraw: { value: 0 }, protectedCount: { value: 0 } };
  const look = new LookVfx(scene, shared);
  for (const kind of CARD_EFFECT_PRIMITIVES) {
    const original = createCardPrimitive(kind);
    const count = original.index?.count ?? original.attributes.position!.count;
    const geometry = look.geometry(original, kind);
    expect(geometry.attributes.position!.count, kind).toBeGreaterThanOrEqual(count);
    for (const name of ['position', 'normal', 'uv', 'effectPart']) {
      expect([...geometry.attributes[name]!.array].every(Number.isFinite), `${kind}/${name}`).toBe(true);
    }
    expect(geometry.attributes.effectPart!.count).toBe(geometry.attributes.position!.count);
    expect([...geometry.attributes.effectPart!.array].slice(0, count).every(v => v === 0)).toBe(true);
    expect(look.material(kind).uniforms.overdraw).toBe(shared.overdraw);
    expect(look.material(kind).uniforms.protectedCount).toBe(shared.protectedCount);
    geometry.dispose();
  }
  look.dispose();expect(scene.children).toHaveLength(0);
});

it('reuses two present lights and suppresses their contribution for ablation or reduced motion', () => {
  const scene = new T.Scene(), look = new LookVfx(scene, {}), camera = new T.PerspectiveCamera();
  const focus = new T.Vector3(1, 0, 0), targets = [focus];
  const original = [...scene.children];
  look.illuminate(CARD_EFFECT_RECIPES['soot-4']!, .6, new T.Vector3(), targets, camera, false);
  expect(look.lights[0]!.intensity).toBeGreaterThan(0);
  const power = look.lights[0]!.intensity;
  look.setLightsEnabled(false);expect(look.lights.every(l => l.intensity === 0 && l.visible)).toBe(true);
  look.setLightsEnabled(true);expect(look.lights[0]!.intensity).toBeCloseTo(power);
  look.illuminate(CARD_EFFECT_RECIPES['soot-4']!, .6, new T.Vector3(), targets, camera, true);
  expect(look.lights.every(l => l.intensity === 0)).toBe(true);
  expect(scene.children).toEqual(original);look.dispose();expect(scene.children).toHaveLength(0);
});

it('closes a decoded atlas that arrives after navigation disposed the scene', async () => {
  const scene = new T.Scene(), look = new LookVfx(scene, {}), close = vi.fn();
  let finish!: (bitmap: ImageBitmap) => void;
  const loader = vi.spyOn(T.ImageBitmapLoader.prototype, 'loadAsync')
    .mockImplementation(() => new Promise<ImageBitmap>(resolve => {finish = resolve;}));
  try {
    const preparing = look.prepare(() => false);
    expect(loader).toHaveBeenCalledTimes(1);
    look.dispose();finish({ close } as unknown as ImageBitmap);await preparing;
    expect(close).toHaveBeenCalledTimes(1);expect(scene.children).toHaveLength(0);
    expect(loader).toHaveBeenCalledTimes(1);
  } finally {loader.mockRestore();}
});
