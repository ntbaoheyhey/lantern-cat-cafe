// Original procedural miniature geometry. All distances are in tabletop units.
import * as THREE from '../../apps/web/node_modules/three/build/three.module.js';
import { mergeGeometries, mergeVertices } from '../../apps/web/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
export { THREE };

export const PALETTE = Object.freeze({
  ink: '#292535', cream: '#fff0cd', ivory: '#fff9e8', honey: '#d7983b', gold: '#ffcd68',
  peach: '#edac8b', rose: '#db7d87', charcoal: '#444352', shadow: '#343140',
  violet: '#78609c', lilac: '#bba3d6', mint: '#a9d6b0', teal: '#347d79', leaf: '#548e69',
  sage: '#c1d7a0', wood: '#bb8058', copper: '#a5634a', red: '#b84859', coral: '#e96971',
  redDark: '#843d53', blue: '#6c9baf', paleBlue: '#b3d7d7', knot: '#ffce76',
});
const buckets = new WeakMap();
const matte = new THREE.MeshStandardMaterial({ name: 'original_matte_vertex_paint', vertexColors: true, roughness: .87, metalness: 0 });

export function group(parent, name, position = [0, 0, 0]) {
  const node = new THREE.Group(); node.name = name; node.position.fromArray(position);
  parent?.add(node); buckets.set(node, []); return node;
}

export function add(parent, geometry, color, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geometry.dispose(); g.deleteAttribute('uv'); g.deleteAttribute('uv1'); g.deleteAttribute('tangent');
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
  g.applyMatrix4(m);
  const c = new THREE.Color(color); const a = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!g.attributes.normal) g.computeVertexNormals();
  buckets.get(parent).push(g); return g;
}

export function ellipsoid(p, color, pos, scale, segments = 12, rings = 7, rot = [0, 0, 0]) {
  return add(p, new THREE.SphereGeometry(1, segments, rings), color, pos, scale, rot);
}
export function cylinder(p, color, pos, top, bottom, height, segments = 12, rotation = [0, 0, 0]) {
  return add(p, new THREE.CylinderGeometry(top, bottom, height, segments), color, pos, [1, 1, 1], rotation);
}
export function torus(p, color, pos, radius, tubeRadius, rotation = [0, 0, 0], segments = 18, radial = 5, arc = Math.PI * 2) {
  return add(p, new THREE.TorusGeometry(radius, tubeRadius, radial, segments, arc), color, pos, [1, 1, 1], rotation);
}
export function tube(p, color, points, radius = .025, segments = 10, radial = 5, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)), closed);
  return add(p, new THREE.TubeGeometry(curve, segments, radius, radial, closed), color);
}
export function rod(p, color, a, b, radius = .025, segments = 7, endRadius = radius) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  const g = new THREE.CylinderGeometry(endRadius, radius, delta.length(), segments);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  return add(p, g, color, from.add(to).multiplyScalar(.5).toArray());
}
export function polygon(p, color, pts, depth, pos = [0, 0, 0], bevel = .025, rot = [0, 0, 0]) {
  const shape = new THREE.Shape(); shape.moveTo(...pts[0]); for (const xy of pts.slice(1)) shape.lineTo(...xy); shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 4 });
  geom.translate(0, 0, -depth / 2); return add(p, geom, color, pos, [1, 1, 1], rot);
}
export function roundedBox(p, color, pos, size, radius = .06, rot = [0, 0, 0]) {
  const [w, h, d] = size, x = -w / 2, y = -h / 2, r = Math.min(radius, w / 3, h / 3, d / 3);
  const s = new THREE.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - r, bevelEnabled: true, bevelSize: r / 2, bevelThickness: r / 2, bevelSegments: 1, steps: 1, curveSegments: 3 }); g.translate(0, 0, -(d - r) / 2);
  return add(p, g, color, pos, [1, 1, 1], rot);
}

// Sculpted elliptical ring loft. Each ring is [height, radiusX, radiusZ, centerX, centerZ].
// Useful for a plush cheek silhouette, bent sock, flask, kettle, and a drooping hat.
export function loft(p, color, rings, segments = 16, pos = [0, 0, 0], rotation = [0, 0, 0]) {
  const v = [], ix = [];
  for (const [y, rx, rz, cx = 0, cz = 0] of rings) for (let i = 0; i < segments; i++) {
    const a = i / segments * Math.PI * 2; v.push(cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz);
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < segments; i++) {
    const a = j * segments + i, b = j * segments + (i + 1) % segments, c = b + segments, d = a + segments;
    ix.push(a, d, b, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(ix); g.computeVertexNormals();
  return add(p, g, color, pos, [1, 1, 1], rotation);
}

export function leaf(p, color, pos, size = 1, rot = [0, 0, 0]) {
  return polygon(p, color, [[0, -.16 * size], [-.11 * size, -.04 * size], [-.10 * size, .08 * size], [0, .22 * size], [.10 * size, .08 * size], [.11 * size, -.04 * size]], .035 * size, pos, .014 * size, rot);
}
export function star(p, color, pos, r = .1, depth = .025, rot = [0, 0, 0]) {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5; const z = i % 2 ? r * .46 : r; return [Math.cos(a) * z, Math.sin(a) * z]; });
  return polygon(p, color, pts, depth, pos, .008, rot);
}

export function stitch(p, color, a, b, count, radius = .009, offset = [0, .035, 0]) {
  for (let i = 0; i < count; i++) {
    const t = (i + .5) / count, mid = a.map((v, j) => v + (b[j] - v) * t);
    rod(p, color, mid.map((v, j) => v - offset[j]), mid.map((v, j) => v + offset[j]), radius, 4);
  }
}

export function finish(root) {
  root.traverse(node => {
    const gs = buckets.get(node); if (!gs?.length) return;
    const merged = mergeGeometries(gs, false); const welded = mergeVertices(merged, 1e-5);
    welded.computeBoundingSphere();
    const mesh = new THREE.Mesh(welded, matte); mesh.name = `${node.name}_surface`; mesh.castShadow = true; mesh.receiveShadow = true;
    node.add(mesh); gs.forEach(g => g.dispose()); merged.dispose(); buckets.delete(node);
  });
  return root;
}
