// THE LAST LANTERN — twelve original sculpted household miniatures.
// No imported model, texture, font, silhouette, or reference-game asset is used.
import { THREE, PALETTE as C, group, ellipsoid as ball, cylinder as cyl, torus, tube, rod, polygon, roundedBox as box, loft, leaf, star, stitch, finish } from './geometry.mjs';

export const CAST = [
  ['guardian', 'Mochi', 'hero', 1.72, 25000], ['witch', 'Soot', 'hero', 1.82, 25000],
  ['alchemist', 'Clover', 'hero', 1.72, 25000], ['guard', 'Button Guard', 'small', 1.40, 10000],
  ['flanker', 'Sock Skipper', 'small', 1.48, 10000], ['charger', 'Spool Ram', 'small', 1.34, 10000],
  ['ranger', 'Needle Moth', 'small', 1.48, 10000], ['healer', 'Teacup Healer', 'small', 1.42, 10000],
  ['elite', 'Kettle Knight', 'elite', 1.70, 20000], ['yarn', 'Yarn Giant', 'boss', 2.60, 60000],
  ['thread', 'Binding Thread', 'small', 1.34, 10000], ['dummy', 'Practice Cushion', 'small', 1.36, 10000],
].map(([role, name, category, targetHeight, triangleBudget]) => ({ role, name, category, targetHeight, triangleBudget }));

function rig(spec) {
  const root = group(null, spec.role); const motion = group(root, `${spec.role}_motion`);
  root.userData = { role: spec.role, displayName: spec.name, author: 'OpenAI Codex · original procedural geometry', license: 'CC0-1.0', facing: '+Z', ground: 'y=0', source: 'tools/art3d/cast.mjs' };
  const spine=group(motion,`${spec.role}_spine`);
  const parts = {spine};
  const part = (id, pos = [0, 0, 0], parent = spine) => (parts[id] = group(parent, `${spec.role}_${id}`, pos));
  return { ...spec, root, motion, parts, part };
}
function eyes(r, parent, y, z, spacing = .19, size = 1, color = C.ink) {
  const g = r.part('eyes', [0, y, z], parent);
  for (const s of [-1, 1]) {
    ball(g, color, [spacing * s, 0, 0], [.069 * size, .094 * size, .030 * size], 10, 6);
    ball(g, C.ivory, [spacing * s - .018 * size, .035 * size, .026 * size], [.022 * size, .028 * size, .012 * size], 7, 4);
    ball(g, C.gold, [spacing * s + .022 * size, -.039 * size, .024 * size], [.012 * size, .014 * size, .007 * size], 6, 3);
  }
  return g;
}
function mouth(p, y, z, size = 1, color = C.ink) {
  tube(p, color, [[-.085 * size, y, z], [-.05 * size, y - .035 * size, z + .006], [0, y, z + .008], [.05 * size, y - .035 * size, z + .006], [.085 * size, y, z]], .011 * size, 8, 4);
}
function nose(p, pos, size = 1, color = C.ink) {
  polygon(p, color, [[-.04 * size, .025 * size], [.04 * size, .025 * size], [0, -.025 * size]], .018, pos, .01 * size);
}
function feet(r, color, x = .22, z = .10, scale = 1) {
  for (const [s, key] of [[-1, 'footL'], [1, 'footR']]) {
    const g = r.part(key, [s * x, .13 * scale, z]);
    ball(g, color, [0, 0, 0], [.17 * scale, .13 * scale, .22 * scale], 10, 6);
    rod(g, C.ink, [s * .06 * scale, .04 * scale, .197 * scale], [s * .06 * scale, -.01 * scale, .21 * scale], .009, 4);
  }
}
function catEar(r, head, key, side, color) {
  const g = r.part(key, [side * .32, .27, -.025], head);
  polygon(g, color, [[-.14, -.07], [-.085, .25], [.12, .08], [.15, -.075]], .15, [0, 0, 0], .045, [0, 0, side * -.2]);
  polygon(g, C.peach, [[-.073, -.018], [-.06, .15], [.065, .065]], .012, [0, .01, .101], .018, [0, 0, side * -.2]);
}
function cat(r) {
  const soot = r.role === 'witch', clover = r.role === 'alchemist';
  const fur = soot ? C.charcoal : clover ? C.mint : C.cream;
  const accent = soot ? C.violet : clover ? C.teal : C.honey;
  const body = r.part('body', [0, .57, 0]);
  loft(body, fur, [[-.40, 0, 0], [-.33, .27, .22], [-.13, .36, .28], [.13, .35, .28], [.29, .24, .22], [.35, 0, 0]], 16);
  ball(body, soot ? '#77717d' : C.ivory, [0, -.035, .245], [.25, .25, .055], 12, 6);
  // A cloth collar, a tiny clasp, and broad hips make the cats read as dressed miniatures.
  torus(body, accent, [0, .265, 0], .235, .055, [Math.PI / 2, 0, 0], 14, 5);
  ball(body, C.gold, [0, .20, .28], [.065, .068, .036], 8, 5);
  const head = r.part('head', [0, 1.17, .045]); head.scale.set(1.1,1.06,1.02);
  loft(head, fur, [[-.34, 0, 0], [-.29, .29, .24], [-.15, .43, .31], [.05, .45, .31], [.25, .36, .24], [.31, .20, .17], [.32, 0, 0]], 20);
  for (const s of [-1, 1]) {
    ball(head, soot ? '#999096' : C.ivory, [s * .095, -.135, .289], [.125, .086, .060], 10, 5);
    ball(head, soot ? '#b080a3' : C.peach, [s * .32, -.095, .241], [.067, .035, .025], 8, 4);
    for (let i = 0; i < 2; i++) rod(head, soot ? C.lilac : C.ink, [s * .275, -.115 - .045 * i, .292], [s * .47, -.085 - .086 * i, .24], .009, 4);
    // Eyebrows and small forehead tuft; broad readable eye whites are kept animated together.
    const brow=r.part(s<0?'browL':'browR',[s*.19,.19,.30],head); tube(brow,soot?C.lilac:accent,[[-.065,0,0],[0,.018,.008],[.065,-.005,0]],.016,10,6);
  }
  eyes(r, head, .035, .315, .19, 1.28, soot ? '#211e32' : C.ink);
  nose(head, [0, -.10, .37], .9, soot ? C.rose : C.ink); const lips=r.part('mouth',[0,-.158,.35],head);mouth(lips,0,0,.9);
  for(const side of [-1,1]){
    ball(head,fur,[side*.345,-.10,.09],[.12,.12,.17],16,10);
  }
  catEar(r, head, 'earL', -1, fur); catEar(r, head, 'earR', 1, fur);
  polygon(head, accent, [[-.065, .26], [0, .15], [.065, .26]], .014, [0, .005, .248], .008);
  feet(r, fur, .22, .08);
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) {
    const arm = r.part(key, [s * .35, .79, .01]);
    ball(arm, fur, [s * .055, -.12, .04], [.14, .23, .15], 10, 6, [0, 0, s * .22]);
    ball(arm, soot ? '#77717d' : C.ivory, [s * .075, -.26, .095], [.133, .12, .135], 10, 5);
  }
  const tail = r.part('tail', [.18, .35, -.22]);
  tube(tail,fur,[[0,0,0],[.21,.02,-.15],[.31,.21,-.25]],.095,16,10);
  const mid=r.part('tailMid',[.31,.21,-.25],tail);
  tube(mid,fur,[[0,0,0],[.01,.19,0],[-.10,.30,.02]],.075,16,10);
  const tip=r.part('tailTip',[-.10,.30,.02],mid);
  tube(tip,accent,[[0,0,0],[-.10,-.02,.02],[-.13,-.11,.05]],.055,12,9);ball(tip,accent,[-.13,-.11,.05],[.055,.055,.055],12,8);
  for(const side of [-1,1]){const paw=r.parts[side<0?'armL':'armR'];ball(paw,C.peach,[side*.075,-.26,.22],[.055,.05,.016],12,8);for(let n=0;n<3;n++)ball(paw,C.peach,[side*.075+(n-1)*.045,-.20,.21],[.017,.021,.012],10,6);}
  for(const [key,parent,pos] of [['head',head,[0,.35,0]],['back',body,[0,.1,-.28]],['mainHand',r.parts.armR,[.1,-.24,.14]],['offHand',r.parts.armL,[-.1,-.24,.14]],['neck',body,[0,.27,.28]],['tail',tip,[0,0,0]]])group(parent,`${r.role}_socket_${key}`,pos);

  if (r.role === 'guardian') guardian(r);
  if (soot) witch(r);
  if (clover) alchemist(r);
}

