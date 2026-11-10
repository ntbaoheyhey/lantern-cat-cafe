import * as T from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

/** A skin must bind to this actor's bones, including during prewarming. */
export function cloneBattleModel(source: T.Group): T.Group {
  return source.userData.lookGenerated ? clone(source) as T.Group : source.clone(true);
}

export function disposeGeneratedSkeletons(model: T.Object3D) {
  if (!model.userData.lookGenerated) return;
  const skeletons = new Set<T.Skeleton>();
  model.traverse(node => { if (node instanceof T.SkinnedMesh) skeletons.add(node.skeleton); });
  for (const skeleton of skeletons) skeleton.dispose();
}

const faces = new WeakMap<T.Object3D, T.Mesh[]>();
/** Keep the source's painted eyes; only deform its authored eyelid target. */
export function animateGeneratedFace(model: T.Object3D, clip: string, time: number, reduced: boolean) {
  if (!model.userData.lookGenerated) return;
  let meshes = faces.get(model);
  if (!meshes) {
    meshes = [];
    model.traverse(node => {
      if (node instanceof T.Mesh && node.morphTargetDictionary?.blink !== undefined) meshes!.push(node);
    });
    faces.set(model, meshes);
  }
  const phase = (time + .27) % 4.1;
  const blink = reduced ? 0 : Math.max(0, 1 - Math.abs(phase - .14) / .10);
  const expression = clip === 'KO' || clip === 'defeat' ? .86 : clip.includes('hit') ? .63 : clip === 'victory' ? .36 : 0;
  for (const mesh of meshes) mesh.morphTargetInfluences![mesh.morphTargetDictionary!.blink!] = Math.max(blink, expression);
}
