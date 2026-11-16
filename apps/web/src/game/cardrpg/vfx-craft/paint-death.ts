/** Original-paint death breakup. LEARN/Q3.B.md, X09 and accepted D1/D3.
 * Native atlas decoding stays installed. No snapshots or CPU pixel reads:
 * every source sample and fragment position is a pure function of this pose/time.
 */
import * as T from 'three';
import type {SpineActor} from '../spine/assets';
import {flowingNoise} from './lantern-requiem';

const rankGLSL=`
float paintRank(vec2 p){
 float n=texture2D(uDeathNoise,p/250.).r;
 return .72*clamp((p.y-uDeathRange.x)/uDeathRange.y,0.,1.)+.28*n;
}`;

export class PaintDeath {
 readonly fragments=new T.Group();
 private noise=flowingNoise();
 private amount={value:-1};
 private range:{value:T.Vector2};
 private saved:{material:T.MeshBasicMaterial;hook:T.Material['onBeforeCompile'];key:T.Material['customProgramCacheKey']}[]=[];
 private geometry=new T.BufferGeometry();
 private material:T.ShaderMaterial;
 private mesh:T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 constructor(readonly actor:SpineActor){
  this.range={value:new T.Vector2(actor.bounds.y,actor.bounds.height)};
  actor.root.traverse(node=>{
   if(!(node instanceof T.Mesh))return;
   const material=node.material as T.MeshBasicMaterial,hook=material.onBeforeCompile,key=material.customProgramCacheKey,baseKey=key.call(material);
   this.saved.push({material,hook,key});
   material.onBeforeCompile=(shader,renderer)=>{
    hook.call(material,shader,renderer);
    Object.assign(shader.uniforms,{uDeathAmount:this.amount,uDeathNoise:{value:this.noise},uDeathRange:this.range});
    shader.vertexShader='varying vec2 vDeathObject;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDeathObject=transformed.xy;');
    shader.fragmentShader='varying vec2 vDeathObject;uniform float uDeathAmount;uniform sampler2D uDeathNoise;uniform vec2 uDeathRange;\n'+rankGLSL+shader.fragmentShader.replace('#include <alphatest_fragment>',`
     if(uDeathAmount>0.){
      float rank=paintRank(vDeathObject);
      diffuseColor.a*=uDeathAmount>=1.?0.:1.-smoothstep(rank-.025,rank+.025,uDeathAmount*1.10-.05);
     }
     #include <alphatest_fragment>`);
   };
   material.customProgramCacheKey=()=>baseKey+'|paint-death-v1';material.needsUpdate=true;
  });
  const positions:number[]=[],origins:number[]=[],seeds:number[]=[],indices:number[]=[];
  const b=actor.bounds;
  for(let row=0;row<22;row++)for(let column=0;column<16;column++){
   if((row+column)%2===0)continue;
   const seed=((row*73+column*131)%251)/251,side=((row*107+column*43)%241)/241;
   const x=b.x+(column+.35+seed*.3)/16*b.width,y=b.y+(row+.3+side*.4)/22*b.height,offset=positions.length/3;
   for(const [u,v]of [[-1,-1],[1,-1],[-1,1],[1,1]]){positions.push(u!,v!,0);origins.push(x,y);seeds.push(seed,side);}
   indices.push(offset,offset+1,offset+2,offset+1,offset+3,offset+2);
  }
  this.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  this.geometry.setAttribute('aOrigin',new T.Float32BufferAttribute(origins,2));
  this.geometry.setAttribute('aSeed',new T.Float32BufferAttribute(seeds,2));this.geometry.setIndex(indices);
  this.material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
   uniforms:{uDeathAmount:this.amount,uDeathNoise:{value:this.noise},uDeathRange:this.range,uPaint:{value:null},uCrop:{value:new T.Vector4()}},
   vertexShader:`attribute vec2 aOrigin,aSeed;uniform float uDeathAmount;uniform sampler2D uDeathNoise;
uniform vec2 uDeathRange;uniform vec4 uCrop;varying vec2 vPaintUv,vCorner;varying float vAlpha;
${rankGLSL}
void main(){
 float rank=paintRank(aOrigin),birth=(rank+.05)/1.1,age=(uDeathAmount-birth)*.6;
 float life=.17+aSeed.x*.12,t=clamp(age/life,0.,1.),drag=1.-exp(-max(0.,age)*10.);
 float size=(7.+aSeed.y*9.)*(1.-t*.62),spin=(aSeed.x-.5)*11.*max(0.,age);
 vec2 corner=position.xy,cut=corner*vec2(.34+aSeed.x*.36,.72+aSeed.y*.28);
 vec2 shape=mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*cut*size;
 vec2 travel=vec2((aSeed.y-.5)*73.*drag,30.*drag-170.*age*age);
 vec4 source=modelMatrix*vec4(aOrigin+cut*(7.+aSeed.y*9.),0.,1.);
 vPaintUv=(source.xy-uCrop.xy)/uCrop.zw;vCorner=corner;
 vAlpha=step(0.,age)*(1.-smoothstep(.15,1.,t))*(1.-smoothstep(.86,1.,uDeathAmount));
 gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(aOrigin+shape+travel,0.,1.);
}`,
   fragmentShader:`uniform sampler2D uPaint;varying vec2 vPaintUv,vCorner;varying float vAlpha;
void main(){
 if(vAlpha<.001||vPaintUv.x<0.||vPaintUv.y<0.||vPaintUv.x>1.||vPaintUv.y>1.)discard;
 vec4 paint=texture2D(uPaint,vPaintUv);if(paint.a<.12)discard;
 float edge=1.-smoothstep(.82,1.,max(abs(vCorner.x),abs(vCorner.y)+.28*vCorner.x));
 gl_FragColor=vec4(paint.rgb/max(paint.a,.001),paint.a*vAlpha*edge*.85);
 #include <colorspace_fragment>
}`});
  this.mesh=new T.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;
  this.fragments.name='Soot finite original-paint fragments';this.fragments.matrixAutoUpdate=false;this.fragments.add(this.mesh);this.fragments.visible=false;
 }
 setTime(seconds:number|null,reduced:boolean){
  this.amount.value=seconds===null?-1:Math.max(0,Math.min(1,seconds/.6));
  this.fragments.visible=!reduced&&this.amount.value>0&&this.amount.value<1;
 }
 withSourcePaint<TValue>(capture:()=>TValue):TValue{
  const amount=this.amount.value;this.amount.value=-1;
  try{return capture();}finally{this.amount.value=amount;}
 }
 setSource(texture:T.Texture,crop:T.Vector4){
  this.material.uniforms.uPaint!.value=texture;this.material.uniforms.uCrop!.value.copy(crop);
  this.fragments.matrix.copy(this.actor.root.matrixWorld);this.fragments.matrixWorldNeedsUpdate=true;
  this.fragments.renderOrder=this.actor.root.renderOrder+.3;
 }
 dispose(){
  for(const {material,hook,key}of this.saved){material.onBeforeCompile=hook;material.customProgramCacheKey=key;material.needsUpdate=true;}
  this.noise.dispose();this.geometry.dispose();this.material.dispose();this.fragments.removeFromParent();
 }
}