function guardian(r) {
  const body = r.parts.body;
  // Quilted tabard with a scalloped hem and an engraved paw clasp.
  polygon(body, C.honey, [[-.19, .17], [.19, .17], [.23, -.26], [.12, -.31], [0, -.26], [-.12, -.31], [-.23, -.26]], .045, [0, -.01, .286], .022);
  polygon(body, C.cream, [[-.13, .13], [.13, .13], [.15, -.20], [0, -.23], [-.15, -.20]], .02, [0, -.02, .32], .012);
  star(body, C.honey, [0, -.075, .348], .095);
  for (const s of [-1, 1]) ball(r.parts[s < 0 ? 'armL' : 'armR'], C.honey, [s * .04, -.015, .025], [.17, .11, .17], 10, 5);
  const shield = r.part('shield', [-.10, -.15, .20], r.parts.armL);
  const silhouette = [[-.25, .26], [0, .33], [.25, .26], [.245, -.05], [.17, -.24], [0, -.35], [-.17, -.24], [-.245, -.05]];
  polygon(shield, C.ink, silhouette, .105, [0, 0, 0], .04);
  polygon(shield, C.gold, silhouette.map(([x, y]) => [x * .91, y * .91]), .075, [0, 0, .062], .028);
  polygon(shield, C.teal, silhouette.map(([x, y]) => [x * .73, y * .75]), .04, [0, 0, .112], .025);
  ball(shield, C.cream, [0, -.04, .155], [.082, .073, .035], 10, 5);
  for (const [x, y] of [[-.10, .075], [0, .12], [.10, .075]]) ball(shield, C.cream, [x, y, .15], [.038, .045, .022], 7, 4);
  for (const [x, y] of [[-.2, .20], [.2, .20], [0, -.25]]) ball(shield, C.ivory, [x, y, .13], [.018, .018, .015], 6, 3);
  const ladle = r.part('ladle', [.11, -.24, .10], r.parts.armR);
  rod(ladle, C.wood, [0, -.18, 0], [.06, .55, 0], .035, 8);
  torus(ladle, C.gold, [.045, .34, 0], .046, .014, [Math.PI / 2, 0, 0], 10, 4);
  ball(ladle, C.honey, [.07, .60, 0], [.145, .17, .065], 12, 7);
  ball(ladle, C.gold, [.07, .60, .048], [.115, .137, .029], 12, 6);
  ball(ladle, '#dfad55', [.07, .61, .07], [.081, .103, .011], 10, 5);
}

