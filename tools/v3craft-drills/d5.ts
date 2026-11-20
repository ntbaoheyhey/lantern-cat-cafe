// D5 isolated colour/lifetime craft. Method selection: LEARN/Q3.md, X16/T28.
// All geometry, palettes and flow are original; no reference pixels are used.
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
export const d5Recipe={id:'D5',durationMs:2000,faceSource:'tools/v3craft-lab/q2/faces.json:soot',
  face:[.27,.16,.44,.27],palette:['#fff1c2','#cf88ff','#9942d6','#3b194f'],
  roles:['rising-colour-body','bounded-light-core'],seed:15112030};

function strip(T:any,points:number[][],width:number){
 const curve=new T.CubicBezierCurve(...points.map(p=>new T.Vector2(...p)));curve.arcLengthDivisions=1024;
 const position:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let i=0;i<=120;i++){
  const u=i/120,p=curve.getPointAt(u),v=curve.getTangentAt(u);
  const half=width*.5*Math.pow(Math.sin(Math.PI*u),.72)*(.7+.3*u);
  for(const side of [-1,1]){position.push(p.x-v.y*half*side,p.y+v.x*half*side,0);uv.push(u,(side+1)/2);}
  if(i<120){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);return geometry;
}
function grain(T:any){
 const w=256,h=64,bytes=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=(x+.5)/w,v=(y+.5)/h;
  const n=.5+.23*Math.sin(2*Math.PI*(u*5+v*2)+.3)+.14*Math.sin(2*Math.PI*(u*13-v*3)+1.9)+.08*Math.sin(2*Math.PI*(u*29+v*7)+.8);
  const i=(y*w+x)*4;bytes[i]=bytes[i+1]=bytes[i+2]=Math.round(clamp(n)*255);bytes[i+3]=255;
 }
 const texture=new T.DataTexture(bytes,w,h,T.RGBAFormat);texture.colorSpace=T.NoColorSpace;
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=texture.minFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}
export async function createD5(T:any,revision:number,context:any){
 const {renderer,scene,camera,actor}=context,W=1280,H=720;
 // This drill holds the real actor pose fixed; refresh/reproject would be required for animated production actors.
 const target=new T.WebGLRenderTarget(W,H),pixels=new Uint8Array(W*H*4);
 const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
 const visibility=scene.children.map((o:any)=>[o,o.visible]);
 visibility.forEach(([o]:any)=>o.visible=o===actor.root);
 renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,W,H,pixels);
 visibility.forEach(([o,v]:any)=>o.visible=v);renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);target.dispose();
 let x0=W,y0=H,x1=-1,y1=-1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(pixels[(y*W+x)*4+3]>=128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1<x0)throw Error('D5 requires visible painted actor pixels');
 const body={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1},f=d5Recipe.face;
 const face=[body.x+body.width*f[0],body.y+body.height*(1-f[1]-f[3]),body.width*f[2],body.height*f[3]];
 const mask=new T.DataTexture(pixels,W,H,T.RGBAFormat);mask.flipY=false;mask.colorSpace=T.NoColorSpace;mask.minFilter=mask.magFilter=T.LinearFilter;mask.needsUpdate=true;
 const root=new T.Group(),behind=new T.Group(),front=new T.Group();behind.renderOrder=5;front.renderOrder=11;root.add(behind,front);
 const noise=grain(T),cx=body.x+body.width*.5,cy=body.y+body.height*.5;
 const points=revision>=1
  ? [[body.x-38,body.y+20],[body.x+38,body.y+body.height*.64],
     [body.x+body.width*.82,body.y+body.height*.88],[body.x+body.width+150,body.y+body.height*.52]]
  : [[body.x-40,body.y+35],[body.x+5,body.y+body.height*.75],
     [body.x+body.width*.76,body.y+body.height*1.12],[body.x+body.width+125,body.y+body.height*.79]];
 const geometry=strip(T,points,revision>=1?68:75);
 const colours=(revision>=1?['#d898f0','#bd62ee','#8131bc','#30123e']:d5Recipe.palette).map(c=>new T.Color(c));
 const coreKeys=['#fff1c2','#efd1ff','#bd6eec','#6b378c'].map(c=>new T.Color(c)),layers:any[]=[];
 for(let role=0;role<2;role++){
  const uniforms={uGrain:{value:noise},uActorMask:{value:mask},uFace:{value:new T.Vector4(...face)},
   uRetreat:{value:0},uTime:{value:0},uHead:{value:0},uTail:{value:0},uOpacity:{value:0},uErosion:{value:0},uCore:{value:role},
   uColour:{value:colours[0].clone()},uCoreColour:{value:new T.Color('#fff0c8')},uRevision:{value:revision}};
  const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
   blending:role?T.AdditiveBlending:T.NormalBlending,uniforms,
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform sampler2D uGrain,uActorMask;uniform vec4 uFace;
uniform float uTime,uHead,uTail,uOpacity,uErosion,uCore,uRevision,uRetreat;uniform vec3 uColour,uCoreColour;varying vec2 vUv;
void main(){
 float n=texture2D(uGrain,vec2(vUv.x*1.7-uTime*.48,vUv.y*1.7)).r;
 float tip=1.-smoothstep(uHead-.11,uHead+.005,vUv.x);
 float centre=.5+uRetreat*.11;
 float halfWidth=.5*(1.-uRetreat*.72);
 float across=abs(vUv.y-centre)/max(.012,tip*halfWidth);
 float contour=1.-smoothstep(.72,1.,across);
 float leading=1.-smoothstep(uHead-.02,uHead+.015,vUv.x);
 float tail=uTail;
 if(uRevision>.5)tail+=(n-.5)*.045;
 if(uRevision>1.5){
  float streak=texture2D(uGrain,vec2(vUv.x*3.3-uTime*.52,vUv.y*3.2)).r;
  tail+=(streak-.44)*.14*uRetreat;
 }
 float trailing=smoothstep(tail-.035,tail+.065,vUv.x);
 float breakup=smoothstep(uErosion-.11,uErosion+.11,n);
 float a=contour*leading*trailing*breakup*uOpacity;
 vec3 colour=uColour*(.62+.38*n);
 if(uRevision>1.5){
  // Dark edges carry less coverage, so cooling cannot leave an opaque paper wedge.
  float inner=1.-smoothstep(.32,.95,across);
  colour*=.55+.45*inner;
  a*=.66+.34*inner;
  float strand=smoothstep(.38,.70,n);
  a*=mix(1.,strand,uRetreat*.72);
 }
 if(uCore>.5){
  float crestCentre=uRevision>1.5?centre+halfWidth*.36:(uRevision>.5?.68:.64);
  float crestWidth=uRevision>.5?.042:.065;
  float core=exp(-pow((vUv.y-crestCentre)/crestWidth,2.));a*=core*(uRevision>.5?.65:.5);
  vec2 q=gl_FragCoord.xy;float coverage=texture2D(uActorMask,q/vec2(1280.,720.)).a;
  vec2 centre=uFace.xy+uFace.zw*.5;vec2 radius=uFace.zw*.8+vec2(4.);
  float faceDistance=length((q-centre)/radius);
  float faceProtection=1.-smoothstep(.9,1.25,faceDistance);
  a*=(1.-coverage*.82)*(1.-faceProtection);
  colour=mix(uColour,uCoreColour,uRevision>.5?.88:.65);
 }
 if(a<.001)discard;
 gl_FragColor=vec4(colour,a);
 #include <colorspace_fragment>
}`});
  const mesh=new T.Mesh(geometry,material);(role?front:behind).add(mesh);layers.push({role:d5Recipe.roles[role],mesh,uniforms});
 }
 let state:any={};
 function colourAt(keys:any[],age:number){
  if(age<.22)return keys[0].clone().lerp(keys[1],smooth(age/.22));
  if(age<.62)return keys[1].clone().lerp(keys[2],smooth((age-.22)/.4));
  return keys[2].clone().lerp(keys[3],smooth((age-.62)/.38));
 }
 function draw(ms:number){
  const age=clamp((ms-150)/(revision>=1?1500:1600));
  // Colour and coverage have separate clocks: the dark key must precede the final visible tail.
  const head=revision>=1?1.075*smooth((ms-120)/560):Math.max(0,(ms-150)/700)*1.08;
  const tail=revision>=1?-.07+1.17*smooth((ms-580)/1250):Math.max(-.08,head-.70);
  const opacity=revision>=2?smooth((ms-120)/150)*(1-smooth((ms-1150)/650)):
   revision>=1?smooth((ms-120)/150)*(1-smooth((ms-1450)/400)):
   smooth((ms-150)/130)*(1-smooth((ms-1280)/470));
  const colour=colourAt(colours,revision>=1?clamp((ms-150)/1250):age);
  // The core cools before the broad layer; it cannot stay white as a dark body erodes.
  const coreColour=revision>=1?colourAt(coreKeys,clamp((ms-120)/1250)):new T.Color('#fff0c8');
  const erosion=revision>=2?-.1+1.22*smooth((ms-1080)/620):
   -.1+1.22*smooth((ms-(revision>=1?1350:1050))/(revision>=1?500:700));
  const retreat=revision>=2?smooth((ms-920)/660):0;
  for(const l of layers){
   l.uniforms.uTime.value=ms/1000;l.uniforms.uHead.value=head;l.uniforms.uTail.value=tail;
   l.uniforms.uOpacity.value=opacity;l.uniforms.uErosion.value=erosion;l.uniforms.uRetreat.value=retreat;
   l.uniforms.uColour.value.copy(colour);l.uniforms.uCoreColour.value.copy(coreColour);
  }
  state={recipe:'D5',revision,body,face,age,head,tail,opacity,colourLinear:colour.toArray(),
   coreColourLinear:coreColour.toArray(),erosion,retreat,roles:d5Recipe.roles,centre:[cx,cy],method:'depth-separated-colour-and-face-protected-core'};
 }

 async function prepare(){renderer.initTexture(mask);renderer.initTexture(noise);draw(650);await renderer.compileAsync(scene,camera);draw(0);}
 return {root,draw,prepare,state:()=>state,layers,body,face,mask};
}
