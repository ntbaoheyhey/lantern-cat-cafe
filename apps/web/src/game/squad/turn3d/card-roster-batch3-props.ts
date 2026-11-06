import * as T from 'three';
/** Small original tools read as silhouettes even when the scene is paused. */
export function batch3Prop(asset: string): { parts: T.BufferGeometry[][]; colors: string[]; hand: 'armL' | 'armR' } | undefined {
  if (!['brioche', 'velvet', 'marigold'].includes(asset)) return;
  const body: T.BufferGeometry[] = [], trim: T.BufferGeometry[] = [];
  const tube = (p: number[][], r: number, group = trim) => group.push(new T.TubeGeometry(new T.CatmullRomCurve3(p.map(v => new T.Vector3(v[0], v[1], v[2]))), 16, r, 4, false));
  const cylinder = (a: number, b: number, h: number, p: [number, number, number], group = body) => { const g = new T.CylinderGeometry(a, b, h, 14); g.translate(...p); group.push(g); };
  if (asset === 'brioche') {
    cylinder(.07, .21, .27, [0, -.40, .05]); cylinder(.025, .035, .23, [0, -.17, .05], trim);
    const rim = new T.TorusGeometry(.20, .02, 5, 20); rim.rotateX(Math.PI / 2); rim.translate(0, -.535, .05); trim.push(rim);
    const clapper = new T.SphereGeometry(.04, 10, 6); clapper.translate(0, -.56, .05); trim.push(clapper);
  } else if (asset === 'velvet') {
    cylinder(.012, .018, .65, [0, -.38, .05], trim);
    const spool = new T.CylinderGeometry(.10, .065, .27, 12); spool.translate(0, -.35, .05); body.push(spool);
    tube([[0, -.35, .05], [.18, -.42, .09], [.22, -.65, .02], [.10, -.75, -.02]], .025, body);
  } else {
    cylinder(.14, .17, .25, [0, -.38, .05]);
    tube([[-.12, -.27, .05], [-.29, -.26, .05], [-.30, -.46, .05], [-.14, -.49, .05]], .023);
    tube([[.14, -.43, .05], [.26, -.30, .05], [.31, -.18, .05]], .03, body);
    const rose = new T.CylinderGeometry(.07, .07, .035, 10); rose.rotateZ(-.45); rose.translate(.32, -.17, .05); trim.push(rose);
    cylinder(.025, .025, .16, [0, -.17, .05], trim);
  }
  return { parts: [body, trim], colors: asset === 'brioche' ? ['#b9a275', '#e6d6a5'] : asset === 'velvet' ? ['#987bad', '#c2b5cf'] : ['#8dad8e', '#d1bc82'], hand: asset === 'velvet' ? 'armL' : 'armR' };
}