function witch(r) {
  const cape = r.parts.body;
  loft(cape, C.violet, [[-.37, .37, .26, 0, -.075], [-.22, .37, .27, 0, -.10], [.15, .26, .23, 0, -.11], [.30, .20, .18, 0, -.09]], 14);
  // Cape opening is on the face side, so a bib and moon clasp cover its seam.
  polygon(cape, C.charcoal, [[-.18, .2], [.18, .2], [.2, -.24], [0, -.34], [-.2, -.24]], .02, [0, 0, .222], .01);
  star(cape, C.gold, [0, .16, .28], .07);
  const hat = r.part('hat', [0, .32, -.10], r.parts.head);hat.scale.set(.88,.91,.9);
  loft(hat, C.shadow, [[-.035, 0, 0], [-.025, .72, .49], [.015, .74, .50], [.06, .64, .44], [.055, 0, 0]], 24);
  loft(hat, C.violet, [[.025, .40, .34], [.16, .34, .30], [.36, .25, .23, -.035], [.55, .15, .15, -.105], [.69, .09, .09, -.20], [.72, .06, .055, -.30], [.66, 0, 0, -.38]], 16);
  loft(hat, C.lilac, [[.07, .385, .327], [.16, .348, .304]], 16);
  box(hat, C.gold, [0, .125, .327], [.15, .12, .04], .02);
  box(hat, C.shadow, [0, .125, .354], [.075, .058, .018], .006);
  star(hat, C.gold, [-.20, .37, .202], .09, .018, [0, -.2, -.2]);
  const lantern = r.part('lantern', [.64, .71, .17]);
  torus(lantern, C.gold, [0, .31, 0], .085, .018, [0, 0, 0], 14, 4);
  loft(lantern, C.honey, [[-.20, 0, 0], [-.18, .16, .13], [-.125, .16, .13], [-.12, 0, 0]], 8);
  loft(lantern, C.gold, [[.15, 0, 0], [.15, .18, .14], [.21, .11, .09], [.24, .045, .04], [.25, 0, 0]], 8);
  ball(lantern, '#ffdd8e', [0, .015, 0], [.11, .16, .095], 10, 6);
  ball(lantern, C.ivory, [0, .025, .08], [.055, .095, .035], 8, 5);
  for (const s of [-1, 1]) for (const z of [-.085, .085]) rod(lantern, C.copper, [s * .12, -.13, z], [s * .12, .15, z], .016, 4);
  rod(r.parts.armR, C.gold, [.075, -.20, .10], [.27, .06, .12], .022, 6);
  const wand = r.part('wand', [-.09, -.24, .1], r.parts.armL);
  rod(wand, C.wood, [0, -.1, 0], [-.10, .43, 0], .026, 6);
  star(wand, C.gold, [-.11, .48, 0], .11, .04, [0, 0, .18]);
}

function flask(p, pos, scale = 1) {
  const f = group(p, `${p.name}_flask`, pos); f.scale.setScalar(scale);
  loft(f, C.paleBlue, [[-.17, 0, 0], [-.15, .13, .11], [-.07, .17, .14], [.07, .12, .10], [.16, .055, .055], [.27, .055, .055], [.28, 0, 0]], 12);
  loft(f, C.teal, [[-.147, .11, .114], [-.07, .174, .143], [.005, .16, .133]], 12);
  cyl(f, C.gold, [0, .26, 0], .067, .067, .04, 10);
  cyl(f, C.wood, [0, .31, 0], .045, .048, .065, 8);
  rod(f, C.ivory, [-.075, -.015, .128], [-.035, .10, .10], .018, 5);
  leaf(f, C.sage, [.04, -.065, .15], .4, [0, 0, -.3]);
  return f;
}
function alchemist(r) {
  const body = r.parts.body;
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * .105; leaf(body, i % 2 ? C.leaf : C.teal, [x, .215 - Math.abs(x) * .12, .255], .75, [0, (i - 2) * .18, (i - 2) * -.40 + Math.PI]);
  }
  tube(body, C.copper, [[-.25, .29, .16], [-.07, .08, .30], [.18, -.16, .28], [.32, -.27, .02], [.18, -.08, -.28], [-.23, .25, -.18]], .027, 14, 5);
  const satchel = r.part('satchel', [-.34, .43, .09]);
  box(satchel, C.wood, [0, 0, 0], [.29, .30, .19], .065, [0, 0, -.13]);
  polygon(satchel, C.copper, [[-.14, .11], [.14, .11], [.12, -.015], [0, -.09], [-.12, -.015]], .045, [0, .05, .11], .02);
  box(satchel, C.gold, [0, 0, .145], [.054, .07, .025], .009);
  leaf(satchel, C.sage, [-.07, -.08, .118], .38, [0, 0, -.4]);
  flask(r.parts.armR, [.13, -.18, .19], 1.05);
  leaf(r.parts.head, C.teal, [.17, .29, .15], .62, [0, 0, -.8]);
  leaf(r.parts.head, C.sage, [.24, .29, .09], .52, [0, 0, -1.2]);
}

