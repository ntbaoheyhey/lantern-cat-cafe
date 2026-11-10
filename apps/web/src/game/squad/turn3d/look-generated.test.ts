import { expect, it } from 'vitest';
import * as T from 'three';
import { cloneBattleModel, disposeGeneratedSkeletons } from './look-generated';
import { createCardClips } from './card-motion';

it('binds cloned skins to independent actor bones', () => {
  const root = new T.Group();
  root.userData.lookGenerated = true;
  const bone = new T.Bone();
  bone.name = 'guardian_head';
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([0, 1, 0], 3));
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute([0, 0, 0, 0], 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute([1, 0, 0, 0], 4));
  const mesh = new T.SkinnedMesh(geometry);
  mesh.name = 'surface';
  root.add(bone, mesh);
  mesh.bind(new T.Skeleton([bone]));
  const first = cloneBattleModel(root), second = cloneBattleModel(root);
  const a = first.getObjectByName('surface') as T.SkinnedMesh;
  const b = second.getObjectByName('surface') as T.SkinnedMesh;
  first.getObjectByName('guardian_head')!.position.x = 2;
  first.updateMatrixWorld(true);
  second.updateMatrixWorld(true);
  expect(a.skeleton.bones[0]).toBe(first.getObjectByName('guardian_head'));
  expect(b.skeleton.bones[0]).not.toBe(a.skeleton.bones[0]);
  expect(a.applyBoneTransform(0, new T.Vector3(0, 1, 0)).x).toBe(2);
  expect(b.applyBoneTransform(0, new T.Vector3(0, 1, 0)).x).toBe(0);
  expect(bone.position.x).toBe(0);
  a.skeleton.computeBoneTexture(); b.skeleton.computeBoneTexture();
  const otherTexture = b.skeleton.boneTexture;
  disposeGeneratedSkeletons(first);
  expect(a.skeleton.boneTexture).toBeNull();
  expect(b.skeleton.boneTexture).toBe(otherTexture);
  disposeGeneratedSkeletons(second);
});

it('keeps clip rest transforms separate between original and generated rigs', async () => {
  const make = (revision: string, y: number) => {
    const root = new T.Group();
    root.userData = { lookV2: true, rigVersion: revision };
    const motion = new T.Bone();
    motion.name = 'guardian_motion';
    motion.position.y = y;
    root.add(motion);
    return root;
  };
  const original = await createCardClips(make('original-test', .2), 'guardian', 'mochi');
  const generated = await createCardClips(make('generated-test', .7), 'guardian', 'mochi');
  const rest = (clips: T.AnimationClip[]) => clips.find(c => c.name === 'idle')!.tracks
    .find(t => t.name === 'guardian_motion.position')!.values[1];
  expect(rest(original)).toBeCloseTo(.2);
  expect(rest(generated)).toBeCloseTo(.7);
});
