/** Original kitchen silhouettes for the extended cast, in local XY. */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const ROSTER_PRIMITIVES = ['pan', 'bread', 'oven', 'whisk', 'spoon', 'teapot'] as const;
export type RosterPrimitive = typeof ROSTER_PRIMITIVES[number];
type Point = [number, number];
export function createRosterPrimitive(kind: RosterPrimitive): T.BufferGeometry {
  const parts: T.BufferGeometry[] = [];
  const path = (points: Point[], radius = .035) => {
    const curve = new T.CatmullRomCurve3(points.map(([x, y]) => new T.Vector3(x, y, 0)));
    parts.push(new T.TubeGeometry(curve, points.length * 4, radius, 4, false));
  };
  const panel = (points: Point[]) => {
    const shape = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)));
    parts.push(new T.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: false, curveSegments: 6 }));
  };
  const ring = (x: number, y: number, r: number, sx = 1, sy = 1) => {
    const g = new T.TorusGeometry(r, .035, 4, 24); g.scale(sx, sy, 1); g.translate(x, y, 0); parts.push(g);
  };
  const builders: Record<RosterPrimitive, () => void> = {
    pan() { ring(0, .13, .34, 1, .8); panel([[-.28, .13], [0, -.08], [.28, .13], [0, .34]]); path([[0, -.13], [0, -.62]], .065); },
    bread() {
      panel([[-.46, -.44], [-.46, .05], [-.55, .23], [-.44, .46], [-.18, .53], [0, .45], [.18, .53], [.44, .46], [.55, .23], [.46, .05], [.46, -.44]]);
      for (const x of [-.25, 0, .25]) path([[x - .07, -.17], [x, .10], [x + .07, .24]], .025);
    },
    oven() {
      path([[-.64, -.52], [-.64, .42], [-.48, .62], [.48, .62], [.64, .42], [.64, -.52], [-.64, -.52]], .065);
      path([[-.40, -.32], [-.40, .25], [.4, .25], [.4, -.32], [-.4, -.32]], .04);
      path([[-.25, .40], [.25, .40]], .065);
      for (const x of [-.25, 0, .25]) path([[x, -.25], [x - .045, -.03], [x + .045, .13]], .026);
    },
    whisk() {
      path([[0, -.65], [0, -.19]], .055);
      for (const width of [.13, .27, .40]) path([[0, -.2], [-width, .17], [-width * .7, .48], [0, .58], [width * .7, .48], [width, .17], [0, -.2]], .025);
    },
    spoon() { ring(0, .26, .24, .72, 1.25); panel([[-.14, .26], [0, .46], [.14, .26], [0, .07]]); path([[0, .02], [.02, -.38], [.1, -.63]], .045); },
    teapot() {
      panel([[-.34, -.27], [-.44, .0], [-.26, .28], [.26, .28], [.44, .0], [.34, -.27]]);
      path([[-.31, .15], [-.62, .27], [-.67, -.11], [-.33, -.17]], .04);
      panel([[.32, -.08], [.63, .32], [.72, .34], [.54, -.1], [.32, -.23]]);
      path([[-.28, .31], [.28, .31]], .04); ring(0, .38, .07);
      path([[-.30, -.31], [.30, -.31]], .04);
    },
  };
  builders[kind]();
  const normalized = parts.map(p => p.index ? p.toNonIndexed() : p);
  const result = mergeGeometries(normalized, false)!;
  for (const p of new Set([...parts, ...normalized])) p.dispose();
  result.computeBoundingSphere(); return result;
}
