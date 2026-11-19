/**
 * Canvas painter for the V9 ultimates: cut-in banner, shared impact beats
 * (E1 core, E2 ring, debris, E3 smoke/embers, E7 rune circle) and the three
 * set pieces. Procedural placeholders draw everything; when CXV's flipbook
 * atlases (/vfx/v9/<id>.webp + .json) load, they are layered on top.
 * All drawing is original vector work; no reference art is used.
 */
import {ULT_TIMING,cutinState,easeOutBack,easeOutCubic,easeInOut} from './timeline';
import type {UltRecipe} from './recipes';
import {FlipbookSet,type FlipbookId} from './flipbooks';

export interface Box {x:number;y:number;width:number;height:number}
export interface Point {x:number;y:number}
export interface UltPaintFrame {
 at:number;dt:number;w:number;h:number;reduced:boolean;recipe:UltRecipe;
 caster:{origin:Point;hand:Point;box:Box};impact:Point;target:Box|undefined;
 team:Box[];enemies:Box[];cutin:HTMLImageElement|undefined;cutinCrop:Box|undefined;
}
interface Particle {x:number;y:number;vx:number;vy:number;g:number;drag:number;life:number;age:number;size:number;grow:number;rot:number;vr:number;color:string;alpha:number;kind:'spark'|'shard'|'smoke'|'ember'|'coal'|'drop'|'petal'|'tea'|'star'|'trail';add:boolean}

