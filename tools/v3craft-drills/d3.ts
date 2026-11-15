// Original shader particle exercise. LEARN/Q3.md, Q3-X08. Not routed to battle.
export const d3Recipe = {
  id: 'D3', seed: 15112028, durationMs: 2000, impactMs: 350,
  roles: ['hot-needles', 'impact-splinters', 'cooling-chips'],
};

type Particle = {
  id: number; kind: number; birth: number; life: number;
  vx: number; vy: number; drag: number; gravity: number;
  originX: number; originY: number;
  width: number; length: number; spin: number; angle: number;
  x: number; y: number; speed: number; drawLength: number; age: number;
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };

export async function createD3(T: any, revision: number, anchors: {source: number[]; target: number[]}) {
  const root = new T.Group(), layers: any[] = [], all: Particle[] = [];
  // Group order is sorted before mesh order. The baseline remains reproducible.
  root.renderOrder = revision ? 11 : 0;
  let seed = d3Recipe.seed;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const origin = [anchors.target[0], anchors.target[1] + (revision ? 55 : 0)];
  const counts = revision ? [20, 5, 10] : [28, 7, 12];

  for (let kind = 0; kind < 3; kind++) {
    const particles: Particle[] = [];
    for (let id = 0; id < counts[kind]; id++) {
      let angle = kind === 2 ? -.3 + random() * 2.3 : -.7 + random() * 1.85;
      let speed = kind === 2 ? 190 + random() * 200 : kind === 1 ? 350 + random() * 380 : 430 + random() * 490;
      const hero = kind === 0 && id < 3;
      if (revision) {
        // Three long leading needles establish the impulse; shorter ones support it.
        if (hero) angle = [-.38, .13, .62][id];
        else if (kind === 0) angle = -.58 + random() * 1.38;
        if (kind === 1) { angle = [-.6, -.24, .16, .48, .82][id]; speed *= .45; }
        if (kind === 2) speed *= .85;
      }
      const particle: Particle = {
        id, kind, birth: 350 + (kind === 2 ? 65 : 0) + random() * (kind === 2 ? 110 : 45),
        life: kind === 2 ? .8 + random() * .45 : kind === 1 ? .18 + random() * .14 : .35 + random() * .35,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        originX: origin[0], originY: origin[1],
        drag: kind === 2 ? 1.5 : 3.2, gravity: kind === 2 ? -460 : -480,
        width: kind === 2 ? 3 + random() * 5 : kind === 1 ? 8 + random() * 8 : 1.7 + random() * 1.7,
        length: kind === 2 ? 6 + random() * 7 : kind === 1 ? 30 + random() * 26 : 3,
        spin: (random() - .5) * 8, angle: random() * Math.PI * 2,
        x: origin[0], y: origin[1], speed, drawLength: 0, age: -1,
      };
      if (revision) {
        if (kind === 0) {
          particle.width *= hero ? 2.5 : 1.25;
          particle.life *= .82;
          particle.length = hero ? 8 : 4;
          particle.gravity = -240;
        } else if (kind === 1) {
          particle.width *= 1.45;
          particle.length *= 1.8;
          particle.life = .11 + random() * .07;
          particle.birth = 350 + random() * 15;
          particle.gravity = -180;
        } else {
          particle.width *= 2.5;
          particle.length *= 2;
          particle.birth = 390 + random() * 70;
          particle.gravity = -350;
        }
      }
      if (revision >= 2) {
        if (kind === 1) {
          // Explicit contact accent: two 30fps frames, wholly inside the drill beat.
          particle.birth = d3Recipe.impactMs;
          particle.life = 2 / 30;
          particle.width *= .82;
          particle.length *= .8;
        } else if (kind === 2) {
          // Release separate filled fragments from a short cut through the torso.
          // They no longer share one point and form a flower at the origin.
          const lane = id / (counts[kind] - 1);
          const direction = -.28 + 1.62 * lane;
          particle.originX += 6 + id % 3 * 6;
          particle.originY += (lane - .5) * 30;
          particle.vx = Math.cos(direction) * speed;
          particle.vy = Math.sin(direction) * speed;
          particle.width *= .67 + .14 * (id % 2);
          particle.length *= .72 + .12 * (id % 3);
          particle.birth = 398 + id * 7;
          particle.spin *= .55;
          particle.life *= .92;
        }
      }
      particles.push(particle); all.push(particle);
    }
    const positions = new Float32Array(particles.length * 12);
    const uvs = new Float32Array(particles.length * 8);
    const ages = new Float32Array(particles.length * 4);
    const lifetimes = new Float32Array(particles.length * 4);
    const variants = new Float32Array(particles.length * 4);
    const indexes: number[] = [];
    for (let i = 0; i < particles.length; i++) {
      uvs.set([0, 0, 1, 0, 0, 1, 1, 1], i * 8);
      lifetimes.fill(particles[i].life, i * 4, i * 4 + 4);
      variants.fill((i % 5) / 4, i * 4, i * 4 + 4);
      const a = i * 4; indexes.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('uv', new T.BufferAttribute(uvs, 2));
    geometry.setAttribute('aAge', new T.BufferAttribute(ages, 1).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('aLife', new T.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('aVariant', new T.BufferAttribute(variants, 1));
    geometry.setIndex(indexes);
    const palette = kind === 2
      ? revision ? ['#edcaff', '#9a65d3', '#493466'] : ['#fff0b7', '#ce9174', '#47325b']
      : ['#fff7ce', '#f7b33d', '#a94d32'];
    const uniforms = {
      uKind: {value: kind}, uRevision: {value: revision},
      uFace: {value: new T.Vector2(anchors.target[0] - 4, 313)},
      uHot: {value: new T.Color(palette[0])}, uWarm: {value: new T.Color(palette[1])}, uCool: {value: new T.Color(palette[2])},
    };
    const material = new T.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, side: T.DoubleSide, toneMapped: false, uniforms,
      vertexShader: `attribute float aAge,aLife,aVariant; varying vec2 vUv,vWorld; varying float vAge,vSeconds,vVariant;
void main(){vUv=uv;vAge=aAge;vSeconds=aAge*aLife;vVariant=aVariant;vWorld=(modelMatrix*vec4(position,1.)).xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `
uniform float uKind,uRevision; uniform vec3 uHot,uWarm,uCool;
uniform vec2 uFace; varying vec2 vUv,vWorld; varying float vAge,vSeconds,vVariant;
void main(){
 if(vAge<0.||vAge>=1.)discard;
 float x=vUv.x,y=abs(vUv.y-.5)*2.;
 float halfWidth;
 if(uKind<.5){
  // Long spindle with a sharper forward point. The quad follows velocity.
  halfWidth=pow(max(0.,sin(3.14159265*x)),.8)*(.65+.35*x);
 }else if(uKind<1.5){
  // Broad back taper and narrow forward tip, distinct from the needle.
  halfWidth=(1.-x)*smoothstep(0.,.18,x);
 }else{
  // An asymmetric solid chip; no circle texture or contour wire.
  halfWidth=min(x*2.6,(1.-x)*1.8);
  y=abs(vUv.y-.42-.12*x)*2.;
  if(uRevision>1.5){
   // Five authored shard proportions, with one chipped shoulder. No textured
   // glow rectangle and no repeated four-point star at the release point.
   halfWidth=min(x*mix(2.1,3.2,vVariant),(1.-x)*mix(2.05,1.4,vVariant));
   halfWidth-=.12*exp(-pow((x-.31-vVariant*.24)/.09,2.));
  }
 }
 float edge=1.-smoothstep(halfWidth-.09,halfWidth+.04,y);
 float entry=smoothstep(0.,uKind>1.5?.07:.045,vAge);
 if(uRevision>1.5)entry=smoothstep(0.,uKind<.5?.045:uKind<1.5?.008:.07,vSeconds);
 float exit=1.-smoothstep(uKind>1.5?.55:.4,1.,vAge);
 float opacity=edge*entry*exit;
 if(uRevision>.5){
  float faceDistance=length((vWorld-uFace)/vec2(44.,17.));
  opacity*=smoothstep(.85,1.35,faceDistance);
 }
 if(opacity<.002)discard;
 vec3 colour=mix(uHot,uWarm,smoothstep(.02,.45,vAge));
 colour=mix(colour,uCool,smoothstep(.35,1.,vAge));
 float core=(1.-smoothstep(.06,.38,y))*pow(1.-vAge,2.);
 if(uKind<1.5)colour=mix(colour,uHot,core*.8);
 if(uRevision>.5&&uKind>1.5){
  // One cream facet lets a filled chip read against the warm wood floor.
  float facet=uRevision>1.5?smoothstep(.49,.56,vUv.y+x*.12):smoothstep(.54,.65,vUv.y);
  colour=mix(colour,uHot,facet*.45*(1.-vAge));
 }
 gl_FragColor=vec4(colour,opacity);
 #include <colorspace_fragment>
}`,
    });
    const mesh = new T.Mesh(geometry, material); mesh.frustumCulled = false;
    mesh.renderOrder = 16 + kind; root.add(mesh);
    layers.push({mesh, uniforms, positions, ages, particles, role: d3Recipe.roles[kind]});
  }

  let time = 0;
  function draw(ms: number) {
    time = ms;
    for (const layer of layers) {
      for (let i = 0; i < layer.particles.length; i++) {
        const p = layer.particles[i] as Particle;
        const age = (ms - p.birth) / 1000, t = Math.max(0, age), normalized = age / p.life;
        // Closed form: never integrate RAF deltas or use a mutable random stream.
        const decay = Math.exp(-p.drag * t), travel = -Math.expm1(-p.drag * t) / p.drag;
        p.x = p.originX + p.vx * travel;
        p.y = p.originY + p.vy * travel + p.gravity / p.drag * (t - travel);
        const vx = p.vx * decay, vy = p.vy * decay + p.gravity / p.drag * (1 - decay);
        p.speed = Math.hypot(vx, vy); p.age = normalized;
        const theta = p.kind === 2 ? p.angle + p.spin * t : Math.atan2(vy, vx);
        const cos = Math.cos(theta), sin = Math.sin(theta);
        const stretch = revision ? p.id < 3 ? .092 : .052 : .035;
        p.drawLength = p.kind === 0 ? p.length + p.speed * stretch : p.length * (1 - .35 * smooth(normalized));
        const width = p.width * (1 - .25 * clamp(normalized));
        // Fast particles extend behind their centre; the leading point remains clear.
        for (let vertex = 0; vertex < 4; vertex++) {
          const along = ((vertex % 2) - .5) * p.drawLength;
          const across = (Math.floor(vertex / 2) - .5) * width;
          const n = i * 12 + vertex * 3;
          layer.positions[n] = p.x + cos * along - sin * across;
          layer.positions[n + 1] = p.y + sin * along + cos * across;
          layer.positions[n + 2] = 0;
          layer.ages[i * 4 + vertex] = normalized;
        }
      }
      layer.mesh.geometry.attributes.position.needsUpdate = true;
      layer.mesh.geometry.attributes.aAge.needsUpdate = true;
    }
  }
  function state() {
    return {recipe: d3Recipe.id, revision, ms: time, origin, method: 'analytic-linear-drag',
      layers: layers.map(l => ({role: l.role, alive: l.particles.filter((p: Particle) => p.age >= 0 && p.age < 1).length})),
      particles: all.map(p => ({id: p.id, kind: p.kind, x: p.x, y: p.y, speed: p.speed, length: p.drawLength, age: p.age})),
    };
  }
  return {root, draw, state, layers, particles: all};
}
