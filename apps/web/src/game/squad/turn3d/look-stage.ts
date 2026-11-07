/** Original Blender café; imported only for the explicitly selected atelier. */
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import cafeUrl from '../../../../../../assets/cardrpg-look/stage/game/cafe.glb?url';
import irradianceUrl from '../../../../../../assets/cardrpg-look/stage/game/irradiance.webp?url';

const pointVertex = `attribute float seed;uniform float time;uniform float steam;uniform float pixelRatio;varying float opacity;
void main(){vec3 p=position;float age=fract(seed*.618+time*.16);if(steam>.5){p.x+=sin(age*6.+seed)*.06;p.y+=age*.85;p.z+=sin(age*4.+seed)*.04;opacity=sin(age*3.14159)*.16;}else{p.x+=sin(time*.13+seed)*.12;p.y+=sin(time*.25+seed)*.12;opacity=.25;}
vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((steam>.5?130.:15.)*pixelRatio/max(1.,-mv.z),1.,42.);}`;
const pointFragment = `uniform vec3 color;uniform float steam;varying float opacity;void main(){vec2 p=gl_PointCoord*2.-1.;p.x*=steam>.5?1.8:1.;float a=exp(-dot(p,p)*4.5)*opacity;if(a<.002)discard;gl_FragColor=vec4(color,a);}`;

function ownTexture(texture: T.Texture, textures: Set<T.Texture>) {
  if (textures.has(texture)) return;
  textures.add(texture);
  const bitmap = texture.image;
  if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) {
    texture.addEventListener('dispose', () => bitmap.close());
  }
}

/** Also releases a completed load whose scene was disposed while awaiting it. */
export function disposeLookStage(stage: T.Group, textures = new Set<T.Texture>()) {
  for (const texture of stage.userData.ownedTextures ?? []) ownTexture(texture, textures);
  const materials = new Set<T.Material>();
  const geometries = new Set<T.BufferGeometry>();
  stage.traverse(object => {
    if (!(object instanceof T.Mesh || object instanceof T.Points)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof T.Texture) ownTexture(value, textures);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}

export async function createLookStage(renderer: T.WebGLRenderer) {
  await MeshoptDecoder.ready;
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(cafeUrl);
  const stage = gltf.scene;
  const textures = new Set<T.Texture>();
  try {
    // A decoded bitmap avoids Chromium re-decoding HTMLImageElement WebP data
    // synchronously inside texSubImage2D, even after HTMLImageElement.decode().
    const bitmap = await new T.ImageBitmapLoader().setOptions({ imageOrientation: 'none',
      premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).loadAsync(irradianceUrl);
    const irradiance = new T.Texture(bitmap);
    irradiance.flipY = false; irradiance.colorSpace = T.SRGBColorSpace; irradiance.needsUpdate = true;
    ownTexture(irradiance, textures);
    stage.name = 'lantern-atelier-cafe'; stage.userData.lookV2 = true;
    const surfaces = new Set<T.MeshStandardMaterial>();
    stage.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      object.receiveShadow = true;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof T.MeshStandardMaterial)) continue;
        material.dithering = true;
        // The paper itself feeds the HDR threshold, rather than a flat halo sprite.
        if (material.name === 'lampPaper') material.emissiveIntensity = 2.2;
        if (material.name === 'atelier-stage-baked') {
          material.lightMap = irradiance; material.lightMapIntensity = .32;
          object.geometry.setAttribute('uv1', object.geometry.attributes.uv!.clone());
          surfaces.add(material);
        }
        for (const value of Object.values(material)) if (value instanceof T.Texture) {
          value.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); ownTexture(value, textures);
        }
      }
    });
    // Stable light count in all chapters: warmScene compiles these before Ready.
    const lights = [-3.7, 3.7].map(x => {
      const light = new T.PointLight('#FFD3A0', 15, 5.5, 2);
      light.position.set(x, 2.65, -2.9); light.name = 'atelier-lantern'; stage.add(light); return light;
    });
    const particles = (count: number, isSteam: boolean) => {
      const positions = new Float32Array(count * 3), seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        seeds[i] = i;
        const x = isSteam ? (i % 2 ? -5.35 : 4.85) : Math.sin(i * 12.9898) * 5.8;
        const y = isSteam ? .52 : .5 + i % 11 * .24;
        const z = isSteam ? (i % 2 ? -2.82 : 2.58) : -2.5 - i % 7 * .22;
        positions.set([x, y, z], i * 3);
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
      geometry.setAttribute('seed', new T.BufferAttribute(seeds, 1));
      const material = new T.ShaderMaterial({ vertexShader: pointVertex, fragmentShader: pointFragment,
        uniforms: { time: { value: 0 }, steam: { value: isSteam ? 1 : 0 }, pixelRatio: { value: renderer.getPixelRatio() }, color: { value: new T.Color(isSteam ? '#DBE3DD' : '#FFD3A0') } },
        transparent: true, depthWrite: false, blending: T.NormalBlending });
      const points = new T.Points(geometry, material); points.name = isSteam ? 'tea-steam' : 'lantern-dust';
      points.frustumCulled = false; stage.add(points); return material;
    };
    const dust = particles(48, false), steam = particles(24, true);
    const rayMaterial = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { color: { value: new T.Color('#FFCE99') } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv;uniform vec3 color;void main(){float a=pow(sin(vUv.x*3.14159265),4.)*pow(vUv.y,2.)*.018;gl_FragColor=vec4(color,a);}' });
    for (const x of [-3.7, 3.7]) {
      const ray = new T.Mesh(new T.ConeGeometry(.9, 2.55, 24, 1, true), rayMaterial);
      ray.name = 'lantern-shaft'; ray.position.set(x, 1.38, -2.9); stage.add(ray);
    }
    stage.userData.ownedTextures = [...textures];
    stage.userData.animateLook = (time: number, reduced: boolean) => {
      const t = reduced ? 0 : time;
      dust.uniforms.time!.value = t; steam.uniforms.time!.value = t;
      for (let i = 0; i < lights.length; i++) lights[i]!.intensity = 15 + (reduced ? 0 : Math.sin(t * 1.8 + i) * .18);
    };
    let currentChapter = 0;
    stage.userData.setChapter = (chapter: number) => {
      if (currentChapter === chapter) return;
      currentChapter = chapter;
      const color = ['#ffffff', '#e1f3e7', '#e6e3fa'][Math.max(0, Math.min(2, chapter - 1))]!;
      for (const material of surfaces) material.color.set(color);
      for (const light of lights) light.color.set(['#FFD3A0', '#E2E2AD', '#D9CCFA'][Math.max(0, Math.min(2, chapter - 1))]!);
    };
    return stage;
  } catch (error) { disposeLookStage(stage, textures); throw error; }
}