const TAU=Math.PI*2;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
/** Small deterministic RNG so a replayed ultimate draws the same shapes. */
function rng(seed:number){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

export class UltimatePainter {
 readonly canvas=document.createElement('canvas');
 private c:CanvasRenderingContext2D;private particles:Particle[]=[];private random=rng(9);
 private spawnClock=new Map<string,number>();private ratio=1;
 readonly flipbooks=new FlipbookSet();
 readonly audit={particles:0,cutin:false,setPiece:'',beats:[] as string[]};
 constructor(host:HTMLElement){
  this.canvas.className='v9-ult-canvas';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'40'});
  this.c=this.canvas.getContext('2d')!;host.appendChild(this.canvas);
  // Radii from eased curves can dip a hair below zero; clamp them for the 2D API.
  const c=this.c as CanvasRenderingContext2D|null;
  if(c?.createRadialGradient&&c.arc&&c.ellipse){
   const radial=c.createRadialGradient.bind(c),arc=c.arc.bind(c),ellipse=c.ellipse.bind(c);
   c.createRadialGradient=(x0,y0,r0,x1,y1,r1)=>radial(x0,y0,Math.max(0,r0),x1,y1,Math.max(1e-3,r1));
   c.arc=(x,y,r,a0,a1,ccw)=>arc(x,y,Math.max(0,r),a0,a1,ccw);
   c.ellipse=(x,y,rx,ry,rot,a0,a1,ccw)=>ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot,a0,a1,ccw);
  }
 }
 reset(seed:number){this.particles.length=0;this.random=rng(seed);this.spawnClock.clear();this.audit.beats.length=0;}
 clear(){if(this.canvas.width>1&&typeof this.c?.setTransform==='function'){this.c.setTransform(1,0,0,1,0,0);this.c.clearRect(0,0,this.canvas.width,this.canvas.height);}this.audit.particles=0;this.audit.cutin=false;this.audit.setPiece='';}
 private size(w:number,h:number){
  const ratio=Math.min(globalThis.devicePixelRatio||1,2);
  if(this.canvas.width!==Math.round(w*ratio)||this.canvas.height!==Math.round(h*ratio)||ratio!==this.ratio){this.ratio=ratio;this.canvas.width=Math.round(w*ratio);this.canvas.height=Math.round(h*ratio);}
  this.c.setTransform(ratio,0,0,ratio,0,0);this.c.clearRect(0,0,w,h);
 }
 /** One-shot beat: spawn the particles that belong to it. */
 beat(name:string,f:UltPaintFrame){
  this.audit.beats.push(name);if(f.reduced&&name!=='impact')return;
  const k=f.h/720,r=this.random,p=f.recipe.palette,P=f.impact;
  if(name==='impact'){
   const count=f.reduced?6:22;
   for(let i=0;i<count;i++){const a=-Math.PI*(.08+.84*r()),s=(380+620*r())*k;this.add({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:2200*k,drag:.6,life:.55+.35*r(),size:(5+9*r())*k,grow:0,rot:r()*TAU,vr:(r()-.5)*18,color:i%3?p.deep:p.accent,alpha:1,kind:'shard',add:false});}
   for(let i=0;i<(f.reduced?8:34);i++){const a=r()*TAU,s=(200+900*r())*k;this.add({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.7-200*k,g:600*k,drag:2.2,life:.35+.4*r(),size:(2+3*r())*k,grow:0,rot:a,vr:0,color:i%2?p.core:p.glow,alpha:1,kind:'spark',add:true});}
   if(f.recipe.setPiece==='chimney-comet')for(let i=0;i<16;i++){const a=-Math.PI*(.15+.7*r()),s=(500+700*r())*k;this.add({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:1900*k,drag:.3,life:.8+.4*r(),size:(6+7*r())*k,grow:0,rot:r()*TAU,vr:(r()-.5)*10,color:'#1c1018',alpha:1,kind:'coal',add:false});}
  }
  if(name==='linger'){
   for(let i=0;i<(f.reduced?3:11);i++){const a=r()*TAU,d=(20+90*r())*k;this.add({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.4,vx:Math.cos(a)*40*k,vy:-(30+50*r())*k,g:0,drag:.4,life:.9+.4*r(),size:(28+30*r())*k,grow:60*k,rot:r()*TAU,vr:(r()-.5)*.6,color:f.recipe.setPiece==='chimney-comet'?'#3a2440':'#5b4636',alpha:.32,kind:'smoke',add:false});}
   for(let i=0;i<(f.reduced?0:26);i++){const a=r()*TAU,d=(10+120*r())*k;this.add({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.35,vx:(r()-.5)*60*k,vy:-(60+140*r())*k,g:-40*k,drag:.5,life:.8+.7*r(),size:(1.6+2.4*r())*k,grow:0,rot:r()*TAU,vr:2+4*r(),color:i%2?p.glow:p.accent,alpha:1,kind:'ember',add:true});}
  }
 }
 private add(p:Omit<Particle,'age'>){if(this.particles.length<420)this.particles.push({...p,age:0});}
 /** Continuous emitters, rate in particles per second inside [from,to). */
 private emit(key:string,f:UltPaintFrame,from:number,to:number,rate:number,make:()=>void){
  if(f.at<from||f.at>=to||f.reduced)return;
  let acc=(this.spawnClock.get(key)??0)+f.dt/1000*rate;
  while(acc>=1){make();acc-=1;}this.spawnClock.set(key,acc);
 }
 paint(f:UltPaintFrame){
  this.size(f.w,f.h);const c=this.c,k=f.h/720,dt=f.dt/1000;
  this.audit.setPiece=f.recipe.setPiece;
  // Set pieces under the shared beats.
  if(f.recipe.setPiece==='lantern-dome')this.lanternDome(f,k);
  if(f.recipe.setPiece==='tea-clover')this.teaClover(f,k);
  if(f.recipe.setPiece==='chimney-comet')this.chimneyComet(f,k);
  this.impactCore(f,k);this.shockRing(f,k);
  const smokeAge=f.at-ULT_TIMING.impact-150;
  if(smokeAge>=0&&smokeAge<800)this.flipbooks.drawAt(c,'smoke-embers',f.impact.x,f.impact.y-60*k,440*k,smokeAge/800);
  // Particles.
  for(const p of this.particles){
   p.age+=dt;p.vx*=Math.exp(-p.drag*dt);p.vy=p.vy*Math.exp(-p.drag*dt)+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.size+=p.grow*dt;
  }
  this.particles=this.particles.filter(p=>p.age<p.life);this.audit.particles=this.particles.length;
  for(const p of this.particles)this.particle(p);
  this.banner(f,k);
 }
 private particle(p:Particle){
  const c=this.c,u=p.age/p.life,a=p.alpha*(p.kind==='smoke'?Math.sin(Math.PI*clamp(u))*1:1-u*u);
  c.save();c.globalCompositeOperation=p.add?'lighter':'source-over';c.globalAlpha=clamp(a);c.translate(p.x,p.y);c.rotate(p.rot);
  if(p.kind==='shard'){c.fillStyle=p.color;c.beginPath();c.moveTo(-p.size,-p.size*.4);c.lineTo(p.size*.9,-p.size*.2);c.lineTo(p.size*.3,p.size*.6);c.closePath();c.fill();}
  else if(p.kind==='smoke'){const g=c.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,p.color);g.addColorStop(1,p.color+'00');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();}
  else if(p.kind==='coal'){const g=c.createRadialGradient(0,0,0,0,0,p.size*2.2);g.addColorStop(0,'#ffb05088');g.addColorStop(1,'#ff6a0000');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size*2.2,0,TAU);c.fill();c.fillStyle=p.color;c.beginPath();c.moveTo(-p.size,0);c.lineTo(-p.size*.3,-p.size*.8);c.lineTo(p.size*.8,-p.size*.4);c.lineTo(p.size*.6,p.size*.7);c.closePath();c.fill();c.fillStyle='#ff8a3c';c.fillRect(-p.size*.3,-p.size*.2,p.size*.5,p.size*.3);}
  else if(p.kind==='drop'){c.fillStyle=p.color;c.beginPath();c.ellipse(0,0,p.size*.35,p.size,0,0,TAU);c.fill();}
  else if(p.kind==='petal'){c.fillStyle=p.color;c.beginPath();c.ellipse(0,0,p.size,p.size*.45,0,0,TAU);c.fill();}
  else if(p.kind==='trail'){const g=c.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,p.color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();}
  else{const s=p.size*(p.kind==='star'?2.2:1);c.fillStyle=p.color;c.beginPath();if(p.kind==='spark'){c.ellipse(0,0,s*2.6,s*.55,0,0,TAU);}else c.arc(0,0,s,0,TAU);c.fill();}
  c.restore();
 }
 /** E1: white-hot core flash with rotating spikes. */
 private impactCore(f:UltPaintFrame,k:number){
  const age=f.at-ULT_TIMING.impact;if(age<0||age>300)return;
  const c=this.c,u=age/300,P=f.impact,p=f.recipe.palette;
  if(this.flipbooks.drawAt(c,'impact-core',P.x,P.y,400*k,age/400))return;
  const r=(60+190*easeOutCubic(u))*k*(f.recipe.setPiece==='lantern-dome'?1.15:1);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-u;
  const g=c.createRadialGradient(P.x,P.y,0,P.x,P.y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.25,p.core);g.addColorStop(.6,p.glow+'99');g.addColorStop(1,p.glow+'00');
  c.fillStyle=g;c.beginPath();c.arc(P.x,P.y,r,0,TAU);c.fill();
  if(!f.reduced){c.fillStyle=p.core;c.translate(P.x,P.y);c.rotate(u*.6);for(let i=0;i<10;i++){const len=r*(i%2?1.5:2.3)*(1-u*.4);c.rotate(TAU/10);c.beginPath();c.moveTo(0,-r*.06);c.lineTo(len,0);c.lineTo(0,r*.06);c.fill();}}
  c.restore();
 }
 /** E2: ground shockwave rings. */
 private shockRing(f:UltPaintFrame,k:number){
  const p=f.recipe.palette,P=f.impact,c=this.c,ringAge=f.at-ULT_TIMING.impact;
  if(ringAge>=0&&ringAge<560&&this.flipbooks.drawAt(c,'shockwave-ring',P.x,P.y,(f.recipe.setPiece==='lantern-dome'?1100:800)*k,ringAge/560,{sy:.34}))return;
  for(const delay of f.reduced?[0]:[0,90]){
   const age=f.at-ULT_TIMING.impact-delay;if(age<0||age>560)continue;
   const u=age/560,rx=(30+(f.recipe.setPiece==='lantern-dome'?520:380)*easeOutCubic(u))*k,ry=rx*.3;
   c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-u)*(delay?.6:1);c.strokeStyle=p.glow;c.lineWidth=(16*(1-u)+2)*k;
   c.beginPath();c.ellipse(P.x,P.y+(f.recipe.setPiece==='tea-clover'?0:6*k),rx,ry,0,0,TAU);c.stroke();
   c.globalAlpha*=.6;c.strokeStyle=p.core;c.lineWidth=(5*(1-u)+1)*k;c.stroke();c.restore();
  }
 }
 /** Mochi: lantern flare, then a golden dome over the team. */
 private lanternDome(f:UltPaintFrame,k:number){
  const c=this.c,p=f.recipe.palette,at=f.at,H=f.caster.hand;
  if(at>=ULT_TIMING.squash&&at<ULT_TIMING.impact+250){
   const charge=clamp((at-ULT_TIMING.squash)/(ULT_TIMING.impact-ULT_TIMING.squash)),burst=at>ULT_TIMING.impact?1-(at-ULT_TIMING.impact)/250:0;
   const r=(26+70*charge*charge+120*burst)*k;
   c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.55+.45*Math.max(charge,burst);
   const g=c.createRadialGradient(H.x,H.y,0,H.x,H.y,r);g.addColorStop(0,'#fffef0');g.addColorStop(.3,p.glow+'cc');g.addColorStop(1,p.glow+'00');c.fillStyle=g;c.beginPath();c.arc(H.x,H.y,r,0,TAU);c.fill();
   c.strokeStyle=p.core;c.lineWidth=2*k;c.translate(H.x,H.y);for(let i=0;i<4;i++){c.rotate(Math.PI/4+at*.002);c.beginPath();c.moveTo(-r*1.6,0);c.lineTo(r*1.6,0);c.stroke();}
   c.restore();
   this.emit('flare',f,ULT_TIMING.squash,ULT_TIMING.impact,40,()=>{const a=this.random()*TAU,d=(60+40*this.random())*k;this.add({x:H.x+Math.cos(a)*d,y:H.y+Math.sin(a)*d,vx:-Math.cos(a)*d*2.4,vy:-Math.sin(a)*d*2.4,g:0,drag:1,life:.38,size:2.2*k,grow:0,rot:a,vr:0,color:p.core,alpha:1,kind:'spark',add:true});});
  }
  const age=at-ULT_TIMING.impact;if(age<0||age>1050||!f.team.length)return;
  const left=Math.min(...f.team.map(b=>b.x))-30*k,right=Math.max(...f.team.map(b=>b.x+b.width))+30*k,ground=Math.max(...f.team.map(b=>b.y+b.height))+6*k,top=Math.min(...f.team.map(b=>b.y))-30*k;
  // Keep the crown on screen and the dome low enough to read as a ward, not a wall.
  const cx=(left+right)/2,rx=(right-left)/2*.92,ry=Math.max(40*k,Math.min((ground-top)*.82,ground-f.h*.08));
  const grow=f.reduced?1:easeOutBack(clamp(age/260),1.4),fade=age>780?1-(age-780)/270:1,s=clamp(grow,0,1.2);
  this.audit.setPiece='lantern-dome';
  if(this.flipbooks.drawAt(c,'lantern-dome',cx,ground-ry*.45,Math.max(rx*2,ry*2)*1.15,age/1050,{alpha:clamp(fade)}))return;
  c.save();c.globalAlpha=clamp(fade);c.translate(cx,ground);c.scale(s,s);
  c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(0,-ry*.15,ry*.2,0,-ry*.15,Math.max(rx,ry));g.addColorStop(0,p.glow+'10');g.addColorStop(.75,p.glow+'2c');g.addColorStop(1,p.core+'88');
  c.fillStyle=g;c.beginPath();c.ellipse(0,0,rx,ry,0,Math.PI,TAU);c.closePath();c.fill();
  c.strokeStyle=p.core;c.lineWidth=4*k;c.shadowColor=p.glow;c.shadowBlur=18*k;c.beginPath();c.ellipse(0,0,rx,ry,0,Math.PI,TAU);c.stroke();c.shadowBlur=0;
  // Lattice arcs on the dome.
  c.globalAlpha=clamp(fade)*.22;c.lineWidth=1.4*k;c.strokeStyle=p.glow;
  for(let i=1;i<5;i++){c.beginPath();c.ellipse(0,0,rx*i/5,ry,0,Math.PI,TAU);c.stroke();}
  for(let i=1;i<4;i++){c.beginPath();c.ellipse(0,0,rx,ry*i/4,0,Math.PI,TAU);c.stroke();}
  // Base ring on the floor.
  c.globalAlpha=clamp(fade)*.8;c.lineWidth=3*k;c.strokeStyle=p.core;c.beginPath();c.ellipse(0,0,rx,rx*.16,0,0,TAU);c.stroke();
  c.restore();
  this.emit('dome',f,ULT_TIMING.impact,ULT_TIMING.impact+800,30,()=>{const a=Math.PI+this.random()*Math.PI;this.add({x:cx+Math.cos(a)*rx,y:ground+Math.sin(a)*ry,vx:0,vy:-30*k,g:0,drag:0,life:.6,size:2.6*k,grow:0,rot:0,vr:0,color:p.core,alpha:1,kind:'star',add:true});});
 }
 /** Clover: tea spiral rises, blooms into a four-leaf clover, then healing rain. */
 private teaClover(f:UltPaintFrame,k:number){
  const c=this.c,p=f.recipe.palette,at=f.at,H=f.caster.hand,C=f.impact;
  this.emit('tea',f,ULT_TIMING.squash,ULT_TIMING.impact+60,70,()=>{
   const u=this.random(),spin=this.random()*TAU;
   // Particles carry their own spiral path towards C.
   const sx=H.x,sy=H.y,dur=.5;
   this.add({x:sx,y:sy,vx:(C.x-sx)/dur+Math.cos(spin)*90*k,vy:(C.y-sy)/dur+Math.sin(spin)*50*k,g:0,drag:.2,life:dur*(.8+.4*u),size:(3+4*u)*k,grow:2*k,rot:spin,vr:9,color:u>.5?'#d9b46a':p.glow,alpha:.9,kind:'tea',add:true});
  });
  const age=at-(ULT_TIMING.impact-120);
  if(age>=0&&age<1000){
   const grow=f.reduced?1:easeOutBack(clamp(age/320),1.6),fade=age>760?1-(age-760)/240:1,R=120*k*grow;
   this.audit.setPiece='tea-clover';
   if(!this.flipbooks.drawAt(c,'tea-clover',C.x,C.y+40*k,420*k,age/1000,{alpha:clamp(fade)})){
   c.save();c.translate(C.x,C.y);c.rotate(age*.0009+(1-clamp(age/320))*-.8);c.globalAlpha=clamp(fade);
   c.globalCompositeOperation='lighter';const glow=c.createRadialGradient(0,0,0,0,0,R*1.7);glow.addColorStop(0,p.accent+'aa');glow.addColorStop(1,p.glow+'00');c.fillStyle=glow;c.beginPath();c.arc(0,0,R*1.7,0,TAU);c.fill();
   c.globalCompositeOperation='source-over';
   for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);this.heartLeaf(R,p.glow,p.deep);c.restore();}
   c.fillStyle=p.accent;c.beginPath();c.arc(0,0,R*.12,0,TAU);c.fill();
   c.restore();
   }
  }
  // Healing rain over every ally.
  this.emit('rain',f,ULT_TIMING.impact+40,ULT_TIMING.impact+850,90,()=>{
   const b=f.team[Math.floor(this.random()*f.team.length)];if(!b)return;
   const x=b.x+b.width*(.1+.8*this.random()),petal=this.random()<.35;
   this.add({x,y:Math.min(C.y,b.y)-20*k*this.random(),vx:(this.random()-.5)*30*k,vy:(260+160*this.random())*k,g:300*k,drag:0,life:Math.max(.25,(b.y+b.height*.7-C.y)/(420*k)),size:(petal?7:6)*k,grow:0,rot:petal?this.random()*TAU:0,vr:petal?4:0,color:petal?'#f7f2c8':p.glow,alpha:.95,kind:petal?'petal':'drop',add:!petal});
  });
  if(at>ULT_TIMING.impact&&at<ULT_TIMING.impact+900)for(const b of f.team){
   const u=clamp((at-ULT_TIMING.impact-150)/650);if(u<=0)continue;
   c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.sin(u*Math.PI)*.55;const cx=b.x+b.width/2,cy=b.y+b.height*.55;
   const g=c.createRadialGradient(cx,cy,0,cx,cy,b.width*.6);g.addColorStop(0,p.glow+'aa');g.addColorStop(1,p.glow+'00');c.fillStyle=g;c.beginPath();c.arc(cx,cy,b.width*.6,0,TAU);c.fill();c.restore();
  }
 }
 private heartLeaf(R:number,fill:string,deep:string){
  const c=this.c;c.beginPath();c.moveTo(0,0);
  c.bezierCurveTo(-R*.15,-R*.35,-R*.75,-R*.55,-R*.55,-R*.95);c.bezierCurveTo(-R*.4,-R*1.2,-R*.08,-R*1.1,0,-R*.82);
  c.bezierCurveTo(R*.08,-R*1.1,R*.4,-R*1.2,R*.55,-R*.95);c.bezierCurveTo(R*.75,-R*.55,R*.15,-R*.35,0,0);c.closePath();
  const g=c.createLinearGradient(0,0,0,-R);g.addColorStop(0,deep);g.addColorStop(.35,fill);g.addColorStop(1,'#e9ffd6');c.fillStyle=g;c.fill();
  c.strokeStyle='#f8ffe8';c.lineWidth=R*.04;c.stroke();c.strokeStyle=deep+'aa';c.lineWidth=R*.025;c.beginPath();c.moveTo(0,-R*.05);c.lineTo(0,-R*.8);c.stroke();
 }
 /** Soot: comet dives onto the target, fire dome and flying coal. */
 private chimneyComet(f:UltPaintFrame,k:number){
  const c=this.c,p=f.recipe.palette,at=f.at,T=ULT_TIMING,P=f.impact;
  // Launched up the chimney above Soot, it arcs over the whole field onto the target.
  const start={x:f.caster.box.x+f.caster.box.width*.5,y:-80*k},ctrl={x:(start.x+P.x)/2,y:-f.h*.28};
  const pos=(u:number)=>({x:(1-u)**2*start.x+2*(1-u)*u*ctrl.x+u*u*P.x,y:(1-u)**2*start.y+2*(1-u)*u*ctrl.y+u*u*P.y});
  if(at>=T.squash&&at<T.impact){
   const u=easeInOut((at-T.squash)/(T.impact-T.squash))**1.4,h=pos(u),r=(24+20*u)*k;this.audit.setPiece='chimney-comet';
   // Tail.
   c.save();c.globalCompositeOperation='lighter';
   for(let i=12;i>=0;i--){const q=pos(Math.max(0,u-i*.025)),t=i/12;const g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,r*(1.6-t));g.addColorStop(0,(t<.4?p.glow:p.accent)+'cc');g.addColorStop(1,p.accent+'00');c.globalAlpha=(1-t)*.8;c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,r*(1.6-t),0,TAU);c.fill();}
   c.globalAlpha=1;
   const q=pos(Math.max(0,u-.02));if(this.flipbooks.drawAt(c,'comet-loop',h.x,h.y,230*k,at/1000,{rotate:Math.atan2(h.y-q.y,h.x-q.x)})){c.restore();}else{
   const head=c.createRadialGradient(h.x,h.y,0,h.x,h.y,r*1.4);head.addColorStop(0,'#ffffff');head.addColorStop(.35,p.core);head.addColorStop(1,p.glow+'00');c.fillStyle=head;c.beginPath();c.arc(h.x,h.y,r*1.4,0,TAU);c.fill();
   c.restore();}
   this.emit('tail',f,T.squash,T.impact,90,()=>{this.add({x:h.x,y:h.y,vx:(this.random()-.5)*120*k,vy:(this.random()-.5)*120*k,g:200*k,drag:1.4,life:.35+.25*this.random(),size:(6+8*this.random())*k,grow:-4*k,rot:0,vr:0,color:this.random()<.5?p.glow:p.accent,alpha:.9,kind:'trail',add:true});});
   // Chimney soot puffs at the caster when it launches.
   if(at<T.squash+160){const s=(at-T.squash)/160;c.save();c.globalAlpha=(1-s)*.5;c.fillStyle='#2a1b30';c.beginPath();c.arc(f.caster.hand.x,f.caster.hand.y-30*k*s,(18+30*s)*k,0,TAU);c.fill();c.restore();}
  }
  const age=at-T.impact;if(age<0||age>760)return;
  const grow=f.reduced?1:easeOutBack(clamp(age/200),1.2),fade=age>480?1-(age-480)/280:1,R=190*k*grow;
  this.audit.setPiece='chimney-comet';
  const dome=this.flipbooks.drawAt(c,'fire-dome',P.x,P.y-R*.3,460*k,age/760,{alpha:clamp(fade)});
  if(!dome){
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=clamp(fade);
  const g=c.createRadialGradient(P.x,P.y,R*.05,P.x,P.y-R*.2,R);g.addColorStop(0,'#fff6e4');g.addColorStop(.25,p.glow);g.addColorStop(.7,p.accent+'aa');g.addColorStop(1,p.accent+'00');
  c.fillStyle=g;c.beginPath();c.ellipse(P.x,P.y,R*1.05,R,0,Math.PI,TAU);c.closePath();c.fill();
  // Flicker tongues.
  c.fillStyle=p.glow+'cc';for(let i=0;i<9;i++){const a=Math.PI+(i+.5)*Math.PI/9,fl=.75+.25*Math.sin(age*.03+i*1.7);c.beginPath();c.moveTo(P.x+Math.cos(a)*R*.55,P.y+Math.sin(a)*R*.55);c.quadraticCurveTo(P.x+Math.cos(a)*R*1.0,P.y+Math.sin(a)*R*1.0-12*k,P.x+Math.cos(a)*R*1.12*fl,P.y+Math.sin(a)*R*1.18*fl);c.quadraticCurveTo(P.x+Math.cos(a+.12)*R*.9,P.y+Math.sin(a+.12)*R*.9,P.x+Math.cos(a+.18)*R*.55,P.y+Math.sin(a+.18)*R*.55);c.fill();}
  c.restore();
  }
  // Every other enemy takes a smaller burst a beat later.
  for(const [i,b] of f.enemies.entries()){
   const a2=age-60-i*45;if(a2<0||a2>320)continue;const u=a2/320,cx=b.x+b.width/2,cy=b.y+b.height*.55,r=(30+90*easeOutCubic(u))*k;
   c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-u;const g2=c.createRadialGradient(cx,cy,0,cx,cy,r);g2.addColorStop(0,p.core);g2.addColorStop(.4,p.glow+'aa');g2.addColorStop(1,p.accent+'00');c.fillStyle=g2;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();c.restore();
  }
 }
 /** Cut-in: slanted band, portrait crop over the E7 rune circle, speed lines, outlined gradient name. */
 private banner(f:UltPaintFrame,k:number){
  const s=cutinState(f.at,f.reduced);if(!s.visible)return;this.audit.cutin=true;
  const c=this.c,p=f.recipe.palette,w=f.w,h=f.h,top=h*.26,bh=h*.34,skew=bh*.28,offset=(1-s.slide)*-w*1.1+(f.at>ULT_TIMING.cutinOut&&!f.reduced?(f.at-ULT_TIMING.cutinOut)/(ULT_TIMING.cutinEnd-ULT_TIMING.cutinOut)*w*.25:0);
  c.save();c.globalAlpha=s.alpha;c.translate(offset,0);
  // Band.
  c.beginPath();c.moveTo(-20,top+skew);c.lineTo(w+20,top);c.lineTo(w+20,top+bh-skew);c.lineTo(-20,top+bh);c.closePath();
  const band=c.createLinearGradient(0,0,w,0);band.addColorStop(0,p.deep+'f2');band.addColorStop(.45,p.deep+'e6');band.addColorStop(.75,p.glow+'cc');band.addColorStop(1,p.deep+'f2');c.fillStyle=band;c.fill();
  c.save();c.clip();
  // Speed lines.
  c.globalCompositeOperation='lighter';const r=rng(31);
  for(let i=0;i<26;i++){const y=top+bh*r(),len=w*(.15+.35*r()),x=((r()*w*1.4+(f.reduced?0:f.at*(2.4+r())*k))%(w*1.4))-w*.2;c.globalAlpha=s.alpha*(.15+.35*r());c.fillStyle=i%3?p.core:p.glow;c.fillRect(w-x,y,len,(1+2.5*r())*k);}
  c.globalCompositeOperation='source-over';c.globalAlpha=s.alpha;
  // E7 rune circle behind the portrait.
  const pcx=w*.27,pcy=top+bh*.5,pr=bh*.62;this.runeCircle(pcx,pcy,pr,f.at,p.glow,p.core,f.reduced);
  // Portrait (head and shoulders).
  if(f.cutin&&f.cutinCrop&&f.cutin.complete&&f.cutin.naturalWidth){
   const cr=f.cutinCrop,dh=bh*1.35,dw=dh*cr.width/cr.height,dx=pcx-dw/2,dy=top+bh-dh+bh*.08;
   c.shadowColor=p.glow;c.shadowBlur=26*k;c.drawImage(f.cutin,cr.x,cr.y,cr.width,cr.height,dx,dy,dw,dh);c.shadowBlur=0;
  }
  c.restore();
  // Edge strokes.
  c.strokeStyle=p.core;c.lineWidth=3*k;c.beginPath();c.moveTo(-20,top+skew);c.lineTo(w+20,top);c.stroke();c.beginPath();c.moveTo(-20,top+bh);c.lineTo(w+20,top+bh-skew);c.stroke();
  // Name.
  const size=Math.round(58*k),x=w*.47,y=top+bh*.58;
  c.font=`800 ${size}px "Baloo 2", "Trebuchet MS", sans-serif`;c.textBaseline='middle';c.lineJoin='round';
  const tg=c.createLinearGradient(0,y-size*.5,0,y+size*.5);tg.addColorStop(0,p.text[0]);tg.addColorStop(.5,p.text[1]);tg.addColorStop(1,p.text[2]);
  c.lineWidth=size*.2;c.strokeStyle='#1a0f12';c.strokeText(f.recipe.name,x,y);
  c.lineWidth=size*.07;c.strokeStyle='#fff8e6';c.strokeText(f.recipe.name,x,y);
  c.fillStyle=tg;c.fillText(f.recipe.name,x,y);
  c.font=`700 ${Math.round(18*k)}px "Baloo 2", "Trebuchet MS", sans-serif`;c.fillStyle=p.core;c.globalAlpha=s.alpha*.9;c.fillText('ULTIMATE',x+4*k,y-size*.72);
  c.restore();
 }
 private runeCircle(x:number,y:number,r:number,at:number,glow:string,core:string,reduced:boolean){
  const c=this.c,spin=reduced?0:at*.0016;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.strokeStyle=glow;c.lineWidth=2;
  c.globalAlpha*=.8;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.beginPath();c.arc(0,0,r*.82,0,TAU);c.stroke();
  c.rotate(spin);for(let i=0;i<6;i++){c.rotate(TAU/6);c.beginPath();c.moveTo(r*.82,0);c.lineTo(r*.82*Math.cos(TAU/3),r*.82*Math.sin(TAU/3));c.stroke();}
  c.rotate(-spin*2);c.fillStyle=core;for(let i=0;i<16;i++){c.rotate(TAU/16);c.fillRect(r*.88,-1.5,r*.07,3);}
  c.restore();
 }
 dispose(){this.flipbooks.dispose();this.canvas.remove();this.particles.length=0;}
}
export type {FlipbookId};