function buttonGuard(r) {
  feet(r, C.copper, .23, .02, .9);
  const b = r.part('body', [0, .76, 0]);
  cyl(b, C.blue, [0, 0, 0], .45, .45, .25, 20, [Math.PI / 2, 0, 0]);
  torus(b, C.paleBlue, [0, 0, .135], .375, .045, [0, 0, 0], 20, 5);
  // Four recessed stitch holes make the body unmistakably a button.
  for (const s of [-1, 1]) for (const y of [-.13, .13]) ball(b, C.shadow, [s * .14, y, .128], [.058, .057, .018], 8, 4);
  rod(b, C.cream, [-.14, -.13, .153], [.14, .13, .153], .025, 5);
  rod(b, C.cream, [-.14, .13, .158], [.14, -.13, .158], .025, 5);
  const h = r.part('head', [0, 1.18, .01]);
  loft(h, C.wood, [[-.12, 0, 0], [-.11, .25, .20], [.08, .26, .20], [.16, .20, .16], [.19, 0, 0]], 12);
  eyes(r, h, .00, .19, .105, .62); mouth(h, -.075, .205, .55);
  const hat = r.part('earL', [0, .13, 0], h);
  loft(hat, C.blue, [[0, .29, .23], [.045, .30, .24], [.075, .21, .17], [.20, .11, .11], [.22, 0, 0]], 12);
  star(hat, C.gold, [0, .08, .19], .055);
  const tab = r.part('earR', [.16, .20, -.02], h); leaf(tab, C.coral, [0, 0, 0], .35, [0, 0, -.4]);
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) {
    const a = r.part(key, [s * .38, .88, 0]); rod(a, C.copper, [0, 0, 0], [s * .10, -.27, .10], .055, 7); ball(a, C.cream, [s * .10, -.27, .10], [.075, .08, .075], 8, 4);
  }
  const sh = r.parts.armL; cyl(sh, C.honey, [-.12, -.23, .18], .19, .19, .07, 12, [Math.PI / 2, 0, 0]); torus(sh, C.gold, [-.12, -.23, .223], .145, .02, [0, 0, 0], 12, 4);
  star(sh, C.cream, [-.12, -.23, .24], .08);
  rod(r.parts.armR, C.paleBlue, [.1, -.38, .1], [.12, .44, .1], .026, 6, .008);
  torus(r.parts.armR, C.gold, [.118, .38, .10], .04, .012, [0, 0, 0], 10, 4);
  const tail = r.part('tail', [0, .72, -.15]); tube(tail, C.cream, [[0, 0, 0], [.18, -.20, -.12], [.27, -.25, -.18], [.32, -.12, -.20]], .025, 8, 5);
}

function sockSkipper(r) {
  feet(r, C.violet, .20, .06, .88);
  const b = r.part('body', [0, .64, 0]);
  loft(b, C.lilac, [[-.43, 0, 0], [-.35, .22, .20, -.07], [-.17, .28, .24, -.06], [.12, .25, .21], [.39, .21, .18, .055], [.53, .22, .19, .09], [.55, 0, 0, .09]], 14);
  for (const y of [-.22, -.08, .07]) loft(b, C.cream, [[y, .272 - (y + .22) * .05, .232 - (y + .22) * .05, -.025], [y + .065, .27 - (y + .22) * .05, .23 - (y + .22) * .05, -.02]], 14);
  const h = r.part('head', [.07, 1.17, 0]);
  loft(h, C.violet, [[-.08, .23, .20], [.08, .23, .20], [.10, .19, .165]], 14);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; rod(h, C.lilac, [Math.cos(a) * .235, -.055, Math.sin(a) * .205], [Math.cos(a) * .235, .06, Math.sin(a) * .205], .012, 4); }
  eyes(r, b, .23, .199, .12, .8); mouth(b, .115, .224, .68);
  polygon(b, C.rose, [[-.05, .06], [.045, .06], [.06, -.06], [-.04, -.065]], .016, [-.17, -.24, .205], .008);
  stitch(b, C.ivory, [-.21, -.29, .225], [-.12, -.29, .225], 3, .006, [0, .022, 0]);
  const e1 = r.part('earL', [-.07, .09, 0], h); leaf(e1, C.lilac, [0, .09, 0], .6, [0, 0, .45]);
  const e2 = r.part('earR', [.11, .09, 0], h); leaf(e2, C.cream, [0, .07, 0], .48, [0, 0, -.35]);
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) {
    const a = r.part(key, [s * .23, .84, 0]); tube(a, C.violet, [[0, 0, 0], [s * .14, -.06, .02], [s * .17, -.18, .1]], .06, 6, 6);
    ball(a, C.cream, [s * .17, -.18, .1], [.075, .075, .07], 8, 4);
    polygon(a, C.paleBlue, [[-.035, -.08], [.03, -.08], [.035, .18], [0, .32], [-.035, .18]], .03, [s * .18, -.10, .16], .012, [0, 0, -s * .55]);
    rod(a, C.gold, [s * .10, -.18, .16], [s * .26, -.10, .16], .024, 5);
  }
  const tail = r.part('tail', [-.11, .53, -.19]); tube(tail, C.cream, [[0, 0, 0], [-.18, -.10, -.13], [-.25, .02, -.18], [-.19, .16, -.17]], .03, 10, 5);
}

