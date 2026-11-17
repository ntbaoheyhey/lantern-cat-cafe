import * as T from 'three';
/** Multiplying open amounts preserves a full blink under a soft expression. */
export function eyeClosure(blink:number,softness:number){
 const clamp=(n:number)=>Math.max(0,Math.min(1,n));
 return 1-(1-clamp(blink))*(1-clamp(softness));
}
/** Local eye UV compression reuses painted pixels; no new art or texture decode. */
export function drawingExpression(material:T.MeshBasicMaterial){
 const left={value:new T.Vector4()},right={value:new T.Vector4()},blink={value:new T.Vector2()};
 const compile=material.onBeforeCompile,cache=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{
  compile.call(material,shader,renderer);
  Object.assign(shader.uniforms,{cxvLeftEye:left,cxvRightEye:right,cxvBlink:blink});
  shader.fragmentShader=`
uniform vec4 cxvLeftEye;
uniform vec4 cxvRightEye;
uniform vec2 cxvBlink;
vec2 cxvCloseEye(vec2 uv, vec4 eye, float closed) {
 vec2 q=(uv-eye.xy)/eye.zw;
 if(abs(q.x)<1.0 && abs(q.y)<1.0 && closed>0.0) {
  float weight=(1.0-pow(abs(q.x),4.0))*(1.0-smoothstep(0.72,1.0,abs(q.y)));
  uv.y=eye.y+clamp((uv.y-eye.y)/max(0.08,1.0-closed*0.94*weight),-eye.w,eye.w);
 }
 return uv;
}
vec2 cxvExpressionUv(vec2 uv) {
 return cxvCloseEye(cxvCloseEye(uv,cxvLeftEye,cxvBlink.x),cxvRightEye,cxvBlink.y);
}
`+shader.fragmentShader.replace('texture2D( map, vMapUv )','texture2D( map, cxvExpressionUv(vMapUv) )');
 };
 material.customProgramCacheKey=()=>cache()+'-cxv-eyes-v1';
 return {sample(face:readonly number[],canvas:readonly number[],leftAmount:number,rightAmount:number){
  const [x,y,w,h]=face as readonly [number,number,number,number],cw=canvas[0]!,ch=canvas[1]!;
  left.value.set((x+w*.40)/cw,1-(y+h*.44)/ch,w*.135/cw,h*.19/ch);
  right.value.set((x+w*.74)/cw,1-(y+h*.40)/ch,w*.105/cw,h*.18/ch);
  blink.value.set(leftAmount,rightAmount);
 },blink};
}
