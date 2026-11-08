/** Original atelier effect materials. All resources are allocated during loading. */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CardEffectPrimitive } from './card-effect-primitives';
import type { CardEffectRecipe } from './card-effect-data';
import { loadingFrame } from './loading';

const sources = import.meta.glob('../../../../../../assets/cardrpg-look/flipbooks/{smoke,steam,flame,sparkle,yarn-dust,ribbon}.webp', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
const families = ['smoke', 'steam', 'flame', 'sparkle', 'yarn-dust', 'ribbon'] as const;
type Family = typeof families[number];
const familyFor: Partial<Record<CardEffectPrimitive, Family>> = {
  'ink-stain': 'smoke', 'ink-drop': 'smoke', steam: 'steam', veil: 'steam',
  flame: 'flame', ember: 'flame', spark: 'sparkle', 'spice-star': 'sparkle',
  seam: 'yarn-dust', knot: 'yarn-dust', spool: 'yarn-dust', spindle: 'yarn-dust',
  'crumb-crown': 'yarn-dust', 'seed-pod': 'sparkle', constellation: 'sparkle',
  comet: 'ribbon', wave: 'ribbon', 'yarn-fan': 'ribbon',
};
const ribbons = new Set<CardEffectPrimitive>(['comet', 'wave', 'yarn-fan']);
const paper = new Set<CardEffectPrimitive>(['apron', 'roof', 'leaf', 'petal', 'sock', 'wing',
  'bread', 'crumb-crown', 'paper-cat', 'apron-cloth', 'blanket', 'collar', 'flower-bell']);
const glass = new Set<CardEffectPrimitive>(['shield-facet', 'bubble', 'greenhouse', 'wave', 'droplet', 'veil', 'ink-cap']);
const ceramic = new Set<CardEffectPrimitive>(['cup', 'teapot', 'oven', 'watering-can']);
const metal = new Set<CardEffectPrimitive>(['pan', 'spoon', 'whisk', 'tray', 'needle', 'handle', 'shears', 'night-bell', 'serving-bell']);
function refinePaper(source: T.BufferGeometry) {
  // Large cap triangles cannot follow a curved sheet, even with bent normals.
  // Split long edges during loading, retaining the authored outline and UVs.
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  const vertexAt = (i: number) => [source.attributes.position!.getX(i), source.attributes.position!.getY(i), source.attributes.position!.getZ(i),
    source.attributes.normal!.getX(i), source.attributes.normal!.getY(i), source.attributes.normal!.getZ(i),
    source.attributes.uv!.getX(i), source.attributes.uv!.getY(i)];
  const distance = (a: number[], b: number[]) => (a[0]! - b[0]!) ** 2 + (a[1]! - b[1]!) ** 2 + (a[2]! - b[2]!) ** 2;
  const split = (a: number[], b: number[], c: number[], depth = 0) => {
    const edges = [distance(a, b), distance(b, c), distance(c, a)], longest = Math.max(...edges);
    if (longest > .36 ** 2 && depth < 8) {
      const edge = edges.indexOf(longest), points = [a, b, c];
      const p = points[edge]!, q = points[(edge + 1) % 3]!, r = points[(edge + 2) % 3]!;
      const middle = p.map((value, i) => (value + q[i]!) * .5);
      split(p, middle, r, depth + 1);split(middle, q, r, depth + 1);return;
    }
    for (const v of [a, b, c]) {positions.push(...v.slice(0, 3));normals.push(...v.slice(3, 6));uvs.push(...v.slice(6, 8));}
  };
  for (let i = 0; i < source.attributes.position!.count; i += 3) split(vertexAt(i), vertexAt(i + 1), vertexAt(i + 2));
  const result = new T.BufferGeometry();
  result.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  result.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  source.dispose();return result;
}
function craftedBody(kind: CardEffectPrimitive): T.BufferGeometry | undefined {
  // Keep the authored handles/ribs/silhouettes, give their materials a surface
  // to light. These loading-time additions share the existing instance pool.
  if (kind === 'lantern') {
    const profile = [[0, -.29], [.19, -.29], [.27, -.15], [.29, .14], [.23, .30], [.14, .37], [0, .37]];
    return new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), 24).scale(1, 1, .72);
  }
  if (kind === 'cup') {
    const profile = [[0, -.39], [.20, -.39], [.31, -.25], [.40, .18], [.40, .24],
      [.35, .24], [.34, .17], [.25, -.23], [0, -.29]];
    return new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), 24).rotateX(.20);
  }
  if (kind === 'teapot') return new T.SphereGeometry(.43, 24, 16).scale(1, .65, .70).translate(0, -.015, .04);
  if (kind === 'watering-can') {
    const profile = [[0, -.37], [.28, -.37], [.35, -.28], [.34, .15], [.28, .23], [.23, .23], [.23, .17]];
    return new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), 24).scale(1, 1, .70).translate(0, 0, .04);
  }
  if (kind === 'greenhouse') {
    const points = [[-.51, -.45], [-.51, .09], [-.32, .45], [0, .63], [.32, .45], [.51, .09], [.51, -.45]];
    return new T.ExtrudeGeometry(new T.Shape(points.map(([x, y]) => new T.Vector2(x, y))),
      { depth: .06, bevelEnabled: true, bevelSize: .025, bevelThickness: .02, bevelSegments: 2, steps: 1 }).translate(0, 0, -.07);
  }
  return undefined;
}
const vertex = `attribute float effectAlpha,effectPhase,effectPart,effectFlash;uniform float surfaceKind;varying vec3 effectColor,n,localPoint;varying vec2 texUV;varying float opacity,phase,part,viewDepth,flash;
void main(){effectColor=instanceColor;opacity=effectAlpha;phase=effectPhase;part=effectPart;flash=effectFlash;texUV=uv;
 vec3 p=position;localPoint=p;if(effectPart>1.5){p.y+=sin(uv.x*8.-effectPhase*6.283)*.07*sin(uv.x*3.14159);}
 if(effectPart<.5&&surfaceKind>.5&&surfaceKind<1.5){p.z+=sin(p.x*4.8+effectPhase*.8)*.11*(.8+.2*cos(p.y*4.));}
 vec3 surfaceNormal=normal;
 if(effectPart<.5&&surfaceKind>.5&&surfaceKind<1.5){surfaceNormal.x-=cos(p.x*4.8+effectPhase*.8)*.528*(.8+.2*cos(p.y*4.))*normal.z;surfaceNormal.y+=sin(p.x*4.8+effectPhase*.8)*.088*sin(p.y*4.)*normal.z;}
 mat3 instanceNormal=mat3(instanceMatrix);surfaceNormal/=max(vec3(dot(instanceNormal[0],instanceNormal[0]),dot(instanceNormal[1],instanceNormal[1]),dot(instanceNormal[2],instanceNormal[2])),vec3(.000001));
 vec4 mv=modelViewMatrix*instanceMatrix*vec4(p,1.);viewDepth=-mv.z;n=normalize(normalMatrix*instanceNormal*surfaceNormal);gl_Position=projectionMatrix*mv;}`;
