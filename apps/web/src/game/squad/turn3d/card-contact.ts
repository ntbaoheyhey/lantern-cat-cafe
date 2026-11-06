import * as T from 'three';

// Table top -0.02; woven rug top 0.0275; embroidery top 0.0425.
// Use world height: actor scale and jump/root motion must never bury or lift it.
export const CARD_CONTACT_HEIGHT = .044;
export function groundCardContact(shadow: T.Mesh, root: T.Group) {
  const scale = Math.max(.001, root.scale.y);
  shadow.position.y = (CARD_CONTACT_HEIGHT - root.position.y) / scale;
  const lift = Math.max(0, root.position.y);
  shadow.scale.setScalar(1 + Math.min(.32, lift * .32));
}

/** One low-poly open outline at the ankles. Keeps contact and feet visible. */
export function cardShieldGeometry() {
  const geometry = new T.TorusGeometry(.57, .016, 4, 32, Math.PI * 1.55);
  geometry.rotateX(Math.PI / 2);
  geometry.rotateY(Math.PI * .23);
  return geometry;
}
