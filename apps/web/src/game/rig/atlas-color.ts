import * as T from 'three';
/** PNG atlas channels are encoded sRGB. PMA must be undone before decoding,
 * and material tint must be applied afterwards in linear light. */
export function atlasMapChunk(premultiplied:boolean){
 return T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',`
  ${premultiplied?'sampledDiffuseColor.rgb /= max(sampledDiffuseColor.a, 0.001);':''}
  sampledDiffuseColor.rgb = sRGBTransferEOTF(sampledDiffuseColor).rgb;
  diffuseColor *= sampledDiffuseColor;
 `);
}
export function usePaintedAtlasColor(material:T.MeshBasicMaterial,premultiplied:boolean){
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',atlasMapChunk(premultiplied));};
 material.customProgramCacheKey=()=>`painted-srgb-v2-${premultiplied?'pma':'straight'}`;
}