function spoolRam(r) {
  feet(r, C.copper, .27, .06, .92);
  const b = r.part('body', [0, .70, 0]);
  cyl(b, C.redDark, [0, -.02, 0], .35, .35, .56, 16);
  for (let i = 0; i < 8; i++) torus(b, i % 2 ? C.coral : C.red, [0, -.255 + i * .066, 0], .345, .035, [Math.PI / 2, 0, 0], 16, 4);
  for (const y of [-.34, .32]) { cyl(b, C.wood, [0, y, 0], .46, .46, .105, 16); torus(b, C.gold, [0, y + .052, 0], .375, .017, [Math.PI / 2, 0, 0], 16, 4); }
  const h = r.part('head', [0, .77, .335]);
  ball(h, C.cream, [0, 0, 0], [.29, .24, .14], 12, 6); eyes(r, h, .035, .135, .12, .85);
  nose(h, [0, -.05, .168], .85); mouth(h, -.10, .15, .60);
  for (const [s, key] of [[-1, 'earL'], [1, 'earR']]) {
    const horn = r.part(key, [s * .24, .11, -.04], h);
    tube(horn, C.gold, [[0, 0, 0], [s * .19, .10, -.03], [s * .23, -.05, .04], [s * .11, -.14, .1], [s * .06, -.06, .12]], .075, 11, 6);
  }
  const aL = r.part('armL', [-.36, .66, 0]); const aR = r.part('armR', [.36, .66, 0]);
  for (const [s, a] of [[-1, aL], [1, aR]]) { tube(a, C.copper, [[0, 0, 0], [s * .10, -.14, .08], [s * .12, -.25, .13]], .065, 6, 5); ball(a, C.wood, [s * .12, -.25, .13], [.10, .08, .11], 8, 4); }
  const tail = r.part('tail', [0, .68, -.36]); tube(tail, C.coral, [[0, 0, 0], [.12, .0, -.13], [.15, .20, -.14], [.03, .25, -.13]], .045, 9, 5);
  cyl(b, C.copper, [0, .39, 0], .14, .14, .06, 12); cyl(b, C.shadow, [0, .423, 0], .07, .07, .009, 10);
}

function needleMoth(r) {
  const b = r.part('body', [0, .73, 0]);
  ball(b, C.wood, [0, -.10, 0], [.18, .35, .16], 12, 6);
  for (let i = 0; i < 3; i++) torus(b, C.gold, [0, -.25 + i * .15, 0], .15, .028, [Math.PI / 2, 0, 0], 12, 4);
  const h = r.part('head', [0, 1.04, .02]); ball(h, C.cream, [0, 0, 0], [.23, .20, .17], 12, 6); eyes(r, h, .02, .16, .10, .72); mouth(h, -.08, .17, .55);
  for (const [s, key] of [[-1, 'earL'], [1, 'earR']]) { const antenna = r.part(key, [s * .10, .12, 0], h); tube(antenna, C.ink, [[0, 0, 0], [s * .06, .17, -.025], [s * .16, .21, 0]], .018, 7, 5); ball(antenna, C.gold, [s * .16, .21, 0], [.05, .05, .04], 8, 4); }
  for (const [s, key] of [[-1, 'wingL'], [1, 'wingR']]) {
    const w = r.part(key, [s * .09, .83, -.08]);
    const outline = [[0, -.09], [s * .16, .37], [s * .43, .48], [s * .61, .31], [s * .55, .07], [s * .38, -.04], [s * .48, -.25], [s * .31, -.39], [s * .09, -.23]];
    polygon(w, C.ink, outline, .045, [0, 0, 0], .025);
    polygon(w, C.blue, outline.map(([x, y]) => [x * .91, y * .91]), .022, [0, 0, .04], .022);
    polygon(w, C.paleBlue, [[s * .11, .01], [s * .23, .31], [s * .43, .36], [s * .51, .24], [s * .39, .07]], .015, [0, 0, .07], .014);
    ball(w, C.honey, [s * .34, .19, .092], [.09, .105, .018], 10, 5); ball(w, C.ink, [s * .34, .19, .111], [.044, .054, .012], 8, 4);
    rod(w, C.gold, [s * .09, -.04, .075], [s * .29, -.27, .075], .015, 4);
  }
  feet(r, C.copper, .12, .03, .60);
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) { const a = r.part(key, [s * .15, .82, .06]); rod(a, C.copper, [0, 0, 0], [s * .10, -.17, .12], .035, 5); ball(a, C.cream, [s * .10, -.17, .12], [.055, .06, .055], 7, 4); }
  const bow = r.parts.armL;
  tube(bow, C.gold, [[-.09, .22, .17], [-.26, .09, .17], [-.30, -.13, .17], [-.24, -.30, .17], [-.10, -.43, .17]], .026, 12, 5);
  rod(bow, C.cream, [-.09, .22, .17], [-.10, -.43, .17], .009, 4);
  rod(r.parts.armR, C.paleBlue, [.09, -.15, .14], [-.39, -.15, .14], .018, 6, .005);
  const tail = r.part('tail', [0, .48, -.1]); leaf(tail, C.gold, [0, -.10, -.035], .65, [.8, 0, Math.PI]);
}

