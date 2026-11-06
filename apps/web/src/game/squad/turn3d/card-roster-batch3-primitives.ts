/** Original night-watch, theatre-thread and garden silhouettes. */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const BATCH3_PRIMITIVES = ['night-bell', 'blanket', 'collar', 'constellation', 'veil', 'spindle', 'seed-pod', 'flower-bell', 'shears', 'watering-can'] as const;
export type Batch3Primitive = typeof BATCH3_PRIMITIVES[number];
export function createBatch3Primitive(kind: Batch3Primitive): T.BufferGeometry {
  const parts: T.BufferGeometry[] = [];
  const line = (p: number[][], r = .035) => parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(p.map(v => new T.Vector3(v[0], v[1], 0))), p.length * 4, r, 4, false));
  const panel = (p: number[][]) => parts.push(new T.ExtrudeGeometry(new T.Shape(p.map(v => new T.Vector2(v[0], v[1]))), { depth: .04, bevelEnabled: false }));
  const ring = (x: number, y: number, radius: number, sx = 1, sy = 1) => { const g = new T.TorusGeometry(radius, .03, 4, 20); g.scale(sx, sy, 1); g.translate(x, y, 0); parts.push(g); };
  const builders: Record<Batch3Primitive, () => void> = {
    'night-bell'() { panel([[-.45, -.23], [-.24, .24], [-.16, .38], [.16, .38], [.24, .24], [.45, -.23]]); line([[-.52, -.30], [.52, -.30]], .055); ring(0, .5, .09); ring(0, -.37, .065); },
    blanket() { panel([[-.55, -.4], [-.63, .48], [.50, .44], [.62, -.48], [.25, -.36], [0, -.5], [-.28, -.36]]); for (const x of [-.35, 0, .35]) line([[x - .05, -.28], [x, .35]], .025); line([[-.45, .17], [.45, .17]], .025); },
    collar() { panel([[-.60, .34], [-.1, .10], [-.29, -.35], [-.62, -.06]]); panel([[.60, .34], [.1, .10], [.29, -.35], [.62, -.06]]); ring(0, .14, .07); line([[-.52, .40], [0, .22], [.52, .40]], .035); },
    constellation() { const p = [[-.55, -.22], [-.38, .38], [.05, .16], [.35, .55], [.6, -.12], [.12, -.46]]; line(p, .025); for (const [x, y] of p) { panel([[x! - .1, y!], [x!, y! + .13], [x! + .1, y!], [x!, y! - .13]]); } },
    veil() { panel([[-.62, .52], [.62, .52], [.45, -.50], [.16, -.32], [0, -.52], [-.20, -.32], [-.45, -.50]]); for (const x of [-.4, -.15, .15, .4]) line([[x, .45], [x * .8 + .05, 0], [x * .7, -.28]], .025); },
    spindle() { panel([[-.10, -.5], [-.37, -.26], [-.15, .31], [0, .65], [.15, .31], [.37, -.26], [.10, -.5]]); line([[0, -.65], [0, .67]], .035); for (const y of [-.2, -.05, .1]) line([[-.19, y], [.19, y + .1]], .025); },
    'seed-pod'() { panel([[0, -.6], [-.35, -.28], [-.42, .15], [-.18, .48], [.18, .48], [.42, .15], [.35, -.28]]); line([[0, -.48], [0, .36]], .035); for (const y of [-.2, .05, .28]) ring(y === .05 ? .17 : -.17, y, .07); },
    'flower-bell'() { line([[0, -.55], [0, .5], [.2, .6]], .03); for (const x of [-.29, 0, .29]) panel([[x - .20, .18], [x - .12, .42], [x + .12, .42], [x + .20, .18], [x, .05]]); panel([[0, -.23], [-.42, .0], [-.30, -.26]]); },
    shears() { ring(-.23, -.32, .17); ring(.23, -.32, .17); panel([[-.28, -.18], [.08, .06], [.48, .62], [.12, .36]]); panel([[.28, -.18], [-.08, .06], [-.48, .62], [-.12, .36]]); ring(0, .02, .07); },
    'watering-can'() { panel([[-.36, -.37], [-.38, .23], [.30, .23], [.40, -.37]]); line([[-.33, .15], [-.65, .25], [-.65, -.20], [-.34, -.28]], .045); panel([[.28, -.15], [.57, .27], [.68, .25], [.43, -.31]]); line([[.52, .31], [.75, .22]], .07); ring(-.03, .32, .11, 1.25, .6); },
  };
  builders[kind](); const flat = parts.map(p => p.index ? p.toNonIndexed() : p);
  const result = mergeGeometries(flat, false)!; for (const p of new Set([...parts, ...flat])) p.dispose(); result.computeBoundingSphere(); return result;
}
