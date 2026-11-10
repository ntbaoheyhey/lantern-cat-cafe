import * as T from 'three';
import { isLookV2 } from './look-v2';
import { artPipeline, isLookArtV3 } from './look-art';
import tokens from '../../cardrpg/look-tokens.json';
export const CARD_LIGHTING = [
  { key: '#ffe0ba', rim: '#bdd2ff', fog: '#282330', exposure: 1.04 },
  { key: '#f4efc3', rim: '#9fdfd2', fog: '#243239', exposure: 1.02 },
  { key: '#ead9f6', rim: '#b4bdf4', fog: '#2b263c', exposure: 1.00 },
] as const;
/** Atelier fill is added before prewarm; chapter changes retain a stable light count. */
export function applyCardLighting(scene: T.Scene, renderer: T.WebGLRenderer, chapter: number) {
  if (isLookV2()) {
    const palette = tokens.chapters[chapter - 1] ?? tokens.chapters[0]!;
    for (const [name, color, spec] of [
      ['cafe-key', palette.key, tokens.lighting.key],
      ['cafe-rim', palette.rim, tokens.lighting.rim],
    ] as const) {
      const light = scene.getObjectByName(name);
      if (light instanceof T.DirectionalLight) {
        light.color.set(color); light.intensity = spec.intensity;
        light.position.fromArray(spec.position);
        if(isLookArtV3()&&name==='cafe-key')light.position.set(-3.8,6,5.5);
        if(artPipeline()==='puppet'&&name==='cafe-rim')light.position.set(3.2,4.8,-3.5);
      }
    }
    let fill = scene.getObjectByName('atelier-fill');
    if(!fill){fill=new T.DirectionalLight(tokens.lighting.fill.color,tokens.lighting.fill.intensity);fill.name='atelier-fill';fill.position.fromArray(tokens.lighting.fill.position);scene.add(fill);}
    if(fill instanceof T.DirectionalLight){
      const puppet=artPipeline()==='puppet';
      fill.color.set(puppet?'#e5d5ba':tokens.lighting.fill.color);
      fill.intensity=puppet?.78:tokens.lighting.fill.intensity;
      fill.position.fromArray(tokens.lighting.fill.position);
    }
    scene.traverse(object => {
      if (object instanceof T.HemisphereLight) {
        object.color.set(tokens.lighting.bounce.sky);
        object.groundColor.set(tokens.lighting.bounce.ground);
        object.intensity = tokens.lighting.bounce.intensity;
      }
    });
    scene.fog?.color.set(palette.fog);
    renderer.setClearColor(palette.fog); renderer.toneMappingExposure = 1.04;
    return;
  }
  const palette = CARD_LIGHTING[chapter - 1] ?? CARD_LIGHTING[0];
  for (const [name, color] of [['cafe-key', palette.key], ['cafe-rim', palette.rim]]) {
    const light = scene.getObjectByName(name!); if (light instanceof T.Light) light.color.set(color!);
  }
  scene.fog?.color.set(palette.fog); renderer.setClearColor(palette.fog); renderer.toneMappingExposure = palette.exposure;
}
