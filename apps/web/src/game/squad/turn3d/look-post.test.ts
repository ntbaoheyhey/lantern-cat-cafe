import { afterEach, expect, it, vi } from 'vitest';
import * as T from 'three';
import { LookPost } from './look-post';
import type { CardEffects } from './card-effects';

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const previous = new T.WebGLRenderTarget(2, 2);
  const renderer = {
    getPixelRatio: () => 2, capabilities: { maxSamples: 4 },
    getRenderTarget: () => previous, getViewport: (v: T.Vector4) => v.set(1, 2, 3, 4),
    setRenderTarget: vi.fn(), setViewport: vi.fn(), initTexture: vi.fn(),
    getClearColor: (c: T.Color) => c.set(0x123456), getClearAlpha: () => 1,
    setClearColor: vi.fn(), clear: vi.fn(), autoClear: true,
    initRenderTarget: vi.fn(), compileAsync: vi.fn(async () => undefined), render: vi.fn(),
  };
  const post = new LookPost(renderer as unknown as T.WebGLRenderer);
  return { post, renderer, previous };
}

it('adapts only after sustained slow windows and recovers without target churn', () => {
  const { post } = fixture();
  post.resize(1280, 568);
  const targets = Object.values(post).filter(v => v instanceof T.WebGLRenderTarget);
  const disposals = targets.map(target => vi.spyOn(target, 'dispose'));
  const frames = (count: number, ms: number) => { for (let i = 0; i < count; i++) post.observe(ms); };
  frames(180, 33.3); expect(post.effectiveQuality).toBe('high');
  frames(180, 33.3); expect(post.effectiveQuality).toBe('medium');
  frames(360, 33.3); expect(post.effectiveQuality).toBe('low');
  frames(900, 16.7); expect(post.effectiveQuality).toBe('low');
  frames(180, 16.7); expect(post.effectiveQuality).toBe('medium');
  frames(1080, 16.7); expect(post.effectiveQuality).toBe('high');
  for (const spy of disposals) expect(spy).not.toHaveBeenCalled();
  post.dispose();
  for (const spy of disposals) expect(spy).toHaveBeenCalledTimes(1);
});

it('respects a Balanced ceiling and skips disabled automatic sampling', () => {
  const { post } = fixture();
  post.setQuality('medium');
  for (let i = 0; i < 1080; i++) post.observe(16.7);
  expect(post.effectiveQuality).toBe('medium');
  for (let i = 0; i < 360; i++) post.observe(50, false);
  expect(post.effectiveQuality).toBe('medium');
  for (let i = 0; i < 360; i++) post.observe(33.3);
  expect(post.effectiveQuality).toBe('low');
  post.setQuality('high');
  expect(post.effectiveQuality).toBe('high');
  post.dispose();
});

it('restores GL state when navigation cancels warmup before GPU allocation', async () => {
  const { post, renderer, previous } = fixture();
  const internals = post as unknown as { smaa: { _areaTexture: T.Texture } };
  internals.smaa._areaTexture.image.decode = vi.fn(async () => undefined);
  await post.warm(() => true);
  expect(renderer.initTexture).not.toHaveBeenCalled();
  expect(renderer.initRenderTarget).not.toHaveBeenCalled();
  expect(renderer.render).not.toHaveBeenCalled();
  expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previous);
  expect(renderer.setViewport).toHaveBeenLastCalledWith(new T.Vector4(1, 2, 3, 4));
  post.dispose();
});


it('renders the stage once and samples its depth only in a separate effect target', () => {
  const { post, renderer } = fixture();
  const scene = new T.Scene(), root = new T.Group(), camera = new T.PerspectiveCamera();
  scene.add(root);
  const setDepth = vi.fn();
  post.setEffects({ root, setDepth, impactCenter: new T.Vector2(.25, .6) } as unknown as CardEffects);
  const owner = root.parent;
  let stageTarget: unknown, effectTarget: unknown;
  renderer.render.mockImplementation((rendered: T.Scene) => {
    const target = renderer.setRenderTarget.mock.calls.at(-1)?.[0];
    if (rendered === scene) {stageTarget = target;expect(root.parent).not.toBe(scene);expect(setDepth).not.toHaveBeenCalled();}
    else if (root.parent === rendered) {effectTarget = target;expect(setDepth).toHaveBeenCalledTimes(1);}
  });
  post.setQuality('medium');post.render(scene, camera, .2, .4, '#ffc777', false);
  expect(renderer.render.mock.calls.filter(([rendered]) => rendered === scene)).toHaveLength(1);
  expect(stageTarget).toBeInstanceOf(T.WebGLRenderTarget);expect(effectTarget).toBeInstanceOf(T.WebGLRenderTarget);
  expect(effectTarget).not.toBe(stageTarget);expect(root.parent).toBe(owner);expect(root.visible).toBe(true);
  expect(renderer.setClearColor).toHaveBeenLastCalledWith(new T.Color(0x123456), 1);
  post.dispose();
});

it('restores effect ownership and clear state if its isolated draw fails', () => {
  const { post, renderer } = fixture();
  const scene = new T.Scene(), root = new T.Group(), camera = new T.PerspectiveCamera();scene.add(root);
  post.setEffects({ root, setDepth: vi.fn() } as unknown as CardEffects);
  const owner = root.parent;
  renderer.render.mockImplementation((rendered: T.Scene) => {if (rendered !== scene && root.parent === rendered) throw Error('draw failure');});
  expect(() => post.render(scene, camera, 0, 0, '#ffffff', false)).toThrow('draw failure');
  expect(root.parent).toBe(owner);expect(root.visible).toBe(true);
  expect(renderer.setClearColor).toHaveBeenLastCalledWith(new T.Color(0x123456), 1);post.dispose();
});

it('keeps effect ownership fixed across tiers and restores Low clear state on failure', () => {
  const { post, renderer } = fixture();
  const scene = new T.Scene(), root = new T.Group(), camera = new T.PerspectiveCamera();scene.add(root);
  post.setEffects({ root, setDepth: vi.fn() } as unknown as CardEffects);
  const owner = root.parent, removed = vi.fn();root.addEventListener('removed', removed);
  for (const quality of ['medium', 'low', 'medium'] as const) {
    post.setQuality(quality);post.render(scene, camera, 0, 0, '#ffffff', false);
    expect(root.parent).toBe(owner);expect(renderer.autoClear).toBe(true);
  }
  expect(removed).not.toHaveBeenCalled();
  post.setQuality('low');
  renderer.render.mockImplementation((rendered: T.Scene) => {
    if (rendered === owner) {expect(renderer.autoClear).toBe(false);throw Error('low draw failure');}
  });
  expect(() => post.render(scene, camera, 0, 0, '#ffffff', false)).toThrow('low draw failure');
  expect(renderer.autoClear).toBe(true);expect(root.parent).toBe(owner);post.dispose();
});
