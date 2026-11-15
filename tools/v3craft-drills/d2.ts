// Original directional mesh study. LEARN/Q3.md, Q3-X05; isolated from battle.
export const d2Recipe = {
  id: 'D2', durationMs: 2000, seed: 15112027,
  controls: [[340, 280], [360, 470], [850, 510], [975, 245]],
  roles: ['open-blade', 'offset-ribbon', 'tapered-lance'],
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };

// Integer-frequency harmonics make the data repeat without an edge seam.
// The seed changes phases, not authored shape. UV.x is distance along the mesh.
function flowingGrain(T: any) {
  const width = 256, height = 64, data = new Uint8Array(width * height * 4);
  let seed = d2Recipe.seed;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const waves = [[3, 2, .20], [7, -3, .13], [13, 5, .08], [23, 8, .04]].map(([x, y, a]) => ({x, y, a, phase: random() * Math.PI * 2}));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = (x + .5) / width, v = (y + .5) / height;
    const n = waves.reduce((sum, w) => sum + w.a * Math.sin(Math.PI * 2 * (u * w.x + v * w.y) + w.phase), .5);
    const i = (y * width + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = Math.round(clamp(n) * 255); data[i + 3] = 255;
  }
  const texture = new T.DataTexture(data, width, height, T.RGBAFormat);
  texture.colorSpace = T.NoColorSpace; texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.magFilter = texture.minFilter = T.LinearFilter; texture.needsUpdate = true;
  return texture;
}

function strip(T: any, curve: any, widthAt: (u: number) => number, arcLength: boolean, segments = 120) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  curve.arcLengthDivisions = 1024;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, p = arcLength ? curve.getPointAt(u) : curve.getPoint(u);
    const tangent = arcLength ? curve.getTangentAt(u) : curve.getTangent(u);
    const normal = new T.Vector2(-tangent.y, tangent.x), half = widthAt(u) * .5;
    for (const side of [-1, 1]) { positions.push(p.x + normal.x * half * side, p.y + normal.y * half * side, 0); uvs.push(u, (side + 1) / 2); }
    if (i < segments) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  return geometry;
}

