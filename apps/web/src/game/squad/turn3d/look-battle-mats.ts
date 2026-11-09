import * as T from 'three';
import indices from './look-mat-indices.json';
/** Original baked geometry, indexed by the authoring tool. Keep the UVs/atlas. */
export function tightenBattleMats(stage: T.Group) {
  stage.updateMatrixWorld(true);
  const mesh = stage.getObjectByName('atelier-cafe-static');
  if (!(mesh instanceof T.Mesh)) return;
  const geometry = mesh.geometry;
  const source = geometry.getAttribute('position');
  const position = new T.Float32BufferAttribute(new Float32Array(source.count * 3), 3);
  const color = new T.Float32BufferAttribute(new Float32Array(source.count * 3).fill(1), 3);
  const point = new T.Vector3(), inverse = mesh.matrixWorld.clone().invert();
  for (let i = 0; i < source.count; i++) position.setXYZ(i, source.getX(i), source.getY(i), source.getZ(i));
  for (const i of indices) {
    point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    const side = Math.sign(point.x);
    point.x = side * 2.15 + (point.x - side * 2.85) * .9;
    point.z *= .80;
    point.applyMatrix4(inverse); position.setXYZ(i, point.x, point.y, point.z);
    if (side > 0) color.setXYZ(i, .85, .48, .58);
  }
  geometry.setAttribute('position', position); geometry.setAttribute('color', color);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.vertexColors = true;
}