function teacupHealer(r) {
  feet(r, C.teal, .21, .03, .8);
  const b = r.part('body', [0, .61, 0]);
  loft(b, C.ivory, [[-.35, 0, 0], [-.31, .25, .22], [-.20, .32, .28], [.05, .39, .33], [.26, .41, .35], [.29, .38, .32]], 18);
  torus(b, C.gold, [0, .27, 0], .386, .027, [Math.PI / 2, 0, 0], 18, 5);
  cyl(b, '#935c49', [0, .247, 0], .354, .354, .018, 18);
  torus(b, C.teal, [0, -.19, 0], .28, .024, [Math.PI / 2, 0, 0], 14, 4);
  const handle = r.part('earL', [.36, .03, 0], b); torus(handle, C.ivory, [.11, 0, 0], .17, .045, [0, Math.PI / 2, 0], 14, 6);
  const tag = r.part('tail', [-.16, .25, -.25], b); tube(tag, C.cream, [[0, 0, 0], [-.12, -.04, -.07], [-.14, -.32, -.09]], .011, 8, 4); box(tag, C.teal, [-.14, -.37, -.09], [.13, .14, .025], .015); leaf(tag, C.sage, [-.14, -.38, -.068], .28);
  const h = r.part('head', [0, .64, .02]); eyes(r, h, .02, .323, .15, .88); mouth(h, -.105, .329, .75);
  for (const s of [-1, 1]) ball(h, C.rose, [s * .27, -.04, .27], [.048, .025, .013], 7, 4);
  const sprout = r.part('earR', [0, 1.02, -.06]);
  tube(sprout, C.teal, [[0, 0, 0], [.02, .16, 0], [.05, .23, -.02]], .018, 6, 4);
  leaf(sprout, C.leaf, [-.07, .12, 0], .63, [0, 0, .9]); leaf(sprout, C.mint, [.10, .17, -.01], .64, [0, 0, -.6]);
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) { const a = r.part(key, [s * .35, .66, .02]); tube(a, C.teal, [[0, 0, 0], [s * .10, -.10, .04], [s * .12, -.20, .12]], .045, 6, 5); ball(a, C.ivory, [s * .12, -.20, .12], [.065, .07, .06], 8, 4); }
  const spoon = r.parts.armR; rod(spoon, C.gold, [.13, -.30, .14], [.17, .31, .14], .025, 6); ball(spoon, C.gold, [.18, .37, .14], [.075, .105, .033], 10, 5);
  leaf(b, C.teal, [0, -.18, .29], .45, [0, 0, .4]);
}

function kettleKnight(r) {
  feet(r, C.charcoal, .25, .04, 1.1);
  const b = r.part('body', [0, .72, 0]);
  loft(b, C.blue, [[-.46, 0, 0], [-.40, .26, .25], [-.25, .40, .35], [.02, .45, .38], [.27, .36, .31], [.33, .27, .24], [.35, 0, 0]], 20);
  torus(b, C.gold, [0, -.34, 0], .32, .035, [Math.PI / 2, 0, 0], 18, 5);
  const h = r.part('head', [0, .97, .01]);
  polygon(h, C.charcoal, [[-.30, .12], [.30, .12], [.29, -.13], [.16, -.23], [-.16, -.23], [-.29, -.13]], .06, [0, -.035, .33], .035);
  eyes(r, h, .008, .39, .13, .85, C.gold);
  for (const x of [-.105, 0, .105]) box(h, C.blue, [x, -.17, .385], [.027, .085, .025], .006);
  const lid = r.part('earL', [0, .18, 0], h);
  loft(lid, C.paleBlue, [[-.03, .40, .34], [.02, .40, .34], [.12, .26, .24], [.16, .13, .12], [.165, 0, 0]], 18);
  ball(lid, C.gold, [0, .20, 0], [.075, .07, .075], 10, 5);
  const plume = r.part('earR', [0, .25, -.02], lid);
  polygon(plume, C.red, [[-.035, 0], [-.13, .12], [-.10, .32], [.02, .38], [.12, .26], [.065, .09]], .08, [0, 0, 0], .035);
  rod(plume, C.gold, [0, .03, .052], [0, .28, .052], .012, 5);
  const spout = r.part('armL', [-.35, .78, .0]);
  tube(spout, C.blue, [[0, 0, 0], [-.17, .04, .03], [-.23, .21, .03], [-.36, .28, .04]], .11, 12, 8);
  torus(spout, C.gold, [-.36, .28, .04], .105, .025, [0, Math.PI / 2, .3], 12, 5);
  ball(spout, C.shadow, [-.377, .282, .04], [.012, .076, .076], 10, 5);
  const a = r.part('armR', [.40, .89, .02]); ball(a, C.gold, [0, 0, 0], [.14, .11, .14], 12, 5); rod(a, C.charcoal, [.03, -.03, 0], [.10, -.30, .13], .07, 8); ball(a, C.paleBlue, [.10, -.30, .13], [.105, .09, .11], 10, 5);
  rod(a, C.copper, [.11, -.47, .15], [.14, .50, .15], .03, 7);
  polygon(a, C.ivory, [[-.05, -.05], [.05, -.05], [.055, .48], [0, .65], [-.055, .48]], .035, [.14, -.01, .15], .014);
  rod(a, C.gold, [-.01, -.06, .15], [.29, -.06, .15], .032, 6);
  const handle = r.part('tail', [0, .86, -.24]); tube(handle, C.charcoal, [[-.25, -.06, 0], [-.37, .26, -.07], [-.26, .47, -.13], [.26, .47, -.13], [.37, .26, -.07], [.25, -.06, 0]], .07, 20, 7);
  star(b, C.gold, [0, -.25, .33], .085);
}

