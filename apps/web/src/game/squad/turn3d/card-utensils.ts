import { enemyAdornment } from './card-enemy-adornment';
/** Original physical props, attached to the authored hand joint. Two materials
 * at most; all geometry is made during actor loading and released with it. */
import * as T from 'three';
import { batch3Prop } from './card-roster-batch3-props';
import { batch2Prop } from './card-roster-batch2-props';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export class CardUtensil {
  private meshes: T.Mesh[] = [];
  constructor(model: T.Object3D, role: string, asset: string) {
    // Roster GLBs carry their own sculpted tools in the existing animated
    // sockets. Keep their lifetime with the model and skip legacy duplicates.
    if (model.userData.lookV2 === true && (model.userData.lookProps === true
      || model.getObjectByName(role)?.userData.lookProps === true)) return;
    const authored = enemyAdornment(asset) ?? batch2Prop(asset) ?? batch3Prop(asset);
    if (authored) {
      const hand = model.getObjectByName(`${role}_${authored.hand}`);
      for (const [index, group] of authored.parts.entries()) {
        const flat = group.map(g => g.index ? g.toNonIndexed() : g);
        const geometry = mergeGeometries(flat, false)!;
        for (const g of new Set([...group, ...flat])) g.dispose();
        if (!hand) { geometry.dispose(); continue; }
        const material = new T.MeshStandardMaterial({ color: authored.colors[index], roughness: .55, metalness: .08 });
        const mesh = new T.Mesh(geometry, material); mesh.name = `original-${asset}-utensil-${index}`;
        mesh.position.set(0, .14, .12); hand.add(mesh); this.meshes.push(mesh);
      }
      return;
    }
    if (!['panko', 'mallow', 'sorrel'].includes(asset)) return;
    const arm = model.getObjectByName(`${role}_${asset === 'sorrel' ? 'armL' : 'armR'}`);
    if (!arm) return;
    const parts: T.BufferGeometry[] = [];
    const wood: T.BufferGeometry[] = [];
    const cylinder = (r1: number, r2: number, h: number, position: [number, number, number], target = parts) => {
      const g = new T.CylinderGeometry(r1, r2, h, 16); g.translate(...position); target.push(g);
    };
    const tube = (points: number[][], r: number, target = parts) => {
      const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p as [number, number, number])));
      target.push(new T.TubeGeometry(curve, 18, r, 4, false));
    };
    if (asset === 'panko') {
      cylinder(.24, .21, .055, [0, -.48, 0]);
      const rim = new T.TorusGeometry(.23, .025, 5, 20); rim.rotateX(Math.PI / 2); rim.translate(0, -.45, 0); parts.push(rim);
      cylinder(.045, .04, .32, [0, -.22, 0], wood);
    } else if (asset === 'mallow') {
      cylinder(.035, .045, .30, [0, -.20, 0], wood);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 4, x = Math.cos(a) * .15, z = Math.sin(a) * .15;
        tube([[0, -.32, 0], [x, -.50, z], [0, -.68, 0], [-x, -.50, -z], [0, -.32, 0]], .012);
      }
    } else {
      const body = new T.SphereGeometry(.21, 16, 10); body.scale(1, .82, 1); body.translate(0, -.40, 0); parts.push(body);
      cylinder(.14, .17, .035, [0, -.22, 0], wood);
      tube([[-.17, -.28, 0], [-.34, -.3, 0], [-.35, -.48, 0], [-.17, -.51, 0]], .025, wood);
      tube([[.14, -.45, 0], [.28, -.34, 0], [.32, -.24, 0]], .045);
    }
    for (const [index, group] of [parts, wood].entries()) {
      const flattened = group.map(g => g.index ? g.toNonIndexed() : g);
      const geometry = mergeGeometries(flattened, false)!;
      for (const g of new Set([...group, ...flattened])) g.dispose();
      const material = new T.MeshStandardMaterial({ color: index ? '#98734f' : asset === 'sorrel' ? '#a4d1dc' : '#cbbca4',
        roughness: index ? .65 : .34, metalness: index || asset === 'sorrel' ? .05 : .45 });
      const mesh = new T.Mesh(geometry, material); mesh.name = `original-${asset}-utensil-${index}`;
      mesh.position.set(0, .14, .12); arm.add(mesh); this.meshes.push(mesh);
    }
  }
  dispose() {
    for (const mesh of this.meshes) { mesh.removeFromParent(); mesh.geometry.dispose(); (mesh.material as T.Material).dispose(); }
    this.meshes.length = 0;
  }
}
