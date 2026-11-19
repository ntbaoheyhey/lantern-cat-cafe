/**
 * V10 shader layer for the MVP ultimates. One full-screen WebGL pass draws the
 * soft, light-like parts that canvas 2D renders as hard vector shapes: a
 * turbulent comet with a flame tail, fire bursts, heat rings, a paper-lantern
 * ward, tea steam and floor light. Everything is procedural noise; no image or
 * reference art is used. When WebGL is unavailable the layer stays empty and
 * the 2D painter still draws its particles, so the battle never breaks.
 */
export interface FxColor {core:[number,number,number];glow:[number,number,number];accent:[number,number,number];deep:[number,number,number]}
export interface FxFrame {
 w:number;h:number;time:number;
 /** 0..1 full-screen warm flash. */
 flash:number;
 /** Comet: head x,y,radius and heading; trail points in screen px (newest first). */
 comet?:{x:number;y:number;r:number;power:number;trail:[number,number][]};
 /** Fire bursts: x, y (base), radius, life 0..1. */
 bursts:{x:number;y:number;r:number;life:number;power:number}[];
 /** Ground heat/shock rings: centre, max radius, life 0..1. */
 rings:{x:number;y:number;r:number;life:number;power:number}[];
 /** Floor light pools. */
 pools:{x:number;y:number;r:number;power:number}[];
 /** Paper-lantern ward: centre x, ground y, radii, life 0..1 grow, alpha. */
 dome?:{x:number;y:number;rx:number;ry:number;grow:number;alpha:number};
 /** Rising tea steam / healing light columns: x, base y, width, height, alpha. */
 columns:{x:number;y:number;w:number;h:number;alpha:number}[];
 /** Spiral of steam from a to b with progress 0..1. */
 swirl?:{ax:number;ay:number;bx:number;by:number;u:number;alpha:number};
 palette:FxColor;
 /** Hit sparks: x, y, radius, life 0..1, colour. */
 sparks?:{x:number;y:number;r:number;life:number;power:number;color:[number,number,number];seed:number}[];
}

const MAX_TRAIL=20,MAX_BURST=6,MAX_RING=4,MAX_POOL=6,MAX_COL=6,MAX_SPARK=8;

const VERT=`#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG=`#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;uniform float uK;uniform float uT;uniform float uFlash;
uniform vec3 uCore;uniform vec3 uGlow;uniform vec3 uAccent;uniform vec3 uDeep;
uniform vec4 uHead;uniform int uTrailN;uniform vec3 uTrail[${MAX_TRAIL}];
uniform int uBurstN;uniform vec4 uBurst[${MAX_BURST}];uniform float uBurstP[${MAX_BURST}];
uniform int uRingN;uniform vec4 uRing[${MAX_RING}];uniform float uRingP[${MAX_RING}];
uniform int uPoolN;uniform vec4 uPool[${MAX_POOL}];
uniform vec4 uDome;uniform vec2 uDomeS;
uniform int uColN;uniform vec4 uCol[${MAX_COL}];uniform float uColA[${MAX_COL}];
uniform vec4 uSwirl;uniform vec2 uSwirlS;
uniform int uSparkN;uniform vec4 uSpark[${MAX_SPARK}];uniform vec4 uSparkC[${MAX_SPARK}];

float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*f*(f*(f*6.-15.)+10.);
 return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*vnoise(p);p=m*p;a*=.5;}return s;}
// Warm fire ramp: deep -> accent -> glow -> core -> white by heat 0..1.
vec3 ramp(float t){t=clamp(t,0.,1.);
 vec3 ember=uGlow*vec3(.55,.22,.12)+uAccent*.10;
 vec3 c=mix(ember*.5,ember,smoothstep(.0,.25,t));c=mix(c,uGlow,smoothstep(.2,.55,t));c=mix(c,uCore,smoothstep(.5,.85,t));return mix(c,vec3(1.),smoothstep(.86,1.,t));}
float segd(vec2 p,vec2 a,vec2 b,out float h){vec2 pa=p-a,ba=b-a;h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);return length(pa-ba*h);}

