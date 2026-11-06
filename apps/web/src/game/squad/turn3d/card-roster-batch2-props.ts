import * as T from 'three';
/** Return unmerged owned parts. CardUtensil merges and disposes every intermediate. */
export function batch2Prop(asset: string): { parts: T.BufferGeometry[][]; colors: string[]; hand: 'armL' | 'armR' } | undefined {
  if (!['biscuit', 'inkcap', 'cinnamon'].includes(asset)) return;
  const wood: T.BufferGeometry[] = [], detail: T.BufferGeometry[] = [];
  const cylinder = (a: number, b: number, h: number, p: [number, number, number], group = wood) => { const g = new T.CylinderGeometry(a, b, h, 14); g.translate(...p); group.push(g); };
  if (asset === 'biscuit') {
    const pin = new T.CylinderGeometry(.09, .09, .52, 16); pin.rotateZ(Math.PI / 2); pin.translate(0, -.40, .07); wood.push(pin);
    for (const x of [-.33, .33]) { const grip = new T.CylinderGeometry(.045, .045, .15, 12); grip.rotateZ(Math.PI / 2); grip.translate(x, -.40, .07); detail.push(grip); }
  } else if (asset === 'inkcap') {
    const shape = new T.Shape([[-.17, -.55], [-.23, -.33], [-.15, -.20], [-.18, .0], [0, -.12], [.18, .0], [.15, -.20], [.23, -.33], [.17, -.55]].map(p => new T.Vector2(p[0], p[1])));
    wood.push(new T.ExtrudeGeometry(shape, { depth: .055, bevelEnabled: false }));
    for (const x of [-.075, .075]) { const eye = new T.SphereGeometry(.02, 8, 6); eye.scale(1, .7, .4); eye.translate(x, -.23, .06); detail.push(eye); }
    cylinder(.018, .018, .24, [0, .04, .015], detail);
  } else {
    cylinder(.105, .085, .28, [0, -.39, .05]); cylinder(.065, .065, .08, [0, -.21, .05], detail);
    const ring = new T.TorusGeometry(.078, .012, 4, 16); ring.rotateX(Math.PI / 2); ring.translate(0, -.26, .05); detail.push(ring);
    for (let i = 0; i < 5; i++) { const seed = new T.SphereGeometry(.014, 6, 4); seed.translate(Math.sin(i * 2.4) * .055, -.42 + i * .025, .14); detail.push(seed); }
  }
  return { parts: [wood, detail], colors: asset === 'biscuit' ? ['#c19a69', '#825b47'] : asset === 'inkcap' ? ['#c4b3d0', '#58446c'] : ['#bc7d57', '#e5c79b'], hand: asset === 'inkcap' ? 'armL' : 'armR' };
}
