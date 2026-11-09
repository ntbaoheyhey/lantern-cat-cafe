import { expect, it, vi } from 'vitest';
import * as T from 'three';
import { disposeLookStage } from './look-stage';

it('releases shared stage resources and an unattached lightmap after a cancelled load', () => {
  const stage = new T.Group();
  const geometry = new T.BoxGeometry();
  const color = new T.Texture(), normal = new T.Texture(), irradiance = new T.Texture();
  const material = new T.MeshStandardMaterial({ map: color, normalMap: normal });
  stage.add(new T.Mesh(geometry, material), new T.Mesh(geometry, [material, material]));
  stage.userData.ownedTextures = [color, irradiance];
  const resources = [geometry, material, color, normal, irradiance];
  const dispose = resources.map(resource => vi.spyOn(resource, 'dispose'));
  disposeLookStage(stage);
  for (const spy of dispose) expect(spy).toHaveBeenCalledTimes(1);
});