const fragment = `varying vec3 effectColor,n,localPoint;varying vec2 texUV;varying float opacity,phase,part,viewDepth,flash;
uniform sampler2D atlas,sceneDepth;uniform float surfaceKind,softVolume,flameVolume,depthEnabled,overdraw;uniform vec2 resolution,clipPlanes;uniform vec4 protectedFaces[12];uniform int protectedCount;
float distanceAt(vec2 uv){float z=texture2D(sceneDepth,uv).r*2.-1.;return 2.*clipPlanes.x*clipPlanes.y/(clipPlanes.y+clipPlanes.x-z*(clipPlanes.y-clipPlanes.x));}
void main(){vec2 screen=gl_FragCoord.xy/resolution;float faceFade=1.;
 for(int i=0;i<12;i++){if(i>=protectedCount)break;vec4 f=protectedFaces[i];vec2 q=(screen-f.xy)/max(f.zw,vec2(.00001));float radius=dot(q,q);if(radius<1.)discard;faceFade*=smoothstep(1.,1.6,radius);}
 float a=opacity*faceFade;vec3 c=effectColor;float additive=0.;
 if(part>.5&&part<1.5){float f=clamp(floor(phase*35.),0.,35.);vec2 cell=vec2(mod(f,6.),5.-floor(f/6.));vec2 uv=(cell+clamp(texUV,vec2(.5/256.),vec2(1.-.5/256.)))/6.;
  vec4 t=texture2D(atlas,uv);vec3 straight=t.rgb/max(t.a,.0001);vec3 linear=pow(straight,vec3(2.2));float light=mix(dot(linear,vec3(.2126,.7152,.0722)),max(linear.r,max(linear.g,linear.b)),flameVolume);
  a*=mix(t.a*.52,sqrt(t.a)*.72,softVolume);c=mix(effectColor*.55,effectColor*1.75,clamp(light,0.,1.));
  c+=mix(effectColor,vec3(1.,.78,.4),.35)*pow(clamp(light,0.,1.),4.)*1.4*flameVolume;
 }else if(part>1.5){float f=clamp(floor(phase*35.),0.,35.);vec2 cell=vec2(mod(f,6.),5.-floor(f/6.));vec4 silk=texture2D(atlas,(cell+clamp(texUV,vec2(.5/256.),vec2(1.-.5/256.)))/6.);float fibre=dot(silk.rgb,vec3(.2126,.7152,.0722));float edge=1.-abs(texUV.y*2.-1.);a*=pow(max(0.,edge),1.2)*sin(texUV.x*3.14159)*.7;c=mix(effectColor*.55,mix(effectColor,vec3(1.),.3)*3.2,pow(edge,7.)*.65);c*=.95+fibre*.15;additive=.35;
 }else{float light=.5+.5*dot(normalize(n),normalize(vec3(-.45,.75,.5)));float rim=pow(1.-abs(normalize(n).z),2.);
  a*=mix(1.,mix(.38,.10,flameVolume),softVolume);
  c=effectColor*(.42+light*.48)+mix(effectColor,vec3(.9),.18)*rim*.18;
  if(surfaceKind>.5&&surfaceKind<1.5){vec2 p=localPoint.xy*85.;float detail=1.-smoothstep(.5,2.,max(fwidth(p.x),fwidth(p.y)));float fibre=sin(p.x+sin(p.y*.35))*sin(p.y*1.4);c*=(.96+.04*fibre*detail)*(.94+.06*cos(localPoint.x*5.+phase*.8));}
  if(surfaceKind>1.5&&surfaceKind<2.5){a*=.16+rim*.3;c*=.78;c+=mix(effectColor,vec3(1.),.25)*pow(rim,2.)*2.4;}
  if(surfaceKind>2.5&&surfaceKind<4.5){float shine=pow(max(0.,dot(normalize(n),normalize(vec3(-.25,.42,.88)))),surfaceKind<3.5?14.:28.);c+=mix(effectColor,vec3(1.),surfaceKind<3.5?.65:.22)*shine*(surfaceKind<3.5?.8:2.2);}
  if(surfaceKind>4.5){float rib=.5+.5*cos(atan(localPoint.z,localPoint.x)*10.);c=effectColor*(1.1+light*.65)*(.82+.18*rib)+vec3(1.,.46,.08)*.32;}
  c+=effectColor*pow(max(0.,sin(phase*3.14159)),8.)*.08+mix(effectColor,vec3(1.),.3)*flash*.36;
 }
 if(flameVolume>.5)c*=vec3(1.,.48,.18);
 if(depthEnabled>.5){float behind=distanceAt(screen)-viewDepth;if(behind<-.008)discard;a*=smoothstep(0.,part>.5?.24:.035,max(0.,behind));}
 if(a<.002)discard;
 // ONE blending: overdraw uses alpha zero so each fragment adds exactly1/255.
 if(overdraw>.5){gl_FragColor=vec4(vec3(1./255.),0.);return;}
 // Convert straight RGB for the actual output target before premultiplying.
 // HDR targets stay linear; direct Low gets the renderer's ACES/sRGB finish.
 gl_FragColor=vec4(c,a*(1.-additive));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=a;}`;

