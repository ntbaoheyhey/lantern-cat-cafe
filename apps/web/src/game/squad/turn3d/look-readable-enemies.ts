import * as T from 'three';
import { isReadableBattle } from './look-b2';
const ids = new Set(['button-guard','sock-skipper','teacup-healer','spool-ram','binding-thread','practice-cushion','pollen-scout','crumb-sentinel','needle-moth','rain-spool','yarn-giant','kettle-knight','pantry-crown']);
/** Original atelier meshes and atlases; only silhouette and material parameters change. */
export function styleReadableEnemy(model: T.Object3D, id: string) {
  if (!isReadableBattle() || !ids.has(id)) return;
  model.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    const eye = /eye/.test(node.name);
    const trim = /handle|cuff|spindle|needle|crown|helm/.test(node.name);
    const ceramic = /teacup|kettle/.test(id);
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!(material instanceof T.MeshStandardMaterial)) continue;
      material.color.set(eye ? '#ffe0b2' : trim ? '#cfa68a' : '#ddb0c8');
      if(!eye){material.emissive.set('#d294aa');material.emissiveIntensity=.78;}
      material.roughness = eye ? .34 : ceramic ? .48 : .84;
      if (eye) { material.emissive.set('#ff9d48'); material.emissiveIntensity = .22; }
      if (!material.userData.b2Enemy) {
        material.userData.b2Enemy = true;
        const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
        material.onBeforeCompile = (shader, renderer) => {
          previous.call(material, shader, renderer);
          shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
            #include <emissivemap_fragment>
            float foeRim = pow(1. - abs(dot(normal, normalize(vViewPosition))), 2.5);
            // Broad authored key-to-shadow relief retains a bright readable contour.
            float foeKey = smoothstep(-.35, .8, dot(normal, normalize(vec3(-.6,.85,1.0))));
            totalEmissiveRadiance *= .42 + .68 * foeKey;
            totalEmissiveRadiance += vec3(.26,.10,.17) * foeRim;
          `);
        };
        material.customProgramCacheKey = () => `${key}-readable-plum-relief-3`;
      }
    }
    if (eye) node.scale.multiply(new T.Vector3(1.14,1.2,1.04));
    if (/handle|cuff|spindle|needle|wing|crown|helm|steam/.test(node.name)) node.scale.multiply(new T.Vector3(1.16,1.12,1.08));
  });
}
export const isReadableBoss = (id: string) => ['yarn-giant','rain-spool','kettle-knight','pantry-crown'].includes(id);
