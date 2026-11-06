import * as T from 'three';
/** Original sewing-room silhouettes. Two merged draws per actor, owned by CardUtensil. */
export function enemyAdornment(asset: string): { parts: T.BufferGeometry[][]; colors: string[]; hand: 'armL' | 'armR' } | undefined {
  if (!['button-guard', 'sock-skipper', 'spool-ram'].includes(asset)) return;
  const body: T.BufferGeometry[] = [], trim: T.BufferGeometry[] = [];
  const box = (x: number, y: number, z: number, p: [number, number, number], group = body) => {
    const g = new T.BoxGeometry(x, y, z); g.translate(...p); group.push(g);
  };
  const ring = (r: number, tube: number, p: [number, number, number], group = trim) => {
    const g = new T.TorusGeometry(r, tube, 5, 18); g.translate(...p); group.push(g);
  };
  if (asset === 'button-guard') {
    const shape = new T.Shape([[-.23, -.15], [-.18, -.56], [0, -.68], [.18, -.56], [.23, -.15], [0, -.30]].map(p => new T.Vector2(p[0], p[1])));
    body.push(new T.ExtrudeGeometry(shape, { depth: .05, bevelEnabled: false }));
    ring(.082, .024, [0, -.45, .08]);
    for (const x of [-.03, .03]) box(.012, .065, .014, [x, -.45, .081], trim);
  } else if (asset === 'sock-skipper') {
    box(.31, .27, .09, [0, -.39, .02]);
    ring(.082, .018, [-.085, -.24, .04]); ring(.082, .018, [.085, -.24, .04]);
    box(.25, .035, .11, [0, -.27, .035], trim);
    const flap = new T.BoxGeometry(.29, .14, .04); flap.rotateX(-.25); flap.translate(0, -.27, .085); body.push(flap);
  } else {
    const axle = new T.CylinderGeometry(.10, .10, .30, 14); axle.rotateZ(Math.PI / 2); axle.translate(0, -.40, .02); body.push(axle);
    for (const x of [-.18, .18]) { const rim = new T.CylinderGeometry(.19, .19, .04, 14); rim.rotateZ(Math.PI / 2); rim.translate(x, -.40, .02); trim.push(rim); }
    box(.035, .18, .035, [.23, -.32, .02], trim); box(.10, .035, .035, [.27, -.24, .02], trim);
  }
  return { parts: [body, trim], colors: asset === 'button-guard' ? ['#96755b', '#efcd86'] : asset === 'sock-skipper' ? ['#b884a3', '#e9c7a4'] : ['#ad9bc7', '#795a88'], hand: asset === 'button-guard' ? 'armL' : 'armR' };
}
