import * as T from 'three';
/** Original sewing-room silhouettes. Two merged draws per actor, owned by CardUtensil. */
export function enemyAdornment(asset: string): { parts: T.BufferGeometry[][]; colors: string[]; hand: 'armL' | 'armR' } | undefined {
  if (!['button-guard', 'sock-skipper', 'spool-ram', 'needle-moth', 'teacup-healer', 'kettle-knight'].includes(asset)) return;
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
  } else if (asset === 'needle-moth') {
    const needle = new T.CylinderGeometry(.015, .02, .58, 8); needle.translate(0, -.38, .03); body.push(needle);
    ring(.06, .012, [0, -.09, .03]);
    const thread = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,-.09,.03),new T.Vector3(.20,-.24,.03),new T.Vector3(.12,-.56,.03)]),14,.012,4,false);trim.push(thread);
  } else if (asset === 'teacup-healer') {
    const cup = new T.CylinderGeometry(.17,.12,.21,14,1,true);cup.translate(0,-.39,.02);body.push(cup);
    const saucer=new T.CylinderGeometry(.24,.21,.035,16);saucer.translate(0,-.51,.02);trim.push(saucer);ring(.075,.02,[.18,-.39,.02]);
  } else if (asset === 'kettle-knight') {
    const kettle = new T.SphereGeometry(.21,16,10);kettle.scale(1,.87,1);kettle.translate(0,-.41,.03);body.push(kettle);
    const lid=new T.CylinderGeometry(.14,.16,.035,14);lid.translate(0,-.24,.03);trim.push(lid);
    ring(.12,.022,[-.20,-.35,.03]);
    const spout=new T.CylinderGeometry(.04,.06,.24,10);spout.rotateZ(-.65);spout.translate(.24,-.33,.03);body.push(spout);
  } else {
    const axle = new T.CylinderGeometry(.10, .10, .30, 14); axle.rotateZ(Math.PI / 2); axle.translate(0, -.40, .02); body.push(axle);
    for (const x of [-.18, .18]) { const rim = new T.CylinderGeometry(.19, .19, .04, 14); rim.rotateZ(Math.PI / 2); rim.translate(x, -.40, .02); trim.push(rim); }
    box(.035, .18, .035, [.23, -.32, .02], trim); box(.10, .035, .035, [.27, -.24, .02], trim);
  }
  return { parts: [body, trim], colors: asset === 'button-guard' ? ['#96755b', '#efcd86'] : asset === 'sock-skipper' ? ['#b884a3', '#e9c7a4'] : ['#ad9bc7', '#795a88'], hand: asset === 'button-guard' ? 'armL' : 'armR' };
}
