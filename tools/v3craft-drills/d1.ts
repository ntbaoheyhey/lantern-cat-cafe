// D1 only: paint erosion on a GPU quad. Research: LEARN/Q3.md, TOOLKIT B/E.
import thresholdStudy from '../v3craft-lab/q3/erosion-threshold.json';
import chipRecipe from './paint-chips.json';
export const d1Recipe={id:'D1',durationMs:2000,revealMs:160,erodeFromMs:300,erodeToMs:1800,softEdge:.035,noiseSeed:15112026};

// The histogram measures only the painted support, with texture Y orientation
// accounted for. An empty quad must not determine the pace of a painted dissolve.
const histogram=thresholdStudy.histogram;
const paintedSamples=histogram.reduce((sum:number,n:number)=>sum+n,0);
const occupiedBins=histogram.flatMap((n:number,i:number)=>n?[i]:[]);
export function paintPercentile(fraction:number){
 if(fraction<=0)return occupiedBins[0]!/255-.07;
 if(fraction>=1)return occupiedBins[occupiedBins.length-1]!/255+.07;
 const target=fraction*paintedSamples;
 let sum=0;
 for(let i=0;i<histogram.length;i++){
  const count=histogram[i]!;
  if(count>0&&sum+count>=target)return (i+(target-sum)/count-.5)/255;
  sum+=count;
 }
 return 1.07;
}
function paintFraction(noiseValue:number){
 const bin=Math.max(0,Math.min(255,Math.round(noiseValue)));
 const withinBin=Math.max(0,Math.min(1,noiseValue-bin+.5));
 return (histogram.slice(0,bin).reduce((sum:number,n:number)=>sum+n,0)+histogram[bin]!*withinBin)/paintedSamples;
}
function noiseAtUv(data:Uint8Array,u:number,v:number){
 const x=u*256-.5,y=v*256-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const at=(a:number,b:number)=>data[(Math.max(0,Math.min(255,b))*256+Math.max(0,Math.min(255,a)))*4]!;
 const low=at(ix,iy)*(1-fx)+at(ix+1,iy)*fx;
 const high=at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx;
 return low*(1-fy)+high*fy;
}
export function seededNoise(size=256){
 let seed=d1Recipe.noiseSeed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const lattice=(n:number)=>Float32Array.from({length:(n+1)*(n+1)},random);
 const grids=[{n:9,w:.58,data:lattice(9)},{n:23,w:.28,data:lattice(23)},{n:61,w:.14,data:lattice(61)}];
 const smooth=(v:number)=>v*v*(3-2*v),result=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let value=0;for(const g of grids){const u=x/(size-1)*g.n,v=y/(size-1)*g.n,ix=Math.min(g.n-1,Math.floor(u)),iy=Math.min(g.n-1,Math.floor(v)),fx=smooth(u-ix),fy=smooth(v-iy),a=g.data[iy*(g.n+1)+ix]!,b=g.data[iy*(g.n+1)+ix+1]!,c=g.data[(iy+1)*(g.n+1)+ix]!,d=g.data[(iy+1)*(g.n+1)+ix+1]!;value+=((a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy)*g.w;}
  value=.62*value+.38*x/(size-1);const i=(y*size+x)*4;result[i]=result[i+1]=result[i+2]=Math.round(value*255);result[i+3]=255;
 }
 return result;
}
export async function createD1(T:any,loadTexture:any,rootPath:string,revision:number){
 const root=new T.Group(),paint=await loadTexture(rootPath+'tools/v3craft-drills/assets/soot-core.png');
 const data=seededNoise(),noise=new T.DataTexture(data,256,256,T.RGBAFormat);noise.colorSpace=T.NoColorSpace;noise.magFilter=noise.minFilter=T.LinearFilter;noise.needsUpdate=true;
 const uniforms={uPaint:{value:paint},uNoise:{value:noise},uThreshold:{value:0},uOpacity:{value:0},uSoft:{value:revision===0?d1Recipe.softEdge:.02},uEdge:{value:new T.Color('#f7c98b')},uEdgeGain:{value:revision===0?.42:.24}};
 const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D uPaint;uniform sampler2D uNoise;uniform float uThreshold;uniform float uOpacity;uniform float uSoft;uniform float uEdgeGain;uniform vec3 uEdge;varying vec2 vUv;
void main(){vec4 paint=texture2D(uPaint,vUv);float n=texture2D(uNoise,vUv).r;float coverage=smoothstep(uThreshold-uSoft,uThreshold+uSoft,n);float edge=1.-smoothstep(uThreshold+uSoft,uThreshold+uSoft*3.,n);float alpha=paint.a*coverage*uOpacity;if(alpha<.001)discard;gl_FragColor=vec4(mix(paint.rgb,uEdge,edge*uEdgeGain),alpha);
#include <colorspace_fragment>
}`});
 const mesh=new T.Mesh(new T.PlaneGeometry(500,500),material);mesh.position.set(800,355,0);mesh.renderOrder=5;root.add(mesh);
 const clamp=(v:number)=>Math.max(0,Math.min(1,v)),smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};let state:any={};
 // R2 redo: filled chips have a local pivot and contain only original paint.
 // Narrow noise bands were rejected because their level sets looked like wire.
 const fragments:any[]=[];
 let motionMode:'released'|'rigid'='released';
 if(revision>=2)for(const [i,point] of chipRecipe.points.entries()){
  const u=(point.x+.5)/512,v=1-(point.y+.5)/512;
  const noiseValue=noiseAtUv(data,u,v);
  const fraction=paintFraction(noiseValue);
  const birth=430+1540*Math.pow(fraction,1/.9);
  const life=Math.min(470,1980-birth);
  const size=12/512*500;
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([-size/2,-size/2,0,size/2,-size/6,0,-size/4,size/2,0],3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,1/3,1/4,1],2));
  const fragmentUniforms={
   uPaint:{value:paint},uNoise:{value:noise},
   uCrop:{value:new T.Vector4(u-6/512,v-6/512,12/512,12/512)},
   uOpacity:{value:0},uAge:{value:0},
   uWarm:{value:new T.Color('#efb76c')},uCool:{value:new T.Color('#51405e')},
  };
  const fragmentMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms:fragmentUniforms,
   vertexShader:material.vertexShader,
   fragmentShader:`uniform sampler2D uPaint;uniform sampler2D uNoise;uniform vec4 uCrop;uniform float uOpacity;uniform float uAge;uniform vec3 uWarm;uniform vec3 uCool;varying vec2 vUv;
void main(){vec2 sourceUv=uCrop.xy+vUv*uCrop.zw;vec4 paint=texture2D(uPaint,sourceUv);
float grain=texture2D(uNoise,vUv*.23+uCrop.xy).r;
float crumble=1.-smoothstep(grain-.08,grain+.08,smoothstep(.55,1.,uAge));
float alpha=paint.a*crumble*uOpacity;if(alpha<.001)discard;
vec3 tint=mix(uWarm,uCool,smoothstep(.12,1.,uAge));
gl_FragColor=vec4(mix(paint.rgb,tint,.38),alpha);
#include <colorspace_fragment>
}`});
  const piece=new T.Mesh(geometry,fragmentMaterial);piece.renderOrder=6;root.add(piece);
  const direction=point.x<256?-1:1;
  fragments.push({piece,birth,life,uniforms:fragmentUniforms,x:800+(u-.5)*500,y:355+(v-.5)*500,velocityX:direction*(28+(i%3)*12),velocityY:48+(i%4)*12,turn:direction*(.35+(i%3)*.18)});
 }
 function draw(ms:number){
  if(revision===0){
   const progress=clamp((ms-d1Recipe.erodeFromMs)/(d1Recipe.erodeToMs-d1Recipe.erodeFromMs));
   uniforms.uThreshold.value=progress;
   uniforms.uOpacity.value=smooth(ms/d1Recipe.revealMs)*(1-smooth((ms-1850)/150));
  }else{
   const reveal=smooth(ms/430);
   const erosion=Math.pow(clamp((ms-430)/1540),.9);
   const removedFraction=ms<=430?1-reveal:erosion;
   uniforms.uThreshold.value=paintPercentile(removedFraction);
   // Whole-image alpha is an endpoint guard, not the motion of the effect.
   uniforms.uOpacity.value=smooth(ms/90)*(1-smooth((ms-1930)/70));
  }
  const erosion=clamp((ms-430)/1540);
  mesh.position.set(800+(revision>=2&&motionMode==='rigid'?36*erosion:0),355+(revision>=2&&motionMode==='rigid'?28*erosion:0),0);
  for(const f of fragments){
   const age=ms-f.birth,life=clamp(age/f.life),travel=1-Math.exp(-Math.max(age,0)/240);
   f.piece.visible=motionMode==='released'&&age>0&&age<f.life;
   f.piece.position.set(f.x+f.velocityX*travel,f.y+f.velocityY*travel,0);
   f.piece.rotation.z=f.turn*travel;
   f.uniforms.uOpacity.value=.92*smooth(age/66.667)*(1-smooth((life-.25)/.75));
   f.uniforms.uAge.value=life;
  }
  state={revision,threshold:uniforms.uThreshold.value,opacity:uniforms.uOpacity.value,recipe:d1Recipe.id,method:revision===0?'linear-threshold':revision===1?'paint-percentiles':'paint-percentiles-filled-chips',motionMode,liveFragments:fragments.filter(f=>f.piece.visible).length};
 }
 return {root,draw,state:()=>state,material,paint,noise,fragments,setMotionMode:(mode:'released'|'rigid')=>{motionMode=mode;}};
}