export class LookVfx {
  readonly impact = new T.Vector2(.5, .5);
  readonly lights: T.PointLight[];
  private textures = new Map<Family, T.Texture>();
  private materials = new Map<string, T.ShaderMaterial>();
  private depth = { value: null as T.Texture | null };
  private depthEnabled = { value: 0 };
  private clipPlanes = { value: new T.Vector2(.1, 80) };
  private projected = new T.Vector3();
  private lightsEnabled = true;
  private savedLightPower = new Float32Array(2);
  private disposed = false;
  constructor(scene: T.Scene, private shared: Record<string, T.IUniform>) {
    this.lights = Array.from({ length: 2 }, (_, i) => {
      // Foot-level falloff lights the floor and lower costume without washing
      // the protected eyes; keep both lights present throughout loading/play.
      const light = new T.PointLight('#ffc773', 0, .42, 2);
      light.name = `atelier-effect-light-${i}`;scene.add(light);return light;
    });
  }
  async prepare(cancelled: () => boolean) {
    for (const family of families) {
      const url = Object.entries(sources).find(([path]) => path.endsWith(`/${family}.webp`))?.[1];
      if (!url) throw Error(`Missing original ${family} atlas`);
      const bitmap = await new T.ImageBitmapLoader().setOptions({ imageOrientation: 'flipY',
        premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).loadAsync(url);
      if (this.disposed || cancelled()) {bitmap.close();return;}
      const texture = new T.Texture(bitmap);texture.flipY = false;
      texture.colorSpace = T.NoColorSpace;texture.premultiplyAlpha = false;
      texture.minFilter = texture.magFilter = T.LinearFilter;texture.generateMipmaps = false;
      texture.addEventListener('dispose', () => bitmap.close());texture.needsUpdate = true;
      this.textures.set(family, texture);await loadingFrame();
    }
  }
  material(kind: CardEffectPrimitive) {
    const family = familyFor[kind], finish = kind === 'lantern' ? 5 : paper.has(kind) ? 1 : glass.has(kind) ? 2 : ceramic.has(kind) ? 3 : metal.has(kind) ? 4 : 0;
    const key = `${family ?? 'sculpted'}/${finish}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new T.ShaderMaterial({vertexShader: vertex, fragmentShader: fragment,
        transparent: true, depthWrite: false, side: T.DoubleSide, forceSinglePass: true,
        blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor,
        blendDst: T.OneMinusSrcAlphaFactor,
        uniforms: {...this.shared, atlas: {value: this.textures.get(family ?? 'sparkle')},
          surfaceKind: {value: finish}, softVolume: {value: family && ['smoke', 'steam', 'flame'].includes(family) ? 1 : 0}, flameVolume: {value: family === 'flame' ? 1 : 0}, sceneDepth: this.depth,
          depthEnabled: this.depthEnabled, clipPlanes: this.clipPlanes}});
      this.materials.set(key, material);
    }
    return material;
  }
  geometry(base: T.BufferGeometry, kind: CardEffectPrimitive) {
    const family = familyFor[kind];
    let original = base.index ? base.toNonIndexed() : base;
    if (original !== base) base.dispose();
    if (paper.has(kind)) original = refinePaper(original);
    original.setAttribute('effectPart', new T.BufferAttribute(new Float32Array(original.attributes.position!.count), 1));
    const body = craftedBody(kind);
    if (body) {
      const surface = body.index ? body.toNonIndexed() : body;
      if (surface !== body) body.dispose();
      surface.setAttribute('effectPart', new T.BufferAttribute(new Float32Array(surface.attributes.position!.count), 1));
      const sculpted = mergeGeometries([original, surface], false)!;
      original.dispose();surface.dispose();original = sculpted;
    }
    if (kind === 'greenhouse') {
      // A tall conservatory arch distinguishes Clover's garden from broad
      // shields and bread covers. Keep the feet at the authored ground line.
      original.computeBoundingBox();
      const foot = original.boundingBox!.min.y;
      original.scale(.82, 1.65, 1);
      original.translate(0, foot * (1 - 1.65), 0);
    }
    if (!family) return original;
    let addition: T.BufferGeometry;
    if (ribbons.has(kind)) {
      const vertices: number[] = [], uvs: number[] = [];
      const point = (i: number, side: number) => {
        const u = i / 32, w = Math.sin(Math.PI * u) * .14;
        vertices.push((u - .5) * 1.65, Math.sin(u * Math.PI * 1.6) * .15 + side * w, .015);
        uvs.push(u, (side + 1) / 2);
      };
      for (let i = 0; i < 32; i++) {point(i, -1);point(i + 1, -1);point(i + 1, 1);point(i, -1);point(i + 1, 1);point(i, 1);}
      addition = new T.BufferGeometry();addition.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      addition.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));addition.computeVertexNormals();
    } else {const size = family === 'flame' ? 3.1 : family === 'smoke' || family === 'steam' ? 2.6 : 1.65;
      const plane = new T.PlaneGeometry(size, size);addition = plane.toNonIndexed();plane.dispose();addition.translate(0, .05, -.01);}
    addition.setAttribute('effectPart', new T.BufferAttribute(new Float32Array(addition.attributes.position!.count).fill(ribbons.has(kind) ? 2 : 1), 1));
    const merged = mergeGeometries([original, addition], false)!;original.dispose();addition.dispose();merged.computeBoundingSphere();return merged;
  }
  setDepth(texture: T.Texture | null, camera: T.PerspectiveCamera) {
    this.depth.value = texture;this.depthEnabled.value = texture ? 1 : 0;
    this.clipPlanes.value.set(camera.near, camera.far);
  }
  begin() {for (const light of this.lights) light.intensity = 0;}
  setLightsEnabled(enabled: boolean) {
    if (this.lightsEnabled === enabled) return;
    this.lightsEnabled = enabled;
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i]!;
      if (!enabled) {this.savedLightPower[i] = light.intensity;light.intensity = 0;}
      else light.intensity = this.savedLightPower[i]!;
    }
  }
  illuminate(recipe: CardEffectRecipe, progress: number, caster: T.Vector3,
    targets: T.Vector3[], camera: T.Camera, calm: boolean) {
    const focus = targets[0] ?? caster;this.projected.copy(focus);this.projected.y += .3;this.projected.project(camera);
    this.impact.set(this.projected.x * .5 + .5, this.projected.y * .5 + .5);
    const t = (progress - .45) / .43;
    const power = t > 0 && t < 1 && !calm && this.lightsEnabled ? Math.sin(t * Math.PI) ** 2 * (recipe.ultimate ? .85 : .55) : 0;
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i]!;light.position.copy(targets[i] ?? focus);light.position.y += .06;
      light.color.set(i ? recipe.accent : recipe.color);light.intensity = i && targets.length < 2 ? 0 : power;
    }
  }
  async warm(renderer: T.WebGLRenderer, cancelled: () => boolean) {
    for (const texture of this.textures.values()) {if (cancelled()) return;renderer.initTexture(texture);await loadingFrame();}
  }
  dispose() {
    this.disposed = true;for (const light of this.lights) light.removeFromParent();
    for (const texture of this.textures.values()) texture.dispose();this.textures.clear();
    for (const material of this.materials.values()) material.dispose();this.materials.clear();
  }
}
