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
/** Per-material colour grade (saturation, contrast around linear mid-grey). Identity by default. */
export function paintGrade(material:T.Material):{value:T.Vector2}|undefined{const g=material.userData.paintGrade as {value?:unknown}|undefined;return g&&g.value instanceof T.Vector2?g as {value:T.Vector2}:undefined;}
export function usePaintedAtlasColor(material:T.MeshBasicMaterial,sourcePremultiplied:boolean){
 const premultiplied=material.map?.userData.atlasAlphaEncoding==='straight'?material.map.premultiplyAlpha:sourcePremultiplied;
 const grade={value:new T.Vector2(1,1)};material.userData.paintGrade=grade;
 material.onBeforeCompile=shader=>{
  if(shader.uniforms)shader.uniforms.paintGrade=grade;
  shader.fragmentShader='uniform vec2 paintGrade;\n'+shader.fragmentShader.replace('#include <map_fragment>',atlasMapChunk(premultiplied)+`
  { float l=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    diffuseColor.rgb=max(mix(vec3(l),diffuseColor.rgb,paintGrade.x),0.);
    diffuseColor.rgb=max((diffuseColor.rgb-.18)*paintGrade.y+.18,0.); }`);
 };
 material.customProgramCacheKey=()=>`painted-srgb-v2-${premultiplied?'pma':'straight'}`;
}
