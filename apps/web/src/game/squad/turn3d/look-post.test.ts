import { afterEach, expect, it, vi } from 'vitest';
import * as T from 'three';
import { LookPost } from './look-post';

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const previous = new T.WebGLRenderTarget(2, 2);
  const renderer = {
    getPixelRatio: () => 2, capabilities: { maxSamples: 4 },
    getRenderTarget: () => previous, getViewport: (v: T.Vector4) => v.set(1, 2, 3, 4),
    setRenderTarget: vi.fn(), setViewport: vi.fn(), initTexture: vi.fn(),
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