void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
 float k=uK;vec3 col=vec3(0.);float smoke=0.;
 // Comet tail: distance to the polyline, tapering radius, noise flowing back along the path.
 if(uTrailN>1){
  float best=1e9,along=0.,acc=0.,bestAlong=0.,rad=1.;
  for(int i=0;i<${MAX_TRAIL-1};i++){if(i>=uTrailN-1)break;
   vec2 a=uTrail[i].xy,b=uTrail[i+1].xy;float hh;float d=segd(p,a,b,hh);float r=mix(uTrail[i].z,uTrail[i+1].z,hh);
   float nd=d/max(r,1.);if(nd<best){best=nd;bestAlong=acc+hh*length(b-a);rad=r;}acc+=length(b-a);}
  float L=max(acc,1.);float s=bestAlong/L;
  vec2 q=vec2(bestAlong/(26.*k),best*1.6);
  float n=fbm(q*vec2(1.,1.3)+vec2(-uT*7.,uT*.7));
  float n2=fbm(q*2.3+vec2(-uT*11.,0.)+n);
  float body=1.-best+((n-.5)*1.1+(n2-.5)*.45)*smoothstep(.0,.35,s);
  float heat=clamp(body*1.15-s*.85,0.,1.);
  float a=smoothstep(.0,.35,body)*(1.-smoothstep(.7,1.,s));
  col+=ramp(heat)*a*uHead.w*(1.4-s*.6)+uAccent*smoothstep(-.6,.2,body)*(1.-s)*.22*uHead.w;
  // Soot-dark smoke wake on the outer edge of the old tail.
  smoke+=smoothstep(.2,.9,s)*smoothstep(1.4,.6,best+(n-.5))*.35*uHead.w;
 }
 // Comet head: white-hot core, flickering corona.
 if(uHead.z>0.){
  vec2 d=(p-uHead.xy)/uHead.z;float r=length(d);float ang=atan(d.y,d.x);
  float n=fbm(vec2(ang*2.,r*2.-uT*9.));
  float core=exp(-r*r*3.2);float corona=exp(-max(r-.55,0.)*2.4)*smoothstep(1.9,.2,r+(n-.5)*.9);
  col+=(vec3(1.)*core*1.6+ramp(.75)*corona*.9+uAccent*exp(-r*.9)*.45)*uHead.w;
 }
 // Fire bursts: a dome of turbulent flame rising from the base point.
 for(int i=0;i<${MAX_BURST};i++){if(i>=uBurstN)break;
  vec4 b=uBurst[i];float life=b.w,pw=uBurstP[i];vec2 d=(p-b.xy)/b.z;d.y=-d.y;// up is +y
  float grow=1.-pow(1.-min(life*3.,1.),3.);
  vec2 q=d/max(grow,.05);
  float n=fbm(vec2(q.x*2.4,q.y*1.2-uT*5.)+float(i)*7.1);
  float n2=fbm(vec2(q.x*4.5,q.y*3.-uT*9.)+n*1.7);
  float yy=max(q.y,0.);float shape=1.-length(vec2(q.x*(.8+yy*1.1),yy*.5+min(q.y,0.)*2.6));
  float flame=shape+(n-.5)*.9+(n2-.5)*.45-life*.75;
  float a=smoothstep(0.,.3,flame)*pow(1.-life,1.2);
  float heat=clamp(flame*1.05+.12-life*.55+(n2-.5)*.5-yy*.18,0.,1.);
  col+=ramp(heat)*a*pw*(.85+.5*heat);
  // Bloom halo.
  col+=(uGlow*.7+uAccent*.3)*exp(-length(d)*1.7)*(1.-life)*.5*pw;
  smoke+=smoothstep(.35,1.,life)*smoothstep(.2,-.6,shape+(n-.5))*.0+smoothstep(.45,1.,life)*exp(-length(d-vec2(0.,.6+life))*1.6)*.55*pw*(1.-smoothstep(.85,1.,life));
 }
 // Heat rings on the floor (perspective ellipse), broken by noise so they read as fire, not a stroke.
 for(int i=0;i<${MAX_RING};i++){if(i>=uRingN)break;
  vec4 r=uRing[i];float life=r.w;float rr=r.z*(1.-pow(1.-life,3.));
  vec2 d=(p-r.xy)/vec2(max(rr,1.),max(rr*.3,1.));float e=length(d);
  float ang=atan(d.y,d.x);float n=fbm(vec2(ang*3.,e*2.-uT*3.)+float(i)*3.);
  float w=.10+.18*life;float band=exp(-pow((e-1.)/w,2.))*(.55+n*.9);
  float inner=smoothstep(1.,.2,e)*(1.-life)*.35;
  float fade=(1.-life)*(1.-life);
  col+=(ramp(.42+band*.3)*band*.8+uGlow*inner)*fade*uRingP[i];
 }
 // Floor light pools (light spill on the boards).
 for(int i=0;i<${MAX_POOL};i++){if(i>=uPoolN)break;
  vec4 l=uPool[i];vec2 d=(p-l.xy)/vec2(l.z,l.z*.34);float e=dot(d,d);
  col+=uGlow*exp(-e*1.4)*l.w*.55+uCore*exp(-e*5.)*l.w*.25;
 }
 // Paper-lantern ward (Mochi): warm translucent hemisphere with lantern ribs and a hot rim.
 if(uDomeS.y>0.){
  vec2 d=(p-uDome.xy)/vec2(uDome.z,uDome.w);d.y=-d.y;float g=uDomeS.x;
  vec2 q=d/max(g,.05);float e=length(q);
  if(q.y>-.12&&e<1.25){
   float inside=smoothstep(1.02,.96,e)*smoothstep(-.12,.02,q.y);
   float rim=exp(-pow((e-1.)/.045,2.))*smoothstep(-.12,.05,q.y);
   float ribs=pow(abs(sin((q.y+.10*q.x*q.x)*3.14159*5.)),24.)*inside*smoothstep(.0,.15,q.y);// horizontal lantern ribs
   float paper=fbm(q*7.+vec2(0.,uT*.3));
   float fres=smoothstep(.35,1.,e);
   float sweep=exp(-pow((q.x-(fract(uT*.55)*2.6-1.3))/.18,2.))*inside*.5;// light sweeping across the paper
   vec3 c=uGlow*inside*(.04+fres*.30+paper*.08)+uCore*(rim*1.0+ribs*.30+sweep*.8);
   col+=c*uDomeS.y;
  }
  // Ground seal.
  vec2 gd=(p-uDome.xy)/vec2(uDome.z*g,uDome.z*g*.16);float ge=length(gd);
  col+=(uCore*exp(-pow((ge-1.)/.06,2.))*.9+uGlow*smoothstep(1.,.0,ge)*.18)*uDomeS.y;
 }
 // Tea steam / healing columns: soft rising light with curling wisps.
 for(int i=0;i<${MAX_COL};i++){if(i>=uColN)break;
  vec4 c=uCol[i];vec2 d=(p-c.xy)/vec2(c.z,c.w);d.y=-d.y;
  if(d.y>-.15&&d.y<1.2){
   float n=fbm(vec2(d.x*2.5,d.y*2.-uT*1.6)+float(i)*5.);
   float wobble=(n-.5)*.6*d.y;
   float x=abs(d.x+wobble);
   float body=smoothstep(.55,.0,x)*smoothstep(-.15,.1,d.y)*smoothstep(1.15,.35,d.y);
   float wisp=smoothstep(.06,.0,abs(fract(d.y*3.-uT*1.2+n)-.5)-.38)*smoothstep(.4,.05,x)*.35;
   col+=(uGlow*body*.34+uCore*body*body*.18+uAccent*wisp*body)*uColA[i];
  }
 }
 // Tea spiral: two ribbons of steam twisting along an upward arc from the teapot to the bloom point.
 if(uSwirlS.y>0.){
  vec2 a=uSwirl.xy,b=uSwirl.zw;float L=max(length(b-a),1.);vec2 ab=(b-a)/L;vec2 nrm=vec2(-ab.y,ab.x);
  float t=dot(p-a,ab)/L;float side=dot(p-a,nrm)-dot(vec2(0.,-1.),nrm)*sin(3.14159*clamp(t,0.,1.))*.35*L;
  float best=1e9;
  for(int s=0;s<2;s++){float ph=float(s)*3.14159;
   float amp=22.*k*(1.-t*.5);
   float off=sin(t*L/(30.*k)+ph-uT*10.)*amp;
   best=min(best,abs(side-off));}
  float inside=smoothstep(-.02,.03,t)*smoothstep(uSwirlS.x+.02,uSwirlS.x-.1,t)*smoothstep(1.03,.97,t);
  float n=fbm(vec2(t*9.-uT*4.,side*.04));
  float ribbon=exp(-pow(best/(7.*k*(.6+n)),2.))*inside;
  float haze=exp(-pow(side/(40.*k),2.))*inside*.18;
  col+=(uGlow*.85+uCore*.45)*ribbon*uSwirlS.y+uGlow*haze*uSwirlS.y;
 }
 // Hit sparks: a hot core, a four-to-six point light star, a thin expanding ring.
 for(int i=0;i<${MAX_SPARK};i++){if(i>=uSparkN)break;
  vec4 s=uSpark[i];vec3 sc=uSparkC[i].rgb;float pw=uSparkC[i].w;float life=s.w;
  vec2 d=(p-s.xy)/s.z;float r=length(d);float ang=atan(d.y,d.x)+float(i)*1.3;
  float grow=1.-pow(1.-min(life*2.4,1.),3.);float fade=pow(1.-life,1.6);
  float star=pow(abs(cos(ang*2.)),16.)*exp(-r/(1.3*grow+.05))*1.4+pow(abs(cos(ang*2.+.785)),30.)*exp(-r/(.7*grow+.05))*.8;
  float core=exp(-r*r*7./(grow+.15));
  float ring=exp(-pow((r-grow*.9)/.05,2.))*(1.-life);
  col+=(vec3(1.)*core*1.6+mix(sc,vec3(1.),.4)*star*1.5+sc*ring*1.1+sc*exp(-r*1.8)*.55)*fade*pw;
 }
 col+=vec3(1.,.93,.82)*uFlash;
 // Premultiplied output: emission adds light; smoke darkens a little.
 float lum=max(col.r,max(col.g,col.b));
 float a=clamp(lum*.85,0.,1.);
 vec3 c=col/(1.+lum*.35);// soft shoulder so overlaps glow instead of clipping
 float sm=clamp(smoke,0.,.6)*(1.-a);
 o=vec4(c+uDeep*.12*sm,clamp(a+sm,0.,1.));
}`;

function hex(c:string):[number,number,number]{const v=c.replace('#','');const n=parseInt(v.length===3?v.split('').map(x=>x+x).join(''):v.slice(0,6),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
export function fxPalette(p:{core:string;glow:string;accent:string;deep:string}):FxColor{return {core:hex(p.core),glow:hex(p.glow),accent:hex(p.accent),deep:hex(p.deep)};}

export class UltimateGlLayer {
 readonly canvas:HTMLCanvasElement;
 private gl:WebGL2RenderingContext|null=null;private prog:WebGLProgram|null=null;
 private loc=new Map<string,WebGLUniformLocation|null>();private ratio=1;private cleared=true;
 readonly audit={ok:false,draws:0};
 constructor(host:HTMLElement){
  this.canvas=document.createElement('canvas');this.canvas.className='v10-ult-gl';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'39'});
  host.appendChild(this.canvas);
  try{this.init();}catch{this.gl=null;}
 }
 private init(){
  const gl=this.canvas.getContext?.('webgl2',{premultipliedAlpha:true,alpha:true,antialias:false,depth:false,stencil:false}) as WebGL2RenderingContext|null;
  if(!gl)return;
  const sh=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'shader');return s;};
  const prog=gl.createProgram()!;gl.attachShader(prog,sh(gl.VERTEX_SHADER,VERT));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog)??'link');
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const at=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
  this.gl=gl;this.prog=prog;this.audit.ok=true;
 }
 private u(name:string){if(!this.loc.has(name))this.loc.set(name,this.gl!.getUniformLocation(this.prog!,name));return this.loc.get(name)!;}
 clear(){
  const gl=this.gl;if(!gl||this.cleared)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);this.cleared=true;
 }
 draw(f:FxFrame){
  const gl=this.gl;if(!gl||!this.prog)return;
  // Shader cost scales with pixels; 1.25x is plenty for soft light.
  const ratio=Math.min(globalThis.devicePixelRatio||1,1.25),W=Math.round(f.w*ratio),H=Math.round(f.h*ratio);
  if(this.canvas.width!==W||this.canvas.height!==H||ratio!==this.ratio){this.ratio=ratio;this.canvas.width=W;this.canvas.height=H;}
  gl.viewport(0,0,W,H);gl.useProgram(this.prog);
  const s=ratio,k=f.h/720;
  gl.uniform2f(this.u('uRes'),W,H);gl.uniform1f(this.u('uK'),k*s);gl.uniform1f(this.u('uT'),f.time);gl.uniform1f(this.u('uFlash'),f.flash);
  const P=f.palette;gl.uniform3fv(this.u('uCore'),P.core);gl.uniform3fv(this.u('uGlow'),P.glow);gl.uniform3fv(this.u('uAccent'),P.accent);gl.uniform3fv(this.u('uDeep'),P.deep);
  const trail=(f.comet?.trail??[]).slice(0,MAX_TRAIL),n=trail.length;
  const tr=new Float32Array(MAX_TRAIL*3);trail.forEach(([x,y],i)=>{tr[i*3]=x*s;tr[i*3+1]=y*s;tr[i*3+2]=(f.comet!.r*(1-.7*i/Math.max(1,n-1))+6*k)*s*1.5;});
  gl.uniform1i(this.u('uTrailN'),n);gl.uniform3fv(this.u('uTrail'),tr);
  gl.uniform4f(this.u('uHead'),(f.comet?.x??0)*s,(f.comet?.y??0)*s,f.comet?f.comet.r*s:0,f.comet?.power??0);
  const bursts=f.bursts.slice(0,MAX_BURST),bu=new Float32Array(MAX_BURST*4),bp=new Float32Array(MAX_BURST);
  bursts.forEach((b,i)=>{bu.set([b.x*s,b.y*s,b.r*s,b.life],i*4);bp[i]=b.power;});
  gl.uniform1i(this.u('uBurstN'),bursts.length);gl.uniform4fv(this.u('uBurst'),bu);gl.uniform1fv(this.u('uBurstP'),bp);
  const rings=f.rings.slice(0,MAX_RING),ru=new Float32Array(MAX_RING*4),rp=new Float32Array(MAX_RING);
  rings.forEach((r,i)=>{ru.set([r.x*s,r.y*s,r.r*s,r.life],i*4);rp[i]=r.power;});
  gl.uniform1i(this.u('uRingN'),rings.length);gl.uniform4fv(this.u('uRing'),ru);gl.uniform1fv(this.u('uRingP'),rp);
  const pools=f.pools.slice(0,MAX_POOL),pu=new Float32Array(MAX_POOL*4);pools.forEach((l,i)=>pu.set([l.x*s,l.y*s,l.r*s,l.power],i*4));
  gl.uniform1i(this.u('uPoolN'),pools.length);gl.uniform4fv(this.u('uPool'),pu);
  const d=f.dome;gl.uniform4f(this.u('uDome'),(d?.x??0)*s,(d?.y??0)*s,(d?.rx??1)*s,(d?.ry??1)*s);gl.uniform2f(this.u('uDomeS'),d?.grow??0,d?.alpha??0);
  const cols=f.columns.slice(0,MAX_COL),cu=new Float32Array(MAX_COL*4),ca=new Float32Array(MAX_COL);
  cols.forEach((c,i)=>{cu.set([c.x*s,c.y*s,c.w*s,c.h*s],i*4);ca[i]=c.alpha;});
  gl.uniform1i(this.u('uColN'),cols.length);gl.uniform4fv(this.u('uCol'),cu);gl.uniform1fv(this.u('uColA'),ca);
  const w=f.swirl;gl.uniform4f(this.u('uSwirl'),(w?.ax??0)*s,(w?.ay??0)*s,(w?.bx??1)*s,(w?.by??1)*s);gl.uniform2f(this.u('uSwirlS'),w?.u??0,w?.alpha??0);
  const sparks=(f.sparks??[]).slice(0,MAX_SPARK),su=new Float32Array(MAX_SPARK*4),sc=new Float32Array(MAX_SPARK*4);
  sparks.forEach((q,i)=>{su.set([q.x*s,q.y*s,q.r*s,q.life],i*4);sc.set([...q.color,q.power],i*4);});
  gl.uniform1i(this.u('uSparkN'),sparks.length);gl.uniform4fv(this.u('uSpark'),su);gl.uniform4fv(this.u('uSparkC'),sc);
  gl.disable(gl.BLEND);gl.drawArrays(gl.TRIANGLES,0,3);
  this.cleared=false;this.audit.draws++;
 }
 dispose(){const ext=this.gl?.getExtension('WEBGL_lose_context');ext?.loseContext();this.canvas.remove();this.gl=null;}
}
