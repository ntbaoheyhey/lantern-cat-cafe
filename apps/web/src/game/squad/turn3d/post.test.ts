import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { CafePost } from './post';

function target(post: CafePost) {
  return (post as unknown as { sceneTarget: T.WebGLRenderTarget }).sceneTarget;
}

describe('automatic battle antialiasing', () => {
  it('keeps medium post targets sampled and sized in device pixels', () => {
    const renderer = { getPixelRatio: () => 2, capabilities: { maxSamples: 4 } } as T.WebGLRenderer;
    const post = new CafePost(renderer, true);
    post.setQuality('medium');
    post.resize(1280, 568);
    expect(target(post).samples).toBe(4);
    expect([target(post).width, target(post).height]).toEqual([2560, 1136]);
    post.dispose();
  });

  it('releases a same-size target when its sample count changes', () => {
    const renderer = { getPixelRatio: () => 1, capabilities: { maxSamples: 2 } } as T.WebGLRenderer;
    const post = new CafePost(renderer, true);
    post.resize(1280, 568);
    let disposals = 0;
    target(post).addEventListener('dispose', () => disposals++);
    post.setQuality('low');
    expect(target(post).samples).toBe(0);
    post.setQuality('medium');
    expect(target(post).samples).toBe(2);
    expect(disposals).toBe(2);
    post.dispose();
  });

  it('retains the shared medium profile for existing callers', () => {
    const renderer = { getPixelRatio: () => 1, capabilities: { maxSamples: 4 } } as T.WebGLRenderer;
    const post = new CafePost(renderer);
    post.setQuality('medium');
    expect(target(post).samples).toBe(0);
    post.dispose();
  });
});
