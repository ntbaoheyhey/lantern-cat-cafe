import * as T from 'three';
import { ROSTER_PRIMITIVES, createRosterPrimitive, type RosterPrimitive } from './card-roster-primitives';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const CARD_EFFECT_PRIMITIVES = [
  ...ROSTER_PRIMITIVES,
  'door', 'knock-ring', 'handle', 'lantern', 'light-pool', 'apron', 'bow', 'roof',
  'window', 'ember', 'spark', 'cup', 'steam', 'ink-drop', 'ink-stain', 'wick',
  'flame', 'tray', 'star', 'comet', 'leaf', 'stem', 'droplet', 'wave',
  'wreath', 'greenhouse', 'sprout', 'button', 'seam', 'sock', 'spool', 'needle',
  'wing', 'knot', 'yarn-fan', 'cushion', 'shield-facet', 'petal', 'crescent', 'bubble',
] as const;
export type CardEffectPrimitive = typeof CARD_EFFECT_PRIMITIVES[number];
type Point = [number, number, number?];

/** Original cafe silhouettes, authored in local XY with a small physical depth. */
export function createCardPrimitive(kind: CardEffectPrimitive): T.BufferGeometry {
  if ((ROSTER_PRIMITIVES as readonly string[]).includes(kind)) return createRosterPrimitive(kind as RosterPrimitive);
  const parts: T.BufferGeometry[] = [];
  const path = (points: Point[], radius = .035) => {
    const curve = new T.CatmullRomCurve3(points.map(([x, y, z = 0]) => new T.Vector3(x, y, z)));
    parts.push(new T.TubeGeometry(curve, Math.max(8, points.length * 3), radius, 4, false));
  };
  const loop = (points: Point[], radius = .035) => path([...points, points[0]!], radius);
  const ring = (x = 0, y = 0, radius = .5, flatten = 1) => {
    const geometry = new T.TorusGeometry(radius, .025, 4, 32);
    geometry.scale(1, flatten, 1);
    geometry.translate(x, y, 0);
    parts.push(geometry);
  };
  const panel = (points: Point[], depth = .035) => {
    const shape = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)));
    const geometry = new T.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: .012, bevelSize: .012,
      bevelSegments: 1, steps: 1, curveSegments: 8,
    });
    geometry.translate(0, 0, -depth / 2);
    parts.push(geometry);
  };
  const star = (rays: number, radius: number, inner: number) => {
    panel(Array.from({ length: rays * 2 }, (_, index) => {
      const angle = index * Math.PI / rays + Math.PI / 2;
      const length = index % 2 ? inner : radius;
      return [Math.cos(angle) * length, Math.sin(angle) * length];
    }));
  };
  const leaf = (angle = 0, x = 0, y = 0, size = 1) => {
    const points: Point[] = [[0, -.45], [-.24, -.12], [-.19, .18], [0, .5], [.2, .15], [.23, -.1]];
    panel(points.map(([px, py]) => [x + (px * Math.cos(angle) - py * Math.sin(angle)) * size,
      y + (px * Math.sin(angle) + py * Math.cos(angle)) * size]));
  };
  const builders: Record<Exclude<CardEffectPrimitive, RosterPrimitive>, () => void> = {
    door() {
      path([[-.46, -.58], [-.46, .5], [0, .68], [.46, .5], [.46, -.58]], .055);
      path([[-.31, -.52], [-.31, .39], [.10, .48], [.10, -.44]], .032);
      path([[-.58, -.58], [.58, -.58]], .055);
    },
    'knock-ring'() {
      ring(0, 0, .48, .84);
      for (const angle of [-.7, 0, .7]) path([[Math.cos(angle) * .58, Math.sin(angle) * .58],
        [Math.cos(angle) * .76, Math.sin(angle) * .76]], .04);
    },
    handle() {
      ring(0, .08, .20, 1.15);
      panel([[-.055, -.37], [-.055, .02], [.055, .02], [.055, -.37]]);
    },
    lantern() {
      loop([[-.24, -.3], [-.31, .2], [-.16, .4], [.16, .4], [.31, .2], [.24, -.3]], .045);
      path([[-.16, .4], [0, .56], [.16, .4]], .035);
      path([[0, -.22], [0, .25]], .075);
      path([[-.34, -.34], [.34, -.34]], .04);
    },
    'light-pool'() {
      ring(0, 0, .55, .62);
      ring(0, 0, .38, .62);
      for (let index = 0; index < 8; index++) {
        const angle = index / 8 * Math.PI * 2;
        path([[Math.cos(angle) * .63, Math.sin(angle) * .39],
          [Math.cos(angle) * .78, Math.sin(angle) * .49]], .025);
      }
    },
    apron() {
      panel([[-.22, .5], [.22, .5], [.28, .16], [.48, -.5], [-.48, -.5], [-.28, .16]]);
      path([[-.14, .08], [-.12, -.17], [.12, -.17], [.14, .08]], .018);
      path([[-.22, .48], [-.3, .7], [.3, .7], [.22, .48]], .025);
    },
    bow() {
      loop([[0, 0], [-.42, .28], [-.5, -.12], [0, 0], [.42, .28], [.5, -.12], [0, 0]], .045);
      path([[-.05, -.04], [-.19, -.48], [-.3, -.32]], .04);
      path([[.05, -.04], [.19, -.48], [.3, -.32]], .04);
      ring(0, 0, .07);
    },
    roof() {
      panel([[-.7, .06], [0, .62], [.7, .06], [.55, -.08], [0, .38], [-.55, -.08]]);
      path([[-.5, -.05], [-.5, -.48]], .045);
      path([[.5, -.05], [.5, -.48]], .045);
    },
    window() {
      loop([[-.38, -.43], [-.38, .43], [.38, .43], [.38, -.43]], .035);
      path([[-.38, 0], [.38, 0]], .025);
      path([[0, -.43], [0, .43]], .025);
    },
    ember() {
      const geometry = new T.IcosahedronGeometry(.32, 1);
      geometry.scale(.7, 1.4, .65);
      parts.push(geometry);
    },
    spark() { star(4, .5, .07); },
    cup() {
      path([[-.42, .25], [-.32, -.24], [0, -.4], [.32, -.24], [.42, .25]], .05);
      ring(0, .25, .42, .20);
      path([[.4, .18], [.63, .17], [.63, -.1], [.37, -.16]], .045);
      path([[-.46, -.45], [0, -.5], [.46, -.45]], .03);
    },
    steam() {
      for (const x of [-.2, .2]) path([[x, -.5], [x - .13, -.14], [x + .09, .2], [x, .54]], .035);
    },
    'ink-drop'() { panel([[0, .6], [-.3, -.05], [-.24, -.38], [0, -.5], [.24, -.38], [.3, -.05]]); },
    'ink-stain'() {
      const points: Point[] = Array.from({ length: 16 }, (_, index) => {
        const angle = index / 16 * Math.PI * 2;
        const radius = index % 2 ? .30 : .52 + .08 * Math.sin(index * 3.1);
        return [Math.cos(angle) * radius, Math.sin(angle) * radius];
      });
      panel(points, .02);
    },
    wick() {
      path(Array.from({ length: 21 }, (_, index) => {
        const angle = index / 20 * Math.PI * 3;
        return [Math.cos(angle) * .18, -.5 + index / 20, Math.sin(angle) * .09];
      }), .048);
    },
    flame() {
      panel([[0, -.5], [-.3, -.25], [-.24, .1], [-.06, .42], [0, .08], [.2, .63], [.35, .08], [.25, -.3]]);
    },
    tray() {
      ring(0, 0, .55, .3);
      path([[-.55, 0], [-.5, -.18], [.5, -.18], [.55, 0]], .035);
      path([[-.58, .02], [-.72, .13]], .035);
      path([[.58, .02], [.72, .13]], .035);
    },
    star() { star(5, .48, .2); },
    comet() {
      star(4, .25, .08);
      for (let index = 0; index < 3; index++) path([[-.12, -.04 + index * .08],
        [-.45, .15 + index * .10], [-.72, .38 + index * .11]], .035 - index * .006);
    },
    leaf() { leaf(); path([[0, -.45], [0, .4]], .018); },
    stem() {
      path([[0, -.6], [-.06, -.15], [.06, .25], [0, .65]], .045);
      leaf(-.7, -.16, -.12, .48);
      leaf(.7, .18, .22, .52);
    },
    droplet() {
      loop([[0, .6], [-.25, .02], [-.22, -.3], [0, -.45], [.22, -.3], [.25, .02]], .045);
      path([[-.08, -.23], [-.12, -.03]], .025);
    },
    wave() {
      path([[-.65, -.26], [-.36, -.18], [-.25, .23], [.05, .45], [.36, .34], [.38, .1], [.15, .1]], .06);
      path([[-.6, -.4], [0, -.33], [.6, -.4]], .035);
    },
    wreath() {
      for (let index = 0; index < 7; index++) {
        const angle = index / 7 * Math.PI * 2;
        leaf(angle - Math.PI / 2, Math.cos(angle) * .40, Math.sin(angle) * .40, .43);
      }
    },
    greenhouse() {
      path([[-.55, -.48], [-.55, .1], [-.35, .48], [0, .68], [.35, .48], [.55, .1], [.55, -.48]], .04);
      path([[0, -.48], [0, .68]], .03);
      path([[-.55, -.06], [.55, -.06]], .03);
      path([[-.67, -.5], [.67, -.5]], .05);
    },
    sprout() {
      path([[0, -.48], [0, .26]], .045);
      leaf(-.8, -.19, .14, .65);
      leaf(.8, .19, .30, .65);
    },
    button() {
      ring(0, 0, .49);
      ring(0, 0, .40);
      for (const x of [-.14, .14]) for (const y of [-.14, .14]) ring(x, y, .065);
    },
    seam() {
      path([[-.58, 0], [.58, 0]], .025);
      for (let index = 0; index < 5; index++) path([[-.46 + index * .23, -.15], [-.38 + index * .23, .15]], .03);
    },
    sock() {
      panel([[-.24, .55], [.2, .55], [.2, -.12], [.51, -.28], [.43, -.5], [-.18, -.42], [-.26, -.18]]);
      path([[-.22, .38], [.18, .38]], .025);
    },
    spool() {
      for (const x of [-.36, .36]) ring(x, 0, .30, 1.4);
      path([[-.36, -.32], [.36, -.32]], .035);
      path([[-.36, .32], [.36, .32]], .035);
      for (let index = 0; index < 4; index++) path([[-.28 + index * .16, -.28], [-.18 + index * .16, .28]], .03);
    },
    needle() {
      panel([[-.7, 0], [.32, -.055], [.32, .055]]);
      ring(.43, 0, .13, .42);
    },
    wing() {
      panel([[0, -.38], [-.35, -.18], [-.56, .48], [-.08, .26], [0, .02], [.08, .26], [.56, .48], [.35, -.18]]);
      path([[0, -.38], [0, .35]], .03);
    },
    knot() {
      path([[0, 0], [-.45, .22], [-.30, .5], [.17, .1], [.4, .42], [.5, .08], [0, 0], [-.25, -.48], [.15, -.1], [.3, -.48]], .05);
    },
    'yarn-fan'() {
      for (let index = 0; index < 5; index++) path([[0, -.5], [(index - 2) * .18, .05], [(index - 2) * .32, .55]], .045);
    },
    cushion() {
      loop([[-.52, -.32], [-.62, .4], [0, .31], [.62, .4], [.52, -.32], [0, -.26]], .065);
      path([[-.36, -.12], [-.40, .16]], .025);
      path([[.36, -.12], [.40, .16]], .025);
    },
    'shield-facet'() { panel([[0, .55], [-.42, .2], [-.30, -.28], [0, -.56], [.30, -.28], [.42, .2]], .08); },
    petal() { panel([[0, -.46], [-.25, -.02], [-.13, .4], [.10, .53], [.26, .17], [.2, -.18]], .025); },
    crescent() {
      path([[-.36, -.45], [.08, -.42], [.39, -.12], [.41, .28], [.17, .52], [.25, .15], [.10, -.13], [-.36, -.45]], .04);
    },
    bubble() {
      ring(0, 0, .42);
      path([[-.24, .10], [-.21, .24], [-.08, .31]], .035);
    },
  };
  builders[kind as Exclude<CardEffectPrimitive, RosterPrimitive>]();
  const flattened = parts.map(geometry => geometry.index ? geometry.toNonIndexed() : geometry);
  const merged = mergeGeometries(flattened, false);
  for (const geometry of new Set([...parts, ...flattened])) geometry.dispose();
  if (!merged) throw new Error(`Could not compose card effect primitive ${kind}`);
  merged.name = `original-card-effect-${kind}`;
  merged.computeBoundingSphere();
  return merged;
}
