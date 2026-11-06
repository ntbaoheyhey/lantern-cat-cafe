import * as T from 'three';

/** A paint between loading units. setTimeout alone can run many independent
 * loaders before the next refresh; the RAF boundary gives progress a frame. */
export const loadingFrame = () => new Promise<void>(resolve => {
  requestAnimationFrame(() => setTimeout(resolve, 0));
});

/** Compile and initialize GL uniforms/attributes in bounded batches, preserving
 * the real fog, lighting and output target variants. No visible frame is shown. */
export async function warmScene(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.Camera,
  cancelled: () => boolean, progress: (fraction: number) => void) {
  const visibility = new Map<T.Object3D, boolean>();
  const drawables: (T.Mesh | T.Line | T.Points | T.Sprite)[] = [];
  const textures = new Set<T.Texture>();
  scene.traverse(object => {
    visibility.set(object, object.visible);
    object.visible = true;
    if (object instanceof T.Mesh || object instanceof T.Line || object instanceof T.Points || object instanceof T.Sprite) {
      drawables.push(object); object.visible = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) for (const value of Object.values(material)) {
        if (value instanceof T.Texture && value.image) textures.add(value);
      }
    }
  });
  const viewport = renderer.getViewport(new T.Vector4());
  const previous = renderer.getRenderTarget();
  const target = new T.WebGLRenderTarget(2, 2, { type: T.HalfFloatType });
  const oldCulling = drawables.map(object => object.frustumCulled);
  try {
    for (const texture of textures) {
      if (cancelled()) return;
      renderer.initTexture(texture);
      await loadingFrame();
    }
    for (const [variant, destination] of [null, target].entries()) {
      renderer.setRenderTarget(destination);
      renderer.setViewport(0, 0, 2, 2);
      for (let index = 0; index < drawables.length; index += 12) {
        if (cancelled()) return;
        const batch = drawables.slice(index, index + 12);
        const enabled = new Set<T.Object3D>();
        for (const object of batch) {
          object.frustumCulled = false;
          for (let parent: T.Object3D | null = object; parent && parent !== scene; parent = parent.parent) {
            if (!parent.visible) { parent.visible = true; enabled.add(parent); }
          }
        }
        await renderer.compileAsync(scene, camera);
        if (cancelled()) return;
        renderer.render(scene, camera);
        for (const object of enabled) object.visible = false;
        progress((variant + (index + batch.length) / drawables.length) / 2);
        await loadingFrame();
      }
    }
  } finally {
    for (const [object, visible] of visibility) object.visible = visible;
    drawables.forEach((object, index) => { object.frustumCulled = oldCulling[index]!; });
    renderer.setRenderTarget(previous); renderer.setViewport(viewport); target.dispose();
  }
}
