import * as T from 'three';
import {DRAWING_EYES,type DrawingEye} from './drawing-eye-regions';
import type {DrawingKey} from './drawing-layer';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Multiplying open amounts preserves a full blink under a soft expression. */
export function eyeClosure(blink:number,softness:number){
 return 1-(1-clamp(blink))*(1-clamp(softness));
}
/** Cover the iris with a curved lid; sample our painted cheek and lash palette.
 * UV compression repeated border pixels and stretched brows at full closure.
 * Only local eye RGB changes: original alpha, atlas, geometry and clock survive. */
export function drawingExpression(material:T.MeshBasicMaterial,unit:string){
 const left={value:new T.Vector4(0,0,1,1)},right={value:new T.Vector4(0,0,1,1)},blink={value:new T.Vector2()};
 const leftStyle={value:new T.Vector4(1,0,0,0)},rightStyle={value:new T.Vector4(1,0,0,0)},canvasSize={value:new T.Vector2(1,1)};
 const compile=material.onBeforeCompile,cache=material.customProgramCacheKey.bind(material);
 let previousFace:readonly number[]|undefined,previousCanvas:readonly number[]|undefined,previousKey:DrawingKey|undefined;
 material.onBeforeCompile=(shader,renderer)=>{
  compile.call(material,shader,renderer);
  Object.assign(shader.uniforms,{cxvLeftEye:left,cxvRightEye:right,cxvBlink:blink,cxvLeftStyle:leftStyle,cxvRightStyle:rightStyle,cxvCanvas:canvasSize});
  // Derivatives are taken before nonuniform eye-local branches; palette reads
  // use explicit gradients so their mip level does not depend on branch lanes.
  shader.fragmentShader=`
uniform vec2 cxvBlink;
uniform vec2 cxvCanvas;
uniform vec4 cxvLeftEye;
uniform vec4 cxvRightEye;
uniform vec4 cxvLeftStyle;
uniform vec4 cxvRightStyle;
vec4 cxvCoverEye(sampler2D atlas,vec2 uv,vec4 color,vec4 eye,vec4 style,float closed,vec2 dxUv,vec2 dyUv){
 if(closed<=0.0)return color;
 vec2 delta=vec2(uv.x,1.0-uv.y)*cxvCanvas-eye.xy;
 vec2 q=vec2(delta.x*style.x+delta.y*style.y,-delta.x*style.y+delta.y*style.x)/eye.zw;
 float aa=max(0.025,fwidth(q.y)*0.6);
 if(abs(q.x)>1.18||abs(q.y)>1.18)return color;
 float edge=sqrt(max(0.0,1.0-q.x*q.x)),line=0.2*(1.0-q.x*q.x);
 float upper=mix(-edge,line,closed),lower=mix(edge,line,closed);
 float mask=(1.0-smoothstep(0.98,1.18,length(q)))*smoothstep(0.0,0.18,closed);
 float cover=clamp((1.0-smoothstep(upper-aa,upper+aa,q.y))+smoothstep(lower-aa,lower+aa,q.y),0.0,1.0);
 vec2 skinPixel=style.zw;
 vec3 skin=textureGrad(atlas,vec2(skinPixel.x/cxvCanvas.x,1.0-skinPixel.y/cxvCanvas.y),dxUv,dyUv).rgb;
 vec3 dark=textureGrad(atlas,vec2(eye.x/cxvCanvas.x,1.0-(eye.y-eye.w*0.9)/cxvCanvas.y),dxUv,dyUv).rgb*0.55;
 float stroke=(1.0-smoothstep(0.035,0.09+aa,abs(q.y-upper)))*(1.0-smoothstep(0.85,1.1,abs(q.x)));
 color.rgb=mix(color.rgb,mix(skin,dark,stroke),cover*mask);
 return color;
}
vec4 cxvExpressionMap(sampler2D atlas,vec2 uv){
 vec2 dxUv=dFdx(uv),dyUv=dFdy(uv);
 vec4 color=texture2D(atlas,uv);
 color=cxvCoverEye(atlas,uv,color,cxvLeftEye,cxvLeftStyle,cxvBlink.x,dxUv,dyUv);
 return cxvCoverEye(atlas,uv,color,cxvRightEye,cxvRightStyle,cxvBlink.y,dxUv,dyUv);
}
`+shader.fragmentShader.replace('texture2D( map, vMapUv )','cxvExpressionMap(map,vMapUv)');
 };
 material.customProgramCacheKey=()=>cache()+'-cxv-eyes-v3-mask';
 return {sample(face:readonly number[],canvas:readonly number[],leftAmount:number,rightAmount:number,key:DrawingKey='K0'){
  const fit=DRAWING_EYES[unit]?.[key];
  if(!fit){blink.value.set(0,0);return;}
  if(face!==previousFace||canvas!==previousCanvas||key!==previousKey){
   const [x,y,w,h]=face as readonly [number,number,number,number];
   const set=(region:T.Vector4,style:T.Vector4,eye:DrawingEye)=>{
    const [cx,cy,rx,ry,roll,sx,sy]=eye;
    region.set(x+w*cx,y+h*cy,w*rx,h*ry);style.set(Math.cos(roll),Math.sin(roll),x+w*sx,y+h*sy);
   };
   set(left.value,leftStyle.value,fit[0]);set(right.value,rightStyle.value,fit[1]);canvasSize.value.set(canvas[0]!,canvas[1]!);
   previousFace=face;previousCanvas=canvas;previousKey=key;
  }
  blink.value.set(clamp(leftAmount),clamp(rightAmount));
 },blink};
}
