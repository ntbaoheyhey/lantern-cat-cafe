import * as T from 'three';
/** A delivery override belongs to its decoded texture, never to source rig data. */
export function paintedAtlasTexture(image:HTMLImageElement,alphaEncoding?:'straight'){
 const texture=new T.Texture(image);
 if(alphaEncoding){
  texture.userData.atlasAlphaEncoding=alphaEncoding;
  // Associate before GPU filtering; the shader unassociates after sampling.
  texture.premultiplyAlpha=true;
 }
 texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;
 return texture;
}
/** PNG atlas channels are encoded sRGB. PMA must be undone before decoding,
 * and material tint must be applied afterwards in linear light. */
export function atlasMapChunk(premultiplied:boolean){
 return T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',`
  ${premultiplied?'sampledDiffuseColor.rgb /= max(sampledDiffuseColor.a, 0.001);':''}
  sampledDiffuseColor.rgb = sRGBTransferEOTF(sampledDiffuseColor).rgb;
  diffuseColor *= sampledDiffuseColor;
 `);
}
export function usePaintedAtlasColor(material:T.MeshBasicMaterial,sourcePremultiplied:boolean){
 const premultiplied=material.map?.userData.atlasAlphaEncoding==='straight'?material.map.premultiplyAlpha:sourcePremultiplied;
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',atlasMapChunk(premultiplied));};
 material.customProgramCacheKey=()=>`painted-srgb-v2-${premultiplied?'pma':'straight'}`;
}
