import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const palettes = [
  { trim: '#c99368', dark: '#51404b', plant: '#819b78', light: '#ffd996' },
  { trim: '#b7a177', dark: '#354e53', plant: '#a8bd79', light: '#d3f1ca' },
  { trim: '#b29ab5', dark: '#46435e', plant: '#bd92a4', light: '#c4ceff' },
];
interface StageLife { leaves: T.InstancedMesh; transform: T.Object3D; chapter: number }

/** Authored cafe depth dressing. Static shapes merge into three draws. Leaves
 * cost one instanced draw and reuse a single transform; no per-frame arrays. */
export function addCardStageLife(group: T.Group, chapter: number) {
  const palette = palettes[chapter - 1]!;
  const parts: T.BufferGeometry[][] = [[], [], []];
  const add = (g: T.BufferGeometry, color: number, x: number, y: number, z: number, rz = 0) => {
    g.rotateZ(rz); g.translate(x, y, z); parts[color]!.push(g);
  };
  // Shelves, cups, folded napkins and aprons live outside the formation lane.
  for (const side of [-1, 1]) {
    const x = side * 5.45;
    add(new T.BoxGeometry(1.6, .11, .9), 0, x, .82, -4.25);
    for (const leg of [-.59, .59]) add(new T.BoxGeometry(.08, .82, .08), 1, x + leg, .4, -4.18);
    for (let item = 0; item < 4; item++) {
      const ix = x - .56 + item * .36;
      if (chapter === 1) {
        add(new T.CylinderGeometry(.105, .08, .23, 10), 2, ix, 1, -4.14);
        const handle = new T.TorusGeometry(.065, .012, 4, 10); handle.rotateY(Math.PI / 2);
        add(handle, 0, ix + .1, 1, -4.14);
      } else if (chapter === 2) {
        add(new T.SphereGeometry(.13, 8, 6), 2, ix, 1.02, -4.14);
        add(new T.BoxGeometry(.022, .12, .022), 1, ix, 1.14, -4.14, .3);
      } else {
        add(new T.CylinderGeometry(.12, .12, .24, 12), 2, ix, 1.01, -4.14);
        add(new T.CylinderGeometry(.15, .15, .03, 12), 0, ix, 1.14, -4.14);
      }
    }
    // Hanging panels frame the windows, behind all heads.
    for (let fold = 0; fold < 6; fold++) {
      const panel = new T.CylinderGeometry(.09, .13, 2.6, 6, 1, true, 0, Math.PI);
      add(panel, 1, side * 6.1 + (fold - 2.5) * .17, 2.8, -5.12);
    }
    add(new T.BoxGeometry(.85, .035, .5), 2, side * 4.95, .08, side > 0 ? 1.95 : -2.25, side * .08);
    const spoon = new T.SphereGeometry(.12, 10, 6); spoon.scale(.65, .2, 1.4);
    add(spoon, 0, side * 5.32, .10, side > 0 ? 1.95 : -2.25);
    add(new T.BoxGeometry(.035, .02, .38), 0, side * 5.32, .10, side > 0 ? 2.20 : -2.00);
    // Foreground silhouettes improve depth without crossing the central stage.
    for (let leaf = 0; leaf < 5; leaf++) {
      const foliage = new T.SphereGeometry(.22, 8, 5); foliage.scale(.45, 1.8, .6);
      add(foliage, 2, side * (6.15 + leaf % 2 * .16), .35 + leaf * .07, 3.6, side * (.3 + leaf * .15));
    }
  }
  for (const [index, geometries] of parts.entries()) {
    const flat = geometries.map(g => g.index ? g.toNonIndexed() : g);
    const geometry = mergeGeometries(flat)!;
    for (const g of new Set([...geometries, ...flat])) g.dispose();
    const material = new T.MeshStandardMaterial({ color: [palette.trim, palette.dark, palette.plant][index], roughness: .76 });
    const mesh = new T.Mesh(geometry, material); mesh.name = `original-chapter-${chapter}-depth-${index}`; group.add(mesh);
  }
  const leafGeometry = new T.SphereGeometry(.06, 6, 4); leafGeometry.scale(.55, .14, 1.4);
  const leaves = new T.InstancedMesh(leafGeometry,
    new T.MeshStandardMaterial({ color: palette.plant, roughness: .9, transparent: true, opacity: .75, depthWrite: false }), 12);
  leaves.name = `chapter-${chapter}-drifting-${chapter === 2 ? 'leaves' : chapter === 3 ? 'ribbons' : 'petals'}`;
  leaves.instanceMatrix.setUsage(T.DynamicDrawUsage); leaves.frustumCulled = false;
  group.add(leaves);
  group.userData.cardLife = { leaves, transform: new T.Object3D(), chapter } satisfies StageLife;
  animateCardStageLife(group, 0, true);
}
export function animateCardStageLife(group: T.Group, time: number, reducedMotion: boolean) {
  const life = group.userData.cardLife as StageLife | undefined;
  if (!life) return;
  const { leaves, transform, chapter } = life, t = reducedMotion ? 0 : time;
  for (let i = 0; i < 12; i++) {
    const phase = t * (.035 + i % 3 * .006) + i * .173;
    const fall = phase - Math.floor(phase);
    transform.position.set(Math.sin(i * 7.17) * 5.9 + Math.sin(t * .3 + i) * .25,
      3.7 - fall * 3, -3.4 - i % 3 * .28);
    transform.rotation.set(Math.sin(t + i) * .4, t * .4 + i, Math.sin(t * .6 + i) * .7);
    transform.scale.set(1, 1, chapter === 3 ? 2 : 1); transform.updateMatrix(); leaves.setMatrixAt(i, transform.matrix);
  }
  leaves.instanceMatrix.needsUpdate = true;
}
