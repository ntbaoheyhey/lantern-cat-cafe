/** Original bakery, paper and bedside emblems; no borrowed silhouettes. */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const BATCH2_PRIMITIVES = ['roller', 'crumb-crown', 'paper-cat', 'ink-cap', 'spice-star', 'serving-bell', 'apron-cloth'] as const;
export type Batch2Primitive = typeof BATCH2_PRIMITIVES[number];
export function createBatch2Primitive(kind: Batch2Primitive): T.BufferGeometry {
  const parts: T.BufferGeometry[] = [];
  const line = (points: number[][], r = .035) => parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(p[0], p[1], 0))), points.length * 4, r, 4, false));
  const panel = (points: number[][]) => parts.push(new T.ExtrudeGeometry(new T.Shape(points.map(p => new T.Vector2(p[0], p[1]))), { depth: .04, bevelEnabled: false }));
  const ring = (x: number, y: number, radius: number, sx = 1, sy = 1) => { const g = new T.TorusGeometry(radius, .03, 4, 20); g.scale(sx, sy, 1); g.translate(x, y, 0); parts.push(g); };
  const builders: Record<Batch2Primitive, () => void> = {
    roller() { panel([[-.40, -.19], [-.40, .19], [.40, .19], [.40, -.19]]); line([[-.65, 0], [.65, 0]], .06); for (const x of [-.28, .28]) line([[x, -.18], [x, .18]], .025); },
    'crumb-crown'() { panel([[-.55, -.25], [-.6, .35], [-.25, .1], [0, .55], [.25, .1], [.6, .35], [.55, -.25]]); line([[-.5, -.32], [.5, -.32]], .05); ring(0, -.05, .09); },
    'paper-cat'() { panel([[-.38, -.48], [-.48, -.10], [-.34, .12], [-.39, .56], [0, .28], [.39, .56], [.34, .12], [.48, -.10], [.38, -.48]]); line([[-.3, -.37], [0, -.05], [.3, -.37]], .025); line([[-.23, .12], [-.10, .12]], .03); line([[.1, .12], [.23, .12]], .03); },
    'ink-cap'() { panel([[-.63, -.02], [-.46, .32], [-.19, .53], [.19, .53], [.46, .32], [.63, -.02]]); line([[-.58, -.07], [.58, -.07]], .05); panel([[-.12, -.08], [-.17, -.51], [.17, -.51], [.12, -.08]]); for (const x of [-.30, .08, .32]) ring(x, x === .08 ? .30 : .16, .065); },
    'spice-star'() { const points = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, r = i % 2 ? .18 : .58; return [Math.cos(a) * r, Math.sin(a) * r]; }); panel(points); ring(0, 0, .10); },
    'serving-bell'() { panel([[-.58, -.20], [-.50, .05], [-.33, .3], [0, .40], [.33, .3], [.50, .05], [.58, -.20]]); line([[-.64, -.28], [.64, -.28]], .05); ring(0, .49, .08); line([[-.29, .04], [-.17, .20], [0, .25]], .025); },
    'apron-cloth'() { panel([[-.24, .55], [.24, .55], [.31, .16], [.52, -.46], [-.52, -.46], [-.31, .16]]); line([[-.22, .56], [0, .70], [.22, .56]], .035); line([[-.52, .08], [-.29, .16], [.29, .16], [.52, .08]], .045); line([[-.17, -.08], [-.17, -.29], [.17, -.29], [.17, -.08]], .025); },
  };
  builders[kind](); const flat = parts.map(p => p.index ? p.toNonIndexed() : p);
  const result = mergeGeometries(flat, false)!;
  for (const part of new Set([...parts, ...flat])) part.dispose(); result.computeBoundingSphere(); return result;
}
