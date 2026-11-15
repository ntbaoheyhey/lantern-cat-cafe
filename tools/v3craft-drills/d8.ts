// D8 original floor/light exercise. LEARN/Q3.md T34–T39, X19.
// All masks come from the current original Soot paint. No reference textures.
import {createD7} from './d7';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
const vertex=`varying vec2 vUv;varying vec2 vWorld;
void main(){vUv=uv;vec4 q=modelMatrix*vec4(position,1.);vWorld=q.xy;gl_Position=projectionMatrix*viewMatrix*q;}`;
export const d8Recipe={id:'D8',durationMs:2000,actionMs:800,
 roles:['contact-shadow','projected-penumbra','directional-ground-residue','painted-ambient','action-rim'],
 method:'current-composed-alpha-ground-projection-and-directional-inner-rim',
 // X19 actual bottom-eight-pixel foot centres; fixed D7/Q2 drill placement.
 feet:[[284.94193548387096,168],[330.1140350877193,168]],
 crop:[180,140,280,280],palette:['#1c1424','#bc72ed','#75419c','#f5cda0']};

export async function createD8(T:any,revision:number,context:any){
 const {renderer,scene,camera,actor}=context;
 const pose=await createD7(T,2,context),root=new T.Group();root.name='D8 floor and local light';
 // X20: one texel per field pixel avoids a second filtering of the paint.
 const [x,y,w,h]=d8Recipe.crop,resolution=revision>=1?280:320,paintTarget=new T.WebGLRenderTarget(resolution,resolution,{
  type:T.HalfFloatType,format:T.RGBAFormat,depthBuffer:false,stencilBuffer:false,
  minFilter:T.LinearFilter,magFilter:T.LinearFilter});
 paintTarget.texture.colorSpace=T.LinearSRGBColorSpace;
 const paintCamera=new T.OrthographicCamera(x,x+w,y+h,y,-100,100);paintCamera.position.z=10;
 const footprint=new T.Group(),bodyGroup=new T.Group();footprint.renderOrder=4;bodyGroup.renderOrder=10;
 root.add(footprint,bodyGroup);
 const common={uPaint:{value:paintTarget.texture},uCrop:{value:new T.Vector4(x,y,w,h)}};
 const light={...common,uTexel:{value:new T.Vector2(1/resolution,1/resolution)},uLight:{value:0},uAmbient:{value:1},
  uRimWidth:{value:2.5},uLightColour:{value:new T.Color('#bc72ed')},uDirection:{value:new T.Vector2(.87,.5)},
  uFace:{value:new T.Vector4(271,278,76,55)},uRevision:{value:revision},
  uSource:{value:new T.Vector2(400,162)},uWarm:{value:new T.Color('#f5cda0')}};
 const bodyMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
  uniforms:light,vertexShader:vertex,fragmentShader:`
uniform sampler2D uPaint;uniform vec4 uCrop,uFace;uniform vec2 uTexel,uDirection,uSource;
uniform float uLight,uAmbient,uRimWidth,uRevision;uniform vec3 uLightColour,uWarm;varying vec2 vUv;varying vec2 vWorld;
float opacity(vec2 q){return texture2D(uPaint,q).a;}
void main(){
 vec4 tex=texture2D(uPaint,vUv);float a=tex.a;if(a<.001)discard;
 // Normal source-over into a clear target stores premultiplied linear RGB.
 vec3 paint=tex.rgb/max(a,.001);
 vec2 d=uTexel*uRimWidth;
 float left=opacity(vUv-vec2(d.x,0.)),right=opacity(vUv+vec2(d.x,0.));
 float below=opacity(vUv-vec2(0.,d.y)),above=opacity(vUv+vec2(0.,d.y));
 vec2 outward=vec2(left-right,below-above);
 float facing=max(0.,dot(outward/max(.001,length(outward)),uDirection));
 float inner=clamp((a-(left+right+below+above)*.25)*2.8,0.,1.);
 vec2 fq=(vWorld-(uFace.xy+uFace.zw*.5))/(uFace.zw*.65);
 float protect=1.-smoothstep(.65,1.2,length(fq));
 float rim=inner*facing*uLight*(1.-protect*.90);
 float bounce=.025+.055*(1.-smoothstep(173.,258.,vWorld.y));
 vec3 colour=paint*(vec3(1.)+bounce*vec3(.9,.15,-.4)*uAmbient);
 if(uRevision>1.5){
  // Warm cafe light and the violet ground source have different directions.
  float ambientRim=inner*facing*.06*(1.-protect*.9);
  colour=mix(colour,uWarm,ambientRim*.45);
  vec2 toSource=uSource-vWorld;
  float pointFacing=max(0.,dot(outward/max(.001,length(outward)),toSource/max(.001,length(toSource))));
  float actionRim=inner*pointFacing*uLight*(1.-protect*.9);
  colour=mix(colour,uLightColour,actionRim*.45);
 }else colour=mix(colour,uLightColour,rim*.45);
 gl_FragColor=vec4(colour,a);
 #include <colorspace_fragment>
}`});
 const body=new T.Mesh(new T.PlaneGeometry(w,h),bodyMaterial);body.position.set(x+w/2,y+h/2,0);bodyGroup.add(body);

 const shadowUniforms={...common,uFeet:{value:new T.Vector4(d8Recipe.feet[0][0],168,d8Recipe.feet[1][0],168)},
  uDark:{value:new T.Color('#1c1424')},uProjection:{value:new T.Vector2(.19,.14)},uSoftness:{value:revision>=1?3:2.3},
  uCoreRadius:{value:new T.Vector2(revision>=1?13:11,revision>=1?4.2:3.2)},
  uCoreAlpha:{value:revision>=1?.58:.48},uPenumbraAlpha:{value:revision>=1?.34:.28}};
 const shadowMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
  uniforms:shadowUniforms,vertexShader:vertex,fragmentShader:`
uniform sampler2D uPaint;uniform vec4 uCrop,uFeet;uniform vec2 uProjection,uCoreRadius;
uniform vec3 uDark;uniform float uSoftness,uCoreAlpha,uPenumbraAlpha;varying vec2 vWorld;
float projected(vec2 q){
 float height=(q.y-uFeet.y)/uProjection.y;
 vec2 source=vec2(q.x+height*uProjection.x,uFeet.y+height);
 vec2 uv=(source-uCrop.xy)/uCrop.zw;
 if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.||height<0.)return 0.;
 return texture2D(uPaint,uv).a;
}
void main(){
 vec2 q=vWorld;float p=projected(q)*.28;
 p+=(projected(q+vec2(uSoftness,0.))+projected(q-vec2(uSoftness,0.))
   +projected(q+vec2(0.,uSoftness))+projected(q-vec2(0.,uSoftness)))*.12;
 p+=(projected(q+vec2(uSoftness,uSoftness))+projected(q+vec2(-uSoftness,uSoftness))
   +projected(q+vec2(uSoftness,-uSoftness))+projected(q-vec2(uSoftness,uSoftness)))*.06;
 vec2 footA=(q-uFeet.xy)/uCoreRadius,footB=(q-uFeet.zw)/uCoreRadius;
 float contact=max(exp(-dot(footA,footA)),exp(-dot(footB,footB)))*uCoreAlpha;
 float a=1.-(1.-contact)*(1.-p*uPenumbraAlpha);
 if(a<.001)discard;gl_FragColor=vec4(uDark,a);
 #include <colorspace_fragment>
}`});
 const shadow=new T.Mesh(new T.PlaneGeometry(280,90),shadowMaterial);shadow.position.set(300,183,0);footprint.add(shadow);

 // An original asymmetric, feathered ground streak points toward the action.
 // It is finite and erodes along its length, separate from the permanent shadow.
 const decalUniforms={uHead:{value:0},uTail:{value:0},uAlpha:{value:0},uTime:{value:0},uColour:{value:new T.Color('#bc72ed')},uRevision:{value:revision},
  uVeinHead:{value:new T.Vector3()},uVeinTail:{value:new T.Vector3()},uVeinAlpha:{value:new T.Vector3()}};
 const decalMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
  uniforms:decalUniforms,vertexShader:vertex,fragmentShader:`
uniform float uHead,uTail,uAlpha,uTime,uRevision;uniform vec3 uColour,uVeinHead,uVeinTail,uVeinAlpha;varying vec2 vUv;
float veinLife(float u,float n,float head,float tail){
 return (1.-smoothstep(head-.10,head+.015,u))*smoothstep(tail-.06,tail+.12,u)*smoothstep(tail*.72-.14,tail*.72+.08,n);
}
void main(){
 float u=vUv.x,centre=.48+.12*sin(u*3.1),width=.21*pow(sin(3.14159*u),.7);
 float cross=abs(vUv.y-centre)/max(.001,width);
 float feather=1.-smoothstep(.35,1.,cross);float primary=0.,upper=0.,lower=0.;
 if(uRevision>.5){
  // Different lengths, offsets and taper form a directional broken footprint.
  primary=1.-smoothstep(.45,1.,abs(vUv.y-(.48+.10*sin(u*3.1)))/max(.001,.105*pow(sin(3.14159*u),.7)));
  float upperU=clamp((u-.12)/.76,0.,1.);
  upper=(1.-smoothstep(.4,1.,abs(vUv.y-(.76-.13*u))/max(.001,.035*sin(3.14159*upperU))))*step(.12,u)*step(u,.88);
  float lowerU=clamp((u-.29)/.7,0.,1.);
  lower=(1.-smoothstep(.4,1.,abs(vUv.y-(.25+.12*u))/max(.001,.028*sin(3.14159*lowerU))))*step(.29,u)*step(u,.99);
  feather=max(primary,max(upper*.85,lower*.72));
 }
 float grain=.5+.24*sin(u*43.+vUv.y*19.)+.16*sin(u*79.-vUv.y*53.);
 float leading=1.-smoothstep(uHead-.1,uHead+.015,u);
 float trailing=smoothstep(uTail-.06,uTail+.12,u);
 float erosion=smoothstep(uTail*.72-.14,uTail*.72+.08,grain);
 float alpha=feather*leading*trailing*erosion*uAlpha;
 if(uRevision>1.5){
  vec3 lives=vec3(veinLife(u,grain,uVeinHead.x,uVeinTail.x),veinLife(u,grain,uVeinHead.y,uVeinTail.y),veinLife(u,grain,uVeinHead.z,uVeinTail.z));
  vec3 veins=vec3(primary,upper*.85,lower*.72)*lives*uVeinAlpha;
  alpha=max(veins.x,max(veins.y,veins.z));
 }
 if(alpha<.001)discard;gl_FragColor=vec4(uColour*(.65+.35*grain),alpha);
 #include <colorspace_fragment>
}`});
 const decal=new T.Mesh(new T.PlaneGeometry(240,revision>=1?43:55),decalMaterial);decal.position.set(366,162,0);decal.renderOrder=1;footprint.add(decal);
 let state:any={};
 function capturePaint(){
  const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
  const visible=scene.children.map((o:any)=>[o,o.visible]);
  visible.forEach(([o]:any)=>o.visible=o===actor.root);actor.root.visible=true;
  renderer.setRenderTarget(paintTarget);renderer.setClearColor(0,0);renderer.render(scene,paintCamera);
  visible.forEach(([o,v]:any)=>o.visible=v);actor.root.visible=false;
  renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);
 }
 function draw(ms:number){
  pose.draw(ms);capturePaint();
  const rise=smooth((ms-(revision>=2?180:100))/(revision>=2?170:250)),fall=1-smooth((ms-425)/375),action=rise*fall;
  light.uLight.value=revision>=2?.8*action:revision>=1?.06+.74*action:.08+.57*action;
  if(revision>=2)light.uLightColour.value.set('#bc72ed');
  else if(revision>=1)light.uLightColour.value.set('#f5cda0').lerp(new T.Color('#bc72ed'),action);
  // Reproject the face protection with the rigid D7 head offset.
  const posed=pose.state(),scale=actor.root.scale.x;
  light.uFace.value.set(271+posed.lean*scale,278+posed.headShift*scale,76,55);
  decalUniforms.uHead.value=1.08*smooth((ms-150)/240);
  decalUniforms.uTail.value=-.08+1.2*smooth((ms-390)/410);
  decalUniforms.uAlpha.value=(revision>=1?.42:.28)*smooth((ms-150)/150)*(1-smooth((ms-520)/280));
  decalUniforms.uTime.value=ms/1000;
  decalUniforms.uColour.value.set('#bc72ed').lerp(new T.Color('#75419c'),smooth((ms-425)/300));
  if(revision>=2){
   decalUniforms.uVeinHead.value.set(1.08*smooth((ms-150)/240),1.08*smooth((ms-180)/250),1.08*smooth((ms-215)/260));
   decalUniforms.uVeinTail.value.set(-.08+1.2*smooth((ms-390)/345),-.08+1.2*smooth((ms-445)/315),-.08+1.2*smooth((ms-495)/295));
   decalUniforms.uVeinAlpha.value.set(.42*smooth((ms-150)/150)*(1-smooth((ms-460)/240)),
    .36*smooth((ms-180)/160)*(1-smooth((ms-520)/240)),.30*smooth((ms-215)/150)*(1-smooth((ms-570)/230)));
  }
  state={recipe:'D8',revision,phase:ms<250?'build':ms<350?'release':ms<425?'contact':ms<800?'residue':'rest',
   actionLight:light.uLight.value,ambient:light.uAmbient.value,feet:d8Recipe.feet,crop:d8Recipe.crop,
   decalHead:decalUniforms.uHead.value,decalTail:decalUniforms.uTail.value,decalAlpha:decalUniforms.uAlpha.value,
   veinHeads:decalUniforms.uVeinHead.value.toArray(),veinTails:decalUniforms.uVeinTail.value.toArray(),veinAlphas:decalUniforms.uVeinAlpha.value.toArray(),
   lightSource:revision>=2?light.uSource.value.toArray():null,roles:d8Recipe.roles,pose:posed,method:d8Recipe.method};
 }
 async function prepare(){draw(350);await renderer.compileAsync(scene,camera);draw(0);}
 const layers=[{role:'contact-shadow-and-projection',mesh:shadow},{role:'directional-ground-residue',mesh:decal},{role:'paint-and-local-light',mesh:body}];
 return{root,draw,prepare,state:()=>state,layers,pose,paintTarget,paintCamera,body,shadow,decal,
  light,shadowUniforms,decalUniforms,capturePaint};
}
