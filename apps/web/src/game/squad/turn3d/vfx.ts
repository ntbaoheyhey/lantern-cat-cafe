/** Pooled original 3D spell language: tapered ribbons, runes, branching bolts and soft instanced motes. */
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EFFECT_DIRECTION,type Direction} from './effect-direction';
import type {EffectFrame} from './effects';
import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
import {gearAccent} from './gear-visuals';
const vertex=`varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=vec3(1.);#ifdef USE_INSTANCING_COLOR\nvColor=instanceColor;\n#endif\nvec4 p=vec4(position,1.);#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\ngl_Position=projectionMatrix*modelViewMatrix*p;}`.replaceAll(';#',';\n#');
const ribbonFragment=`varying vec2 vUv;uniform vec3 color;uniform vec3 accent;uniform float fade;uniform float phase;void main(){float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),1.8);float taper=sin(vUv.x*3.14159);float silk=.8+.2*sin(vUv.x*57.-phase*9.);gl_FragColor=vec4(mix(color,accent,edge*.55)*1.8,edge*taper*fade*silk);}`;
const moteFragment=`varying vec2 vUv;varying vec3 vColor;uniform float motif;void main(){vec2 p=vUv-.5;float r=length(p)*2.,a=atan(p.y,p.x);float mask=1.-smoothstep(.2,1.,r);if(motif>0.5&&motif<1.5)mask*=1.-smoothstep(.16,.5,abs(p.x)+abs(p.y)*.5);if(motif>1.5&&motif<2.5)mask=pow(max(0.,1.-abs(p.x)*8.),2.)*(1.-smoothstep(.1,.5,abs(p.y)));if(motif>2.5&&motif<3.5)mask*=.65+.35*sin(a*5.+r*12.);if(motif>3.5&&motif<4.5)mask*=smoothstep(.55,.9,cos(a*5.)+1.-r);gl_FragColor=vec4(vColor*1.7,mask*.75);}`;
const flameFragment=`varying vec2 vUv;uniform vec3 color;uniform vec3 accent;uniform float phase;uniform float fade;uniform float water;void main(){vec2 p=vUv;float sway=sin(p.y*12.-phase*7.)*.08+sin(p.y*21.+phase*5.)*.035;float width=(1.-p.y)*.38;float mask=1.-smoothstep(width*.45,width,abs(p.x-.5+sway));mask*=smoothstep(0.,.12,p.y)*(1.-smoothstep(.78,1.,p.y));float veins=.65+.35*sin(p.y*35.-phase*9.+p.x*12.);gl_FragColor=vec4(mix(color,accent,(1.-p.y)*.65)*1.65,mask*fade*veins*(water>.5?.45:.7));}`;
function signature(glyph:string):T.BufferGeometry{
 const parts:T.BufferGeometry[]=[];
 const line=(pts:number[][],radius=.028)=>parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2]??0))),Math.max(12,pts.length*4),radius,5,false));
 const ring=(x:number,y:number,r:number,sy=1)=>{const g=new T.TorusGeometry(r,.024,5,32);g.scale(1,sy,1);g.translate(x,y,0);parts.push(g)};
 const poly=(pts:number[][])=>line([...pts,pts[0]!]);
 const star=(n:number,r:number,inner=.45)=>poly(Array.from({length:n*2},(_,i)=>{const a=Math.PI/2+i*Math.PI/n,rr=i%2?r*inner:r;return[Math.cos(a)*rr,Math.sin(a)*rr]}));
 if(glyph==='woven-crown'){poly([[-.7,-.35],[-.65,.55],[-.32,.15],[0,.75],[.32,.15],[.65,.55],[.7,-.35]]);ring(0,-.1,.18);line([[-.7,-.35],[0,-.6],[.7,-.35]],.045)}
 else if(glyph==='crescent')line([[-.65,-.30],[-.35,.26],[.10,.43],[.62,.12],[.23,.23],[-.17,.10],[-.65,-.30]],.045);
 else if(['paw-shield','keystone','gate','banner'].includes(glyph)){
  if(glyph==='gate'){poly([[-.7,-.6],[-.7,.48],[-.36,.66],[.36,.66],[.7,.48],[.7,-.6]]);line([[-.4,-.6],[-.4,.3],[0,.52],[.4,.3],[.4,-.6]]);star(6,.20)}
  else if(glyph==='banner'){line([[0,-.7],[0,.7],[-.55,.7],[-.45,.22],[.5,.22],[.5,.7],[0,.7]]);star(4,.18)}
  else {poly([[-.5,.4],[0,.6],[.5,.4],[.4,-.2],[0,-.6],[-.4,-.2]]);if(glyph==='paw-shield'){ring(0,-.1,.15,.8);for(const x of [-.2,0,.2])ring(x,.2,.07)}else poly([[-.17,.15],[.17,.15],[.1,-.2],[-.1,-.2]])}
 }else if(['flame','wick','candle','cinder'].includes(glyph)){
  line([[0,-.55],[-.35,-.2],[-.24,.12],[-.05,.48],[.04,.12],[.21,.7],[.36,.16],[.27,-.28],[0,-.55]],.03);if(glyph==='wick')star(4,.22);if(glyph==='candle')poly([[-.17,-.6],[-.17,.05],[.17,.05],[.17,-.6]]);if(glyph==='cinder')ring(0,-.1,.22);
 }else if(['clover','nine-leaf','clearleaf','fallen-petal','wreath'].includes(glyph)){
  const n=glyph==='nine-leaf'?9:glyph==='clover'?4:glyph==='wreath'?7:glyph==='clearleaf'?3:1;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,points=[[0,0],[-.18,.25],[0,.62],[.18,.25],[0,0]].map(([x,y])=>[x!*Math.cos(a)-y!*Math.sin(a),x!*Math.sin(a)+y!*Math.cos(a)]);line(points,.024)}
  if(glyph==='wreath')ring(0,0,.4);
 }else if(['button','biscuit','spool','cup','tea','milk-crown','heart'].includes(glyph)){
  if(glyph==='button'||glyph==='biscuit'){ring(0,0,.51);for(const x of [-.17,.17])for(const y of [-.17,.17])ring(x,y,glyph==='button'?.065:.025);if(glyph==='button'){line([[-.17,-.17],[.17,.17]]);line([[-.17,.17],[.17,-.17]])}}
  else if(glyph==='spool'){for(const x of [-.45,.45])ring(x,0,.3,.9);line([[-.45,-.3],[.45,-.3]]);line([[-.45,.3],[.45,.3]]);for(let i=0;i<4;i++)line([[-.32+i*.2,-.28],[-.22+i*.2,.28]])}
  else if(glyph==='heart')line([[0,-.5],[-.5,.02],[-.42,.4],[-.16,.43],[0,.2],[.16,.43],[.42,.4],[.5,.02],[0,-.5]],.035);
  else if(glyph==='milk-crown'){poly([[-.6,-.2],[-.5,.4],[-.25,.05],[0,.55],[.25,.05],[.5,.4],[.6,-.2]]);ring(0,-.2,.5,.2)}
  else {line([[-.45,.3],[-.37,-.25],[0,-.43],[.37,-.25],[.45,.3],[-.45,.3]]);line([[.4,.22],[.66,.2],[.62,-.08],[.4,-.12]]);if(glyph==='tea')for(const x of [-.15,.15])line([[x,.42],[x+.06,.6],[x-.03,.8]],.018)}
 }else if(['loom','knot','cinch','cross-stitch','sewn-cross','yarn-fan'].includes(glyph)){
  if(glyph==='loom'){poly([[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]]);for(let i=0;i<4;i++){line([[-.4+i*.25,-.6],[-.4+i*.25,.6]],.016);line([[-.6,-.4+i*.25],[.6,-.4+i*.25]],.016)}}
  else if(glyph==='cross-stitch'||glyph==='sewn-cross'){line([[-.6,-.6],[0,0],[.6,.6]],.035);line([[-.6,.6],[0,0],[.6,-.6]],.035);if(glyph==='sewn-cross')for(let i=0;i<4;i++)line([[-.4+i*.25,-.52+i*.25],[-.5+i*.25,-.27+i*.25]],.012)}
  else if(glyph==='yarn-fan')for(let i=0;i<5;i++)line([[0,-.6],[(i-2)*.18,0],[(i-2)*.32,.6]],.035);
  else if(glyph==='cinch'){ring(0,0,.48,.4);line([[-.7,.12],[.7,-.12]],.03)}
  else line([[0,0],[-.5,.2],[-.4,.5],[0,.2],[.45,.5],[.5,.15],[0,0],[-.25,-.55],[0,-.15],[.3,-.5]],.04);
 }else if(['fletching','needle-eye','skip','chevrons','hammer','pillow','diamond'].includes(glyph)){
  if(glyph==='diamond')poly([[0,.7],[-.45,0],[0,-.7],[.45,0]]);
  if(glyph==='pillow')line([[-.5,-.35],[-.6,.4],[0,.3],[.6,.4],[.5,-.35],[0,-.3],[-.5,-.35]],.04);
  if(glyph==='hammer'){poly([[-.55,.1],[-.55,.55],[.55,.55],[.55,.1]]);poly([[-.10,.1],[-.10,-.65],[.10,-.65],[.10,.1]])}
  if(glyph==='skip'){line([[-.6,-.4],[-.1,.1],[.2,.1],[.6,.5]],.045);line([[-.5,-.62],[0,-.12],[.3,-.12],[.7,.28]],.022)}
  if(glyph==='chevrons')for(let i=0;i<3;i++)line([[-.5+i*.35,-.4],[-.2+i*.35,0],[-.5+i*.35,.4]],.035);
  if(glyph==='fletching'){line([[-.65,0],[.65,0]]);line([[.25,-.3],[.65,0],[.25,.3]]);line([[-.65,-.22],[-.4,0],[-.65,.22]])}
  if(glyph==='needle-eye'){line([[-.7,0],[.4,0]]);ring(.42,0,.16,.5)}
 }else if(['constellation','lantern-crown','sugar-star','sunray','seal','unseal'].includes(glyph)){
  if(glyph==='constellation'){star(4,.6,.18);for(const [x,y] of [[-.6,.2],[.4,.5],[.3,-.5]]){ring(x!,y!,.08);line([[0,0],[x!,y!]],.012)}}
  else if(glyph==='lantern-crown'){star(6,.55,.75);for(let i=0;i<3;i++){const x=(i-1)*.38;poly([[x-.1,.42],[x-.1,.75],[x+.1,.75],[x+.1,.42]])}}
  else if(glyph==='sunray'){ring(0,0,.24);star(12,.65,.58)}
  else if(glyph==='sugar-star'){star(5,.6);ring(0,0,.13)}
  else {star(glyph==='seal'?6:3,.55,.77);if(glyph==='seal')ring(0,0,.27);else line([[-.7,-.3],[.7,.3]],.02)}
 }else if(glyph==='splatter'){for(let i=0;i<7;i++){const a=i*2.4;line([[0,0],[Math.cos(a)*.2,Math.sin(a)*.2],[Math.cos(a)*(.3+i*.035),Math.sin(a)*(.3+i*.035)]],.025);ring(Math.cos(a)*.5,Math.sin(a)*.5,.025)}}
 else if(glyph==='rain')for(let i=0;i<5;i++)line([[-.45+i*.23,.45],[-.6+i*.23,-.4]],.018);
 if(!parts.length)throw Error(`Missing original silhouette ${glyph}`);
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());return geometry;
}
const random=(i:number,seed:number)=>{const n=Math.sin(i*127.1+seed*19.19)*43758.5453;return n-Math.floor(n)};

