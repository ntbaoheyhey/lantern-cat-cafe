import * as T from 'three';
/** Original sewing-room silhouettes. Two merged draws per actor, owned by CardUtensil. */
export function enemyAdornment(asset: string): { parts: T.BufferGeometry[][]; colors: string[]; hand: 'armL' | 'armR' } | undefined {
  if (!['button-guard', 'sock-skipper', 'spool-ram', 'needle-moth', 'teacup-healer', 'kettle-knight', 'binding-thread', 'practice-cushion', 'pollen-scout', 'crumb-sentinel'].includes(asset)) return;
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
  } else if (asset === 'binding-thread') {
    const bobbin=new T.CylinderGeometry(.09,.09,.3,12);bobbin.translate(0,-.38,.03);body.push(bobbin);
    for(const y of [-.22,-.54]){const disc=new T.CylinderGeometry(.17,.17,.035,14);disc.translate(0,y,.03);trim.push(disc);}
    const thread=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.09,-.3,.03),new T.Vector3(.27,-.36,.03),new T.Vector3(.18,-.6,.03)]),14,.016,4,false);trim.push(thread);
  } else if (asset === 'practice-cushion') {
    const pillow=new T.SphereGeometry(.22,14,10);pillow.scale(1,.75,.48);pillow.translate(0,-.4,.03);body.push(pillow);
    for(const x of [-.17,.17])for(const y of [-.26,-.54]){const tassel=new T.SphereGeometry(.035,6,4);tassel.translate(x,y,.04);trim.push(tassel);}
    ring(.055,.012,[0,-.4,.14]);
  } else if (asset === 'pollen-scout') {
    const pod=new T.SphereGeometry(.16,14,10);pod.scale(1,1.4,.7);pod.translate(0,-.38,.03);body.push(pod);
    const stem=new T.CylinderGeometry(.018,.025,.28,8);stem.translate(0,-.12,.03);trim.push(stem);
    for(const x of [-.08,.08]){const seed=new T.SphereGeometry(.035,8,6);seed.translate(x,-.39,.14);trim.push(seed);}
  } else if (asset === 'crumb-sentinel') {
    box(.26,.20,.14,[0,-.41,.03]);
    const lid=new T.CylinderGeometry(.16,.17,.045,12);lid.translate(0,-.28,.03);trim.push(lid);
    for(const x of [-.08,0,.08]){const sugar=new T.BoxGeometry(.035,.035,.025);sugar.rotateZ(x*8);sugar.translate(x,-.4,.12);trim.push(sugar);}
  } else {
    const axle = new T.CylinderGeometry(.10, .10, .30, 14); axle.rotateZ(Math.PI / 2); axle.translate(0, -.40, .02); body.push(axle);
    for (const x of [-.18, .18]) { const rim = new T.CylinderGeometry(.19, .19, .04, 14); rim.rotateZ(Math.PI / 2); rim.translate(x, -.40, .02); trim.push(rim); }
    box(.035, .18, .035, [.23, -.32, .02], trim); box(.10, .035, .035, [.27, -.24, .02], trim);
  }
  return { parts: [body, trim], colors: asset === 'button-guard' ? ['#96755b', '#efcd86'] : asset === 'sock-skipper' ? ['#b884a3', '#e9c7a4'] : ['#ad9bc7', '#795a88'], hand: asset === 'button-guard' ? 'armL' : 'armR' };
}