function yarnGiant(r) {
  feet(r, C.redDark, .42, .05, 1.55);
  const b = r.part('body', [0, 1.14, 0]);
  ball(b, C.redDark, [0, .02, 0], [.80, .81, .67], 24, 14);
  // Three intersecting winding families, each a single continuous tube. Sparse gaps
  // reveal the dark red core; these are real raised yarn strands at every viewpoint.
  for (let family = 0; family < 3; family++) {
    for (let lane = -3; lane <= 3; lane++) {
      const pts = [];
      for (let i = 0; i <= 52; i++) {
        const a = i / 52 * Math.PI * 2; const d = lane * .205; const rr = Math.sqrt(1 - d * d);
        let v = new THREE.Vector3(Math.cos(a) * rr, d, Math.sin(a) * rr);
        v.applyEuler(new THREE.Euler(family * .67, .15 + family * .43, .35 + family * .92));
        pts.push([v.x * .805, .02 + v.y * .82, v.z * .69]);
      }
      tube(b, (lane + family) % 2 ? C.red : C.coral, pts, .035, 52, 5);
    }
  }
  const h = r.part('head', [0, 1.30, .55]);
  // Plush felt mask leaves the winding topology visible around the entire face.
  ball(h, C.redDark, [0, .02, .045], [.49, .30, .14], 16, 8);
  eyes(r, h, .10, .183, .235, 1.45, C.ink);
  for (const s of [-1, 1]) { rod(h, C.cream, [s * .12, .25, .145], [s * .33, .285, .11], .035, 6); ball(h, C.rose, [s * .36, -.055, .13], [.085, .035, .02], 8, 4); }
  mouth(h, -.03, .195, 1.25, C.ivory); nose(h, [0, .015, .218], 1.0, C.gold);
  for (const [s, key] of [[-1, 'earL'], [1, 'earR']]) {
    const e = r.part(key, [s * .47, 1.82, -.02]);
    tube(e, C.red, [[0, 0, 0], [s * .13, .26, -.03], [-s * .04, .30, -.02], [-s * .08, .11, .02]], .07, 12, 6);
    rod(e, C.gold, [s * .02, .04, .055], [s * .07, .16, .055], .018, 5);
  }
  for (const [s, key, lowerKey] of [[-1, 'armL', 'forearmL'], [1, 'armR', 'forearmR']]) {
    const a = r.part(key, [s * .68, 1.34, -.02]);
    ball(a, C.wood, [s * .08, -.02, 0], [.17, .17, .17], 12, 7);
    tube(a, C.red, [[s * .10, 0, 0], [s * .32, -.10, .02], [s * .41, -.26, .04]], .13, 9, 7);
    for (let i = 0; i < 4; i++) torus(a, C.coral, [s * (.14 + i * .07), -.04 - i * .05, .02], .131, .021, [0, 0, s * .90], 12, 4);
    const lower = r.part(lowerKey, [s * .42, -.27, .04], a);
    ball(lower, C.gold, [0, 0, 0], [.13, .13, .13], 10, 6);
    tube(lower, C.red, [[0, 0, 0], [s * .09, -.22, .07], [s * .06, -.35, .14]], .13, 8, 7);
    ball(lower, C.coral, [s * .06, -.37, .15], [.21, .18, .19], 12, 7);
    for (let i = 0; i < 3; i++) rod(lower, C.redDark, [s * .06 - .11 + i * .09, -.42, .31], [s * .06 - .11 + i * .09, -.34, .32], .012, 4);
  }
  const launcher = r.part('launcher', [.37, 1.82, -.21]);
  cyl(launcher, C.wood, [0, .05, .08], .18, .18, .46, 14, [Math.PI / 2, 0, 0]);
  for (const z of [-.17, .31]) cyl(launcher, C.gold, [0, .05, z], .24, .24, .07, 14, [Math.PI / 2, 0, 0]);
  cyl(launcher, C.shadow, [0, .05, .35], .13, .13, .018, 12, [Math.PI / 2, 0, 0]);
  ball(launcher, C.cream, [0, .05, .35], [.075, .075, .036], 10, 5);
  torus(launcher, C.red, [0, .05, .14], .184, .024, [0, 0, 0], 14, 5);
  const knot = r.part('exposed_knot', [0, .78, .60]);
  ball(knot, C.redDark, [0, 0, 0], [.24, .20, .10], 12, 7);
  tube(knot, C.knot, [[0, 0, .12], [-.23, .06, .11], [-.25, .22, .07], [-.10, .22, .09], [.02, -.01, .17], [.19, .04, .11], [.23, .21, .09], [.11, .24, .09], [0, .02, .15]], .049, 25, 6);
  tube(knot, C.knot, [[0, 0, .12], [-.06, -.15, .13], [-.17, -.20, .09]], .040, 8, 6);
  tube(knot, C.knot, [[.02, 0, .12], [.15, -.13, .11], [.19, -.24, .08]], .040, 8, 6);
  ball(knot, C.ivory, [0, .01, .18], [.07, .065, .04], 10, 5);
  const tail = r.part('tail', [-.27, .52, -.52]); tube(tail, C.red, [[0, 0, 0], [-.30, -.12, -.14], [-.45, -.16, -.34], [-.20, -.17, -.50], [.09, -.17, -.40]], .055, 16, 6);
}