export class SpellVfx{
 readonly root=new T.Group();count=0;
 readonly ready:Promise<void>;
 private disposed=false;
 private shapes=new Map<string,T.BufferGeometry>();
 private scratch=Array.from({length:1024},()=>new T.Vector3());private cursor=0;private axis=new T.Vector3(0,0,1);private spin=new T.Quaternion();
 private v(x=0,y=0,z=0){const v=this.scratch[this.cursor++];if(!v)throw Error("VFX scratch capacity exceeded");return v.set(x,y,z)}
 private copy(v:T.Vector3){return this.v(v.x,v.y,v.z)}
 private ribbons:T.Mesh<T.BufferGeometry,T.ShaderMaterial>[]=[];private emblems:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>[]=[];
 private flames:T.Mesh<T.PlaneGeometry,T.ShaderMaterial>[]=[];private motes:T.InstancedMesh<T.PlaneGeometry,T.ShaderMaterial>;
 private bolts:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>[]=[];private matrix=new T.Matrix4();private scale=new T.Vector3();private rgb=new T.Color();private quat=new T.Quaternion();
 constructor(scene:T.Scene,private cooperative=false){
  scene.add(this.root);
  this.ready=this.prepareShapes();
  for(let i=0;i<6;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(49*2*3),3));const uv=[],indices=[];for(let j=0;j<49;j++){uv.push(j/48,0,j/48,1);if(j<48){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);const m=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:ribbonFragment,uniforms:{color:{value:new T.Color()},accent:{value:new T.Color()},phase:{value:0},fade:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.visible=false;this.ribbons.push(mesh);this.root.add(mesh)}
  for(let i=0;i<10;i++){const mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));mesh.visible=false;this.emblems.push(mesh);this.root.add(mesh)}
  for(let i=0;i<9;i++){const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({vertexShader:vertex,fragmentShader:flameFragment,uniforms:{color:{value:new T.Color()},accent:{value:new T.Color()},phase:{value:0},fade:{value:0},water:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));mesh.visible=false;this.flames.push(mesh);this.root.add(mesh)}
  for(let i=0;i<8;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(25*2*3),3));const idx=[];for(let j=0;j<24;j++){const k=j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}g.setIndex(idx);const mesh=new T.Mesh(g,new T.MeshBasicMaterial({color:'#c6b4ff',transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));mesh.visible=false;mesh.frustumCulled=false;this.bolts.push(mesh);this.root.add(mesh)}
  this.motes=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({vertexShader:vertex,fragmentShader:moteFragment,uniforms:{motif:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}),192);this.motes.count=0;this.motes.instanceMatrix.setUsage(T.DynamicDrawUsage);this.motes.frustumCulled=false;this.motes.setColorAt(0,new T.Color());this.root.add(this.motes);
 }
 private async prepareShapes(){
  for(const direction of Object.values(EFFECT_DIRECTION)){
   if(this.shapes.has(direction.glyph))continue;
   if(this.cooperative)await new Promise(resolve=>setTimeout(resolve,0));
   if(this.disposed)return;
   this.shapes.set(direction.glyph,signature(direction.glyph));
  }
 }
 render(frame:EffectFrame|null,actors:TurnActor[],positions:Map<string,T.Vector3>,camera:T.Camera,time:number,calm:boolean){
  this.cursor=0;
  this.ribbons.forEach(m=>m.visible=false);this.emblems.forEach(m=>m.visible=false);this.flames.forEach(m=>m.visible=false);this.bolts.forEach(m=>m.visible=false);let used=0,flames=0;
  const particle=(p:T.Vector3,size:number,c:string,alpha:number,angle=0)=>{if(used>=192)return;this.quat.copy(camera.quaternion).multiply(this.spin.setFromAxisAngle(this.axis,angle));this.matrix.compose(p,this.quat,this.scale.set(size,size,1));this.motes.setMatrixAt(used,this.matrix);this.motes.setColorAt(used++,this.rgb.set(c).multiplyScalar(Math.max(0,alpha)))};
  const flame=(p:T.Vector3,size:number,color:string,accent:string,fade:number,water=false)=>{const m=this.flames[flames++];if(!m)return;m.visible=true;m.position.copy(p);m.quaternion.copy(camera.quaternion);m.scale.set(size*.6,size,1);m.material.uniforms.color!.value.set(color);m.material.uniforms.accent!.value.set(accent);m.material.uniforms.fade!.value=fade;m.material.uniforms.phase!.value=calm?0:time;m.material.uniforms.water!.value=water?1:0;};
  for(const a of actors){const p=positions.get(a.id);if(!p||a.hp<=0)continue;
   if(a.statuses.some(s=>s.kind==='burn'))for(const side of [-1,1])flame(this.copy(p).add(this.v(side*.35,.32,.06)),.58,'#e87848','#ffce8a',.65);
   if(a.statuses.some(s=>s.kind==='taunt'))for(let i=0;i<4;i++){const t=i*Math.PI/2+(calm?0:time*.7);particle(this.copy(p).add(this.v(Math.cos(t)*.65,.12,Math.sin(t)*.65)),.13,'#efc177',.65)}
  }
  if(frame){const dir=EFFECT_DIRECTION[frame.plan.skillId]!;if(dir){const actor=actors.find(a=>a.id===frame.plan.actorId),start=this.copy(positions.get(frame.plan.actorId)??this.v()).add(this.v(0,.9,0));const targets=frame.plan.targetIds.map(id=>positions.get(id)).filter((x):x is T.Vector3=>!!x);if(!targets.length)targets.push(this.copy(start).setY(0));const end=this.copy(targets[0]!).add(this.v(0,.65,0));const phase=frame.beat.kind,t=frame.progress,color=frame.color,accent=gearAccent(actor)??frame.plan.accent,seed=[...frame.plan.skillId].reduce((n,c)=>n+c.charCodeAt(0),0);
   const life=phase==='anticipation'?t:phase==='travel'?t:phase==='impact'?.12:phase==='reaction'?.12+t*.48:.6+t*.4;
   const fade=phase==='residue'?1-t:1;
   const geometry=this.shapes.get(dir.glyph)!;
   const emblem=(index:number,center:T.Vector3,size:number,ground=false,alpha=1)=>{const mesh=this.emblems[index];if(!mesh)return;if(mesh.geometry!==geometry&&mesh.geometry.attributes.position===undefined)mesh.geometry.dispose();mesh.geometry=geometry;mesh.visible=true;mesh.position.copy(center);mesh.scale.setScalar(size);mesh.quaternion.copy(camera.quaternion);if(ground)mesh.rotation.set(-Math.PI/2,0,time*.1);mesh.material.color.set(index%2?accent:color).multiplyScalar(1.5);mesh.material.opacity=alpha*fade*.93;};
   const ribbon=(index:number,a:T.Vector3,b:T.Vector3,mode:Direction['trace'],progress:number,width:number,offset=0)=>{const m=this.ribbons[index];if(!m)return;m.visible=true;const attr=m.geometry.attributes.position!;for(let j=0;j<49;j++){const u=j/48,along=phase==='travel'?Math.max(0,progress-.35)+u*Math.min(progress,.35):u;const q=this.scratch[1022]!.copy(a).lerp(b,along);const wave=Math.sin(along*Math.PI),angle=along*Math.PI*2*dir.twist+offset;
    if(mode==='lob')q.y+=wave*1.35;
    if(mode==='helix'){q.y+=Math.sin(angle)*.28*wave;q.z+=Math.cos(angle)*.4*wave}
    if(mode==='cut'||mode==='fan'){q.y+=wave*(.32+dir.twist*.12)+Math.sin(along*(5+dir.twist)+offset)*.12;q.z+=wave*(offset-.8+dir.twist*.65)*.5}
    if(mode==='orbit'){q.x=a.x+Math.cos(angle)*(.3+progress*.6);q.z=a.z+Math.sin(angle)*(.3+progress*.6);q.y=a.y+along*.7}
    if(mode==='pillar'){q.y=a.y+along*1.9;q.x+=Math.sin(angle)*.18;q.z+=Math.cos(angle)*.18}
    if(mode==='fall'){q.y=b.y+(1-along)*2.9;q.x+=Math.sin(angle)*.12}
    const w=width*Math.sin(u*Math.PI)*(.7+Math.sin(u*13-time*3)*.1);attr.setXYZ(j*2,q.x,q.y-w,q.z);attr.setXYZ(j*2+1,q.x,q.y+w,q.z);
   }attr.needsUpdate=true;m.material.uniforms.color!.value.set(color);m.material.uniforms.accent!.value.set(accent);m.material.uniforms.phase!.value=time;m.material.uniforms.fade!.value=fade*(calm?.5:.85);};
   this.motes.material.uniforms.motif!.value=['dust','petal','spark','ink','star','ember'].indexOf(dir.particles);
   if(phase==='anticipation'){
    emblem(0,this.copy(start).setY(.06),.5+t*.45,true,.6);emblem(1,this.copy(start).add(this.v(-.25,.25,-.2)),.18+t*.32,false,.75);
    for(let i=0;i<Math.min(16,dir.count);i++){const a=i*2.399+time*.7,r=(1-t)*1.1+.2;particle(this.copy(start).add(this.v(Math.cos(a)*r,Math.sin(a)*r*.55,Math.sin(a)*r*.3)),.09,color,.5)}
   }else if(phase==='travel'){
    const q=this.copy(start).lerp(end,t*t*(3-2*t));if(dir.trace==='lob')q.y+=Math.sin(t*Math.PI)*1.35;
    emblem(0,q,dir.trace==='needle'?.25:.35,false,.9);ribbon(0,start,end,dir.trace,t,.12);if(frame.plan.ultimate||dir.trace==='helix')ribbon(1,start,end,dir.trace,t,.06,Math.PI);
    if(gearAccent(actor))ribbon(2,start,end,'helix',t,.035,2.1);
    if(dir.element==='fire')flame(q,.6,color,accent,.8);
    for(let i=0;i<12;i++){const u=Math.max(0,t-i*.018),p=this.copy(start).lerp(end,u);p.y+=dir.trace==='lob'?Math.sin(u*Math.PI)*1.35:Math.sin(u*14)*.08;particle(p,.12*(1-i/15),i%3?color:accent,.75*(1-i/15),u*4)}
   }else{
    const quietCue=['steadfast','warmWick','lastSip','lastLight','needleLantern','burn','status_apply','status_expire','death','wave_clear','defeat','thorns','dummyAttack','guardAttack'].includes(frame.plan.skillId);
    const centers=targets.slice(0,3);centers.forEach((p,j)=>{
     emblem(j,this.copy(p).setY(.06),(.65+life*1.0)*dir.spread*(quietCue?1.35:1),true,.7);
     if(!['fire','water','thread'].includes(dir.element))emblem(j+3,this.copy(p).add(this.v(quietCue?.45:0,quietCue?.36:.62,.52)),(.62+life*.35)*dir.spread,false,.7);
     if(['fire','water'].includes(dir.element))for(const side of [-1,1])flame(this.copy(p).add(this.v(side*.3,.4,.1)),.8,color,accent,fade,dir.element==='water');
     if(['thread','slash','pierce'].includes(dir.element))ribbon(j,this.copy(p).add(this.v(-.9,.25,-.2)),this.copy(p).add(this.v(.9,.9,.2)),dir.trace,life,.10,j*.85);
     if(frame.plan.skillId==='hearthwall')ribbon(j,this.copy(p).add(this.v(-.4,.05,0)),this.copy(p), 'pillar',life,.17,j);
     if(frame.plan.skillId==='nineLives')ribbon(j,this.copy(p).setY(.1),this.copy(p).setY(.8),'orbit',life,.09,j);
     const n=Math.round(dir.count/centers.length);for(let i=0;i<n;i++){const a=random(i+j*33,seed)*Math.PI*2,v=.3+random(i+70,seed)*.7,r=v*Math.sin(life*Math.PI*.65)*dir.spread;
      const q=this.copy(p).add(this.v(Math.cos(a)*r,.12+Math.sin(life*Math.PI)*(.3+random(i+18,seed)*.9),Math.sin(a)*r*.65));const size=(dir.particles==='petal'?.22:.12)*(1-life*.55);particle(q,size,i%4?color:accent,fade*(.5+v*.35),a+life*dir.twist);
     }
    });
    // Secondary cues have spatial signatures of their own, not a recoloured heal burst.
    const focus=targets[0]!;
    if(frame.plan.skillId==='lastSip'){
     for(let i=0;i<3;i++)emblem(6+i,this.copy(focus).add(this.v(-1.05+i*.65,.30+life*.7,.55)),.48,false,.95);
     ribbon(3,this.copy(focus).add(this.v(-1.15,.12,.45)),this.copy(focus).add(this.v(1.15,.12,.45)),'lob',life,.07);
    }
    if(frame.plan.skillId==='milkFlask'){
     emblem(6,this.copy(focus).add(this.v(.85,.25,.7)),1.25,false,.9);
     for(let i=0;i<3;i++)ribbon(3+i,this.copy(focus).add(this.v((i-1)*.5,.05,0)),this.copy(focus).add(this.v((i-1)*.5,.4,.4)),'fall',life,.06,i);
    }
    if(frame.plan.skillId==='status_apply'){
     for(let i=0;i<3;i++)emblem(6+i,this.copy(focus).add(this.v(.8,.3+i*.48,.55)),.68-i*.13,false,.9);
     ribbon(4,this.copy(focus).add(this.v(-1.1,.1,.7)),this.copy(focus).add(this.v(1.1,.1,.7)),'needle',1,.06);
    }
    if(frame.plan.skillId==='cleanseTea'){
     for(let i=0;i<4;i++){const a=i*Math.PI/2+life;emblem(6+i,this.copy(focus).add(this.v(Math.cos(a)*1.2,.2+i*.12,Math.sin(a)*.7)),.66,false,.85)}
     ribbon(4,this.copy(focus).setY(.08),this.copy(focus).setY(1.3),'helix',life,.11);
    }
    if(frame.plan.skillId==='shieldBiscuit'){
     for(let i=0;i<3;i++)emblem(6+i,this.copy(focus).add(this.v((i-1)*.85,.25,.8)),.65,false,.95);
     emblem(9,this.copy(focus).setY(.075),1.8,true,.9);
    }
    if(frame.plan.skillId==='ultimateTreat'){
     for(let i=0;i<4;i++){const a=i*Math.PI/2;emblem(6+i,this.copy(focus).add(this.v(Math.cos(a)*1.3,.6+Math.sin(a)*.65,.6)),.45,false,.95)}
     ribbon(4,this.copy(focus).setY(.3),this.copy(focus).setY(.3),'orbit',life,.13);
    }
    // Real branching bolts with independently offset child branches. No white face-covering core.
    if(frame.plan.skillId==='lanternstorm')for(let i=0;i<Math.min(8,targets.length*2+2);i++){const target=targets[i%targets.length]!,m=this.bolts[i]!;m.visible=true;m.material.color.set(i%2?accent:color).multiplyScalar(1.6);m.material.opacity=fade*.8;const a=this.copy(target).add(this.v((i%3-1)*.3,2.6,0)),b=this.copy(target).add(this.v(i%2?.35:0,.18,0)),attr=m.geometry.attributes.position!;for(let k=0;k<25;k++){const u=k/24,q=this.scratch[1023]!.copy(a).lerp(b,u),jitter=Math.sin(u*Math.PI)*.19;q.x+=(random(k+i*45,seed)-.5)*jitter;q.z+=(random(k+82+i*19,seed)-.5)*jitter;const w=i%2?.012:.024;attr.setXYZ(k*2,q.x-w,q.y,q.z);attr.setXYZ(k*2+1,q.x+w,q.y,q.z)}attr.needsUpdate=true;}
    if(frame.plan.events.some(e=>e.critical)&&phase==='impact'){const m=this.ribbons[5]!;ribbon(5,this.copy(end).add(this.v(-1.6,0,0)),this.copy(end).add(this.v(1.6,0,0)),'needle',1,.025);m.material.uniforms.fade!.value=.9}
   }
  }}
  this.motes.count=used;this.motes.instanceMatrix.needsUpdate=true;if(this.motes.instanceColor)this.motes.instanceColor.needsUpdate=true;this.count=used;
 }
 async warm(renderer:T.WebGLRenderer,camera:T.Camera,stage:T.Scene){
  await this.ready;if(this.disposed)return;
  // Compile every shader variant and upload every original glyph behind loading.
  const target=new T.WebGLRenderTarget(2,2);
  for(const m of this.root.children){m.visible=true;m.frustumCulled=false;}this.motes.count=1;
  renderer.setRenderTarget(target);for(const geometry of this.shapes.values()){
   if(this.disposed){renderer.setRenderTarget(null);target.dispose();return;}
   this.emblems[0]!.geometry=geometry;renderer.render(stage,camera);
   if(this.cooperative)await new Promise(resolve=>setTimeout(resolve,0));
  }
  // Prepare the direct output with the battlefield's actual fog/light state,
  // as well as its HDR target. A detached no-fog scene is a different shader.
  renderer.setRenderTarget(null);renderer.render(stage,camera);target.dispose();for(const m of this.root.children)m.visible=false;this.motes.visible=true;this.motes.count=0;
 }
 dispose(){this.disposed=true;this.shapes.forEach(g=>g.dispose());this.root.removeFromParent();for(const m of this.ribbons){m.geometry.dispose();m.material.dispose()}for(const m of this.emblems)m.material.dispose();for(const m of this.flames){m.geometry.dispose();m.material.dispose()}for(const m of this.bolts){m.geometry.dispose();m.material.dispose()}this.motes.geometry.dispose();this.motes.material.dispose()}
}
