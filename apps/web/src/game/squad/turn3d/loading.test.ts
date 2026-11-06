import { afterEach, expect, it, vi } from 'vitest';
import * as T from 'three';
import { warmScene } from './loading';

afterEach(() => vi.unstubAllGlobals());
function fixture() {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  const scene = new T.Scene(), group = new T.Group();
  scene.add(group); group.visible = false;
  const geometry = new T.BoxGeometry(), material = new T.MeshBasicMaterial();
  const parent = new T.Mesh(geometry, material); parent.visible = false; group.add(parent);
  for (let index = 0; index < 25; index++) parent.add(new T.Mesh(geometry, material));
  const camera = new T.Camera(), target = new T.WebGLRenderTarget(8, 8);
  const rendered = new Set<T.Object3D>();
  const renderer = {
    getViewport: (value: T.Vector4) => value.set(1, 2, 3, 4), getRenderTarget: () => target,
    setRenderTarget: vi.fn(), setViewport: vi.fn(), initTexture: vi.fn(),
    compileAsync: vi.fn(async () => undefined),
    render: vi.fn(() => scene.traverseVisible(object => { if (object instanceof T.Mesh) rendered.add(object); })),
  };
  return { scene, group, parent, camera, target, rendered, renderer };
}

it('warms nested hidden geometry in both output variants without changing visibility', async () => {
  const f = fixture();
  await warmScene(f.renderer as unknown as T.WebGLRenderer, f.scene, f.camera, () => false, () => {});
  expect(f.rendered.size).toBe(26);
  expect(f.renderer.render).toHaveBeenCalledTimes(6);
  expect(f.group.visible).toBe(false);
  expect(f.parent.visible).toBe(false);
  expect(f.parent.children.every(object => object.visible)).toBe(true);
  expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.target);
  expect(f.renderer.setViewport).toHaveBeenLastCalledWith(new T.Vector4(1, 2, 3, 4));
});

it('restores GL state when compilation fails or navigation cancels preparation', async () => {
  for (const mode of ['failure', 'navigation']) {
    const f = fixture(); let cancelled = false;
    f.renderer.compileAsync.mockImplementation(async () => {
      cancelled = true;
      if (mode === 'failure') throw new Error('lost context');
    });
    const preparation = warmScene(f.renderer as unknown as T.WebGLRenderer, f.scene, f.camera, () => cancelled, () => {});
    if (mode === 'failure') await expect(preparation).rejects.toThrow('lost context');
    else await preparation;
    expect(f.renderer.render).not.toHaveBeenCalled();
    expect(f.group.visible).toBe(false);
    expect(f.parent.visible).toBe(false);
    expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.target);
  }
});
