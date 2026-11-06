import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { CATS } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import { cueSignature } from '../../squad/turn3d/audio';
import './assets';
const root = resolve(import.meta.dirname, '../../../../../..');
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
it('gives each cat distinct geometry, authored identity, animation data and skill icons', () => {
  const geometryHashes = [], animationHashes = [], iconHashes = [];
  for (const cat of CATS) {
    const bytes = readFileSync(resolve(root, `assets/cardrpg2/models/${cat.id}.glb`));
    const jsonSize = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
    const binaryStart = 28 + jsonSize;
    const positions = gltf.meshes.flatMap((mesh: { primitives: Array<{ attributes: { POSITION: number } }> }) => mesh.primitives.map(primitive => {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      const view = gltf.bufferViews[accessor.bufferView];
      return bytes.subarray(binaryStart + (view.byteOffset ?? 0), binaryStart + (view.byteOffset ?? 0) + view.byteLength);
    }));
    geometryHashes.push(digest(Buffer.concat(positions)));
    const identity = gltf.nodes.find((node: { extras?: { depthIdentity?: { id: string } } }) => node.extras?.depthIdentity?.id === cat.id);
    expect(identity).toBeDefined();
    const clipNames = gltf.animations.map((clip: { name: string }) => clip.name);
    expect(clipNames).toEqual(expect.arrayContaining(['idle', 'attack', 'cast', 'hit', 'KO']));
    const motion = gltf.animations.flatMap((clip: { samplers: Array<{ input: number; output: number }> }) => clip.samplers.flatMap(sampler => [sampler.input, sampler.output].map(index => {
      const accessor = gltf.accessors[index], view = gltf.bufferViews[accessor.bufferView];
      return bytes.subarray(binaryStart + (view.byteOffset ?? 0), binaryStart + (view.byteOffset ?? 0) + view.byteLength);
    })));
    animationHashes.push(digest(Buffer.concat(motion)));
    for (const skill of cat.skills) iconHashes.push(digest(readFileSync(resolve(root, `assets/cardrpg2/icons/${skill.id}.svg`))));
  }
  expect(new Set(geometryHashes).size).toBe(12);
  expect(new Set(animationHashes).size).toBe(12);
  expect(new Set(iconHashes).size).toBe(48);
  const signatures = CATS.flatMap(cat => cat.skills.map(skill => JSON.stringify(cueSignature(skill.id))));
  expect(new Set(signatures).size).toBe(48);
});