export async function createD2(T: any, revision: number, anchors?: {source: number[]; target: number[]}) {
  const root = new T.Group(), grain = flowingGrain(T), layers: any[] = [];
  const curve = (points: number[][]) => new T.CubicBezierCurve(...points.map(p => new T.Vector2(...p)));
  const source = anchors?.source ?? [340, 280], target = anchors?.target ?? [975, 245];
  const paths = revision ? [
    curve([source, [source[0] + 32, source[1] + 200], [target[0] - 125, target[1] + 240], target]),
    curve([source, [source[0] + 80, source[1] + 132], [target[0] - 140, target[1] + 190], target]),
    curve([source, [source[0] * .66 + target[0] * .34, source[1] - 4], [target[0] - 115, target[1] + 8], target]),
  ] : [
    curve(d2Recipe.controls),
    curve([[340, 271], [400, 411], [848, 461], [975, 245]]),
    curve([[340, 280], [580, 268], [850, 259], [975, 245]]),
  ];
  const widths = [
    (u: number) => (revision ? 102 : 58) * Math.pow(Math.sin(Math.PI * u), revision ? .85 : .7) * (revision ? .64 + .36 * Math.sin(Math.PI * u * .8) : 1),
    (u: number) => (revision ? 16 : 13) * Math.pow(Math.sin(Math.PI * u), .6) * (.85 + .15 * Math.sin(u * 18)),
    (u: number) => (revision ? 46 : 35) * Math.pow(Math.sin(Math.PI * u), revision ? .8 : 1.5) * (.55 + .45 * u),
  ];
  const colours = revision
    ? [['#421474', '#a747ef', '#ffdf8c'], ['#381354', '#854fc9', '#b69be8'], ['#9b5271', '#f0b45b', '#fff0b4']]
    : [['#6c2fa9', '#b36dea', '#ffe1a1'], ['#5130a1', '#976ae1', '#e8ceff'], ['#734891', '#e9a357', '#fff1bb']];
  for (let i = 0; i < paths.length; i++) {
    const uniforms = {
      uGrain: {value: grain}, uTime: {value: 0}, uHead: {value: 0}, uTail: {value: 0}, uOpacity: {value: 0},
      uDark: {value: new T.Color(colours[i][0])}, uBody: {value: new T.Color(colours[i][1])}, uCore: {value: new T.Color(colours[i][2])},
      uKind: {value: i}, uErosion: {value: 0}, uRevision: {value: revision},
    };
    const material = new T.ShaderMaterial({transparent: true, depthTest: false, depthWrite: false, side: T.DoubleSide, toneMapped: false, uniforms,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `
uniform sampler2D uGrain; uniform float uTime,uHead,uTail,uOpacity,uKind,uErosion,uRevision;
uniform vec3 uDark,uBody,uCore; varying vec2 vUv;
void main(){
 float n=texture2D(uGrain,vec2(vUv.x*1.6-uTime*.65,vUv.y*(uRevision>.5?1.7:.9)+uTime*.08)).r;
 // As the head advances, the cross section narrows to a sharp oblique point.
 float tip=1.-smoothstep(uHead-.12,uHead+.005,vUv.x);
 float centre=mix(.53,.72,1.-tip);
 float across=abs(vUv.y-centre)/max(.025,tip*.49);
 float edge=1.-smoothstep(uRevision>.5?.88:.76,1.,across);
 float front=1.-smoothstep(uHead-.022,uHead+.012,vUv.x);
 float back=smoothstep(uTail-.05,uTail+.08,vUv.x);
 if(uRevision>1.5){
  // Tear only the trailing half into travelling brush streaks. The leading
  // lip remains continuous, so the breakup cannot erase the strike direction.
  float tailNoise=texture2D(uGrain,vec2(vUv.x*2.8-uTime*.9,vUv.y*2.2)).r;
  float brokenTail=uTail+(tailNoise-.5)*.12;
  back=smoothstep(brokenTail-.025,brokenTail+.075,vUv.x);
 }
 float erosion=smoothstep(uErosion-.12,uErosion+.12,n);
 float alpha=edge*front*back*erosion*uOpacity*(uRevision>.5?.86+.14*n:.72+.28*n);
 if(alpha<.002)discard;
 float lip=exp(-pow((vUv.y-.78)/(uRevision>.5?.045:.13),2.));
 float leading=exp(-pow((vUv.x-uHead+.025)/.035,2.));
 vec3 colour=mix(uDark,uBody,.35+.65*n);
 colour=mix(colour,uCore,clamp(lip*(uRevision>.5?.92:.66)+leading*.55,0.,.92));
 if(uRevision>.5&&uKind>1.5)colour=mix(colour,uCore,exp(-pow((vUv.y-.5)/.18,2.))*.72);
 if(uRevision>1.5&&uKind<.5){
  float strand=smoothstep(.58,.81,n)*exp(-pow((vUv.y-.55)/.27,2.));
  colour=mix(colour,uBody, strand*.5);
 }
 gl_FragColor=vec4(colour,alpha);
 #include <colorspace_fragment>
}`});
    const mesh = new T.Mesh(strip(T, paths[i], widths[i], revision >= 1), material);
    // Effects behind bodies preserve readable actor silhouettes during this study.
    mesh.renderOrder = 4 + i; root.add(mesh); layers.push({mesh, uniforms, role: d2Recipe.roles[i]});
  }
  let state: any = {};
  function draw(ms: number) {
    const seconds = ms / 1000;
    layers.forEach((layer, i) => {
      const start = revision>=2 ? [100, 180, 480][i] : [100, 190, 600][i];
      const travel = revision>=2 ? [650, 740, 260][i] : [1000, 1080, 520][i];
      const progress = clamp((ms - start) / travel);
      // Head continues past the endpoint so the tail clears along the curve,
      // instead of freezing a fully drawn arc beside the recipient.
      let head = revision ? Math.max(0, (ms - start) / travel) * 1.08 : progress * 1.08;
      if(revision>=2){
        const p=Math.max(0,(ms-start)/travel);
        if(i===0)head=1.08*(p<=1?Math.pow(p,1.45):1+(p-1)*.7);
        else if(i===1)head=1.08*Math.min(1,Math.pow(p,1.25));
        else head=1.08*(p<=1?Math.pow(p,.8):1+(p-1)*.75);
      }
      const length = revision>=2 ? [.52, .75, .52][i] : [.43, .53, .40][i];
      layer.uniforms.uTime.value = seconds;
      layer.uniforms.uHead.value = head;
      layer.uniforms.uTail.value = Math.max(-.1, head - length);
      layer.uniforms.uOpacity.value = smooth((ms - start) / 100) * (1 - smooth((ms - 1400 - i * 50) / 450));
      layer.uniforms.uErosion.value = -.15 + 1.3 * smooth((ms - 1300 - i * 60) / 580);
      if(revision>=2&&i===1){
        // Leave a thin moving trace after the broad blade has cleared. The
        // retreat accelerates late; it does not stop beside the target's head.
        layer.uniforms.uTail.value+=.78*Math.pow(clamp((ms-900)/1080),2);
        layer.uniforms.uOpacity.value=smooth((ms-start)/100)*.9*(1-smooth((ms-1730)/270));
        layer.uniforms.uErosion.value=-.15+1.3*Math.pow(smooth((ms-1300)/700),2);
      }
    });
    state = {revision, recipe: d2Recipe.id, method: revision ? 'arc-length-UV' : 'uniform-parameter-UV', anchors: revision ? {source, target} : null, layers: layers.map(l => ({role: l.role, head: l.uniforms.uHead.value, tail: l.uniforms.uTail.value, opacity: l.uniforms.uOpacity.value, erosion: l.uniforms.uErosion.value}))};
  }
  return {root, draw, state: () => state, layers, grain};
}
