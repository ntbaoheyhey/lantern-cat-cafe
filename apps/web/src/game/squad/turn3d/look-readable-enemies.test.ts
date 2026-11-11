import { afterEach, expect, it } from 'vitest';
import * as T from 'three';
import { styleReadableEnemy } from './look-readable-enemies';

afterEach(() => {
  delete window.__LOOK_V2__;
  delete window.__LOOK_ART__;
  delete window.__LOOK_B2__;
});

function reconstructedGuard() {
  const root = new T.Group();
  root.userData.lookGenerated = true;
  const material = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .88 });
  const surface = new T.Mesh(new T.BoxGeometry(), material);
  surface.name = 'button-guard_head_surface0';
  root.add(surface);
  return { root, material };
}

it('preserves the original brass, cloth and eye atlas colours on reconstructed v3 foes', () => {
  window.__LOOK_V2__ = true;
  window.__LOOK_ART__ = 'v3';
  const { root, material } = reconstructedGuard();
  styleReadableEnemy(root, 'button-guard');
  expect(material.color.getHexString()).toBe('ffffff');
  expect(material.roughness).toBe(.88);
  expect(material.userData.b2Enemy).toBe(true);
});

it('keeps the original v2 enemy relief treatment', () => {
  window.__LOOK_V2__ = true;
  window.__LOOK_ART__ = 'v2';
  const { root, material } = reconstructedGuard();
  styleReadableEnemy(root, 'button-guard');
  expect(material.color.getHexString()).toBe('ddb0c8');
});

it('does not style a generated marker when lookV2 is off', () => {
  window.__LOOK_V2__ = false;
  window.__LOOK_ART__ = 'v3';
  const { root, material } = reconstructedGuard();
  styleReadableEnemy(root, 'button-guard');
  expect(material.color.getHexString()).toBe('ffffff');
  expect(material.userData.b2Enemy).toBeUndefined();
});