function bindingThread(r) {
  const b = r.part('body', [0, .72, 0]);
  // Open binding arch, not a solid cocoon: the captive remains visible inside.
  const pts = Array.from({ length: 35 }, (_, i) => { const a = i / 34 * Math.PI * 2; return [Math.cos(a) * .43, Math.sin(a) * .60, .015 * Math.sin(a * 3)]; });
  tube(b, C.redDark, pts, .067, 34, 6);
  const pts2 = pts.map(([x, y, z]) => [x * .85, y * .88, z + .045]); tube(b, C.coral, pts2, .025, 34, 5);
  for (const y of [-.23, .12]) tube(b, C.red, [[-.35, y, .035], [-.12, y - .035, .08], [.14, y + .02, .06], [.36, y + .06, .03]], .03, 10, 5);
  const h = r.part('head', [0, 1.20, .025]);
  ball(h, C.red, [0, 0, 0], [.18, .14, .105], 12, 6); eyes(r, h, .01, .10, .075, .53); mouth(h, -.06, .115, .40);
  for (const [s, key] of [[-1, 'earL'], [1, 'earR']]) { const e = r.part(key, [s * .09, .03, 0], h); tube(e, C.coral, [[0, 0, 0], [s * .11, .13, 0], [s * .23, .07, 0], [s * .12, -.04, 0]], .035, 12, 5); }
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) { const a = r.part(key, [s * .38, .66, 0]); tube(a, C.coral, [[0, 0, 0], [s * .17, -.08, .02], [s * .20, -.24, .08], [s * .09, -.26, .09]], .032, 10, 5); }
  const tail = r.part('tail', [0, .18, 0]); tube(tail, C.red, [[0, 0, 0], [.13, -.09, .18], [.25, -.12, .22]], .04, 8, 5);
  feet(r, C.redDark, .30, .00, .55);
}

function practiceCushion(r) {
  feet(r, C.wood, .23, 0, .8);
  const b = r.part('body', [0, .71, 0]);
  // Pillow perimeter is a bevelled custom polygon, with stuffed front and back panels.
  const outline = [[-.40, -.33], [-.46, -.18], [-.45, .24], [-.34, .38], [.34, .38], [.45, .24], [.46, -.18], [.40, -.33]];
  polygon(b, C.copper, outline, .30, [0, 0, 0], .075);
  ball(b, C.cream, [0, .02, .11], [.445, .365, .17], 16, 8);
  ball(b, C.wood, [0, .02, -.11], [.445, .365, .12], 14, 7);
  stitch(b, C.ivory, [-.35, -.32, .17], [.35, -.32, .17], 9, .008, [.018, .025, 0]);
  stitch(b, C.ivory, [-.36, .34, .16], [.36, .34, .16], 9, .008, [.018, .025, 0]);
  const h = r.part('head', [0, .85, .0]); eyes(r, h, .04, .279, .15, .95); nose(h, [0, -.045, .30], .8); mouth(h, -.08, .288, .70);
  // Training bullseye is an embroidered heart, not a hostile face.
  torus(b, C.rose, [0, -.15, .274], .115, .018, [0, 0, 0], 14, 4); star(b, C.honey, [0, -.15, .284], .055, .012);
  for (const [s, key] of [[-1, 'earL'], [1, 'earR']]) { const e = r.part(key, [s * .31, 1.06, 0]); polygon(e, C.wood, [[-.10, -.04], [0, .20], [.11, -.04]], .15, [0, 0, 0], .035, [0, 0, s * -.25]); polygon(e, C.peach, [[-.048, .0], [0, .105], [.052, 0]], .01, [0, .01, .10], .012, [0, 0, s * -.25]); }
  for (const [s, key] of [[-1, 'armL'], [1, 'armR']]) { const a = r.part(key, [s * .44, .69, 0]); tube(a, C.copper, [[0, 0, 0], [s * .09, -.08, .03], [s * .10, -.20, .10]], .045, 6, 5); ball(a, C.cream, [s * .10, -.20, .10], [.08, .10, .075], 8, 4); }
  const tail = r.part('tail', [.30, .52, -.20]); tube(tail, C.wood, [[0, 0, 0], [.21, -.12, -.09], [.30, .03, -.10], [.22, .15, -.09]], .045, 10, 6);
  box(b, C.teal, [-.41, -.10, -.025], [.10, .18, .025], .015, [0, 0, -.25]);
}

const BUILDERS = { guardian: cat, witch: cat, alchemist: cat, guard: buttonGuard, flanker: sockSkipper, charger: spoolRam, ranger: needleMoth, healer: teacupHealer, elite: kettleKnight, yarn: yarnGiant, thread: bindingThread, dummy: practiceCushion };
export function createModel(spec) {
  const r = rig(spec); BUILDERS[spec.role](r); finish(r.root); r.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(r.root); const factor = spec.targetHeight / (bounds.max.y - bounds.min.y);
  r.root.scale.setScalar(factor); r.motion.position.y = -bounds.min.y; r.root.updateMatrixWorld(true);
  r.sourceParameters = { targetHeight: spec.targetHeight, scale: factor, radialSegments: '12–36; Catmull-Rom loft profiles ×3', surface: 'baked albedo/normal surfaces; analytic vertex AO; felt, knit, brass, porcelain and glossy eyes', forward: '+Z', ground: 'y=0', seed: 'deterministic; no random inputs' };
  return r;
}
