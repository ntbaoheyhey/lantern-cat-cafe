import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { LookContactPool } from './look-contact-pool';
import { groundCardContact } from './card-contact';

describe('pooled battle contact shadows', () => {
  it('preserves the source quad under actor scaling, turning and lift', () => {
    const material = new T.MeshBasicMaterial({ color: '#172d36', opacity: .56, transparent: true });
    const pool = new LookContactPool(material);
    const actor = new T.Group();
    actor.position.set(2, .8, -1); actor.rotation.y = .6; actor.scale.setScalar(1.75);
    const shadow = new T.Mesh(new T.PlaneGeometry(1.65, 1.35), material);
    shadow.rotation.x = -Math.PI / 2; actor.add(shadow); groundCardContact(shadow, actor);
    shadow.updateWorldMatrix(true, false);
    const expected = new T.Vector3(.825, .675, 0).applyMatrix4(shadow.matrixWorld);
    pool.begin(); pool.add(shadow, true); pool.end();
    const instances = pool.root.children[0] as T.InstancedMesh;
    const matrix = new T.Matrix4(); instances.getMatrixAt(0, matrix);
    const actual = new T.Vector3(.5, .5, 0).applyMatrix4(matrix);
    expect(actual.distanceTo(expected)).toBeLessThan(.000001);
    expect(shadow.visible).toBe(false);
    expect(instances.material).not.toBe(material);
    pool.dispose(); shadow.geometry.dispose(); material.dispose();
  });

  it('clears removed actors and keeps an overflow actor visible', () => {
    const material = new T.MeshBasicMaterial({ opacity: .56 });
    const pool = new LookContactPool(material), geometry = new T.PlaneGeometry(1.65, 1.35);
    const shadows = Array.from({ length: 13 }, () => new T.Mesh(geometry, material));
    pool.begin(); for (const shadow of shadows) pool.add(shadow, true); pool.end();
    expect(shadows.at(-1)!.visible).toBe(true);
    expect((pool.root.children[0] as T.InstancedMesh).count).toBe(12);
    pool.begin(); pool.add(shadows[0]!, false); pool.end();
    expect(pool.root.children.every(mesh => !mesh.visible)).toBe(true);
    pool.dispose(); geometry.dispose(); material.dispose();
  });
});
