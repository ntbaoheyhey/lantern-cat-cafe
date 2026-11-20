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
import {UltimateGlLayer,fxPalette,type FxFrame} from './fx-gl';

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
 readonly gl:UltimateGlLayer;
 readonly audit={particles:0,cutin:false,setPiece:'',beats:[] as string[]};
 constructor(host:HTMLElement){
  this.canvas.className='v9-ult-canvas';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'40'});
  this.c=this.canvas.getContext('2d')!;this.gl=new UltimateGlLayer(host);host.appendChild(this.canvas);
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
 clear(){this.gl.clear();if(this.canvas.width>1&&typeof this.c?.setTransform==='function'){this.c.setTransform(1,0,0,1,0,0);this.c.clearRect(0,0,this.canvas.width,this.canvas.height);}this.audit.particles=0;this.audit.cutin=false;this.audit.setPiece='';}
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
   const count=f.recipe.setPiece==='tea-clover'?0:f.reduced?6:26;
   for(let i=0;i<count;i++){const a=-Math.PI*(.08+.84*r()),s=(380+620*r())*k;this.add({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:1600*k,drag:.6,life:.6+.5*r(),size:(1.8+2.4*r())*k,grow:0,rot:r()*TAU,vr:0,color:i%3?p.glow:p.accent,alpha:1,kind:'shard',add:true});}
   for(let i=0;i<(f.reduced?8:34);i++){const a=r()*TAU,s=(200+900*r())*k;this.add({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.7-200*k,g:600*k,drag:2.2,life:.35+.4*r(),size:(2+3*r())*k,grow:0,rot:a,vr:0,color:i%2?p.core:p.glow,alpha:1,kind:'spark',add:true});}
   if(f.recipe.setPiece==='chimney-comet')for(let i=0;i<10;i++){const a=-Math.PI*(.15+.7*r()),s=(500+700*r())*k;this.add({x:P.x,y:P.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:1900*k,drag:.3,life:.8+.4*r(),size:(3+3.5*r())*k,grow:0,rot:r()*TAU,vr:(r()-.5)*10,color:'#3a2026',alpha:1,kind:'coal',add:false});}
  }
  if(name==='linger'){
   for(let i=0;i<(f.reduced?3:11);i++){const a=r()*TAU,d=(20+90*r())*k;this.add({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.4,vx:Math.cos(a)*40*k,vy:-(30+50*r())*k,g:0,drag:.4,life:.9+.4*r(),size:(28+30*r())*k,grow:60*k,rot:r()*TAU,vr:(r()-.5)*.6,color:f.recipe.setPiece==='chimney-comet'?'#5a4a66':'#6b5a48',alpha:.2,kind:'smoke',add:false});}
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
  this.size(f.w,f.h);const k=f.h/720,dt=f.dt/1000;
  this.audit.setPiece=f.recipe.setPiece;
  const fx:FxFrame={w:f.w,h:f.h,time:f.at/1000,flash:0,bursts:[],rings:[],pools:[],columns:[],palette:fxPalette(f.recipe.palette)};
  if(f.recipe.setPiece==='lantern-dome')this.lanternDome(f,k,fx);
  if(f.recipe.setPiece==='tea-clover')this.teaClover(f,k,fx);
  if(f.recipe.setPiece==='chimney-comet')this.chimneyComet(f,k,fx);
  this.sharedImpact(f,k,fx);
  const live=fx.flash>0||fx.bursts.length||fx.rings.length||fx.pools.length||fx.columns.length||fx.comet||fx.dome||fx.swirl;
  if(live)this.gl.draw(fx);else this.gl.clear();
  // Particles.
  for(const p of this.particles){
   p.age+=dt;p.vx*=Math.exp(-p.drag*dt);p.vy=p.vy*Math.exp(-p.drag*dt)+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.size+=p.grow*dt;
  }
  this.particles=this.particles.filter(p=>p.age<p.life);this.audit.particles=this.particles.length;
  for(const p of this.particles)this.particle(p);
  this.banner(f,k);
 }
 private particle(p:Particle){
  const c=this.c,u=p.age/p.life,a=p.alpha*(p.kind==='smoke'?Math.sin(Math.PI*clamp(u)):1-u*u);
  c.save();c.globalCompositeOperation=p.add?'lighter':'source-over';c.globalAlpha=clamp(a);c.translate(p.x,p.y);c.rotate(p.rot);
  if(p.kind==='shard'||p.kind==='ember'||p.kind==='star'){
   // Glowing mote: hot centre plus a soft halo, never a hard polygon.
   const s=p.size*(p.kind==='star'?1.6:1),g=c.createRadialGradient(0,0,0,0,0,s*3);
   g.addColorStop(0,'#fffaf0');g.addColorStop(.18,p.color);g.addColorStop(1,p.color+'00');c.fillStyle=g;c.beginPath();c.arc(0,0,s*3,0,TAU);c.fill();
  }
  else if(p.kind==='smoke'){const g=c.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,p.color);g.addColorStop(1,p.color+'00');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();}
  else if(p.kind==='coal'){
   // A chunk of chimney coal: dark body, molten edge, small heat halo.
   const g=c.createRadialGradient(0,0,0,0,0,p.size*2.4);g.addColorStop(0,'#ffb05066');g.addColorStop(1,'#ff6a0000');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size*2.4,0,TAU);c.fill();
   c.fillStyle=p.color;c.beginPath();c.moveTo(-p.size,-p.size*.1);c.quadraticCurveTo(-p.size*.6,-p.size*.9,p.size*.3,-p.size*.7);c.quadraticCurveTo(p.size*1.1,-p.size*.2,p.size*.6,p.size*.6);c.quadraticCurveTo(-p.size*.2,p.size*.9,-p.size,-p.size*.1);c.fill();
   c.globalCompositeOperation='lighter';c.strokeStyle='#ff9a4acc';c.lineWidth=p.size*.22;c.stroke();
  }
  else if(p.kind==='drop'){const g=c.createRadialGradient(0,0,0,0,0,p.size*1.6);g.addColorStop(0,'#fbfff0');g.addColorStop(.3,p.color);g.addColorStop(1,p.color+'00');c.fillStyle=g;c.scale(.45,1);c.beginPath();c.arc(0,0,p.size*1.6,0,TAU);c.fill();}
  else if(p.kind==='petal'){
   // Four-leaf clover petal: two lobes and a vein, lit from above.
   const s=p.size;const g=c.createLinearGradient(0,-s,0,s);g.addColorStop(0,'#f4ffe2');g.addColorStop(1,p.color);c.fillStyle=g;
   c.beginPath();c.moveTo(0,s*.7);c.bezierCurveTo(-s*1.1,s*.1,-s*.9,-s*.9,0,-s*.35);c.bezierCurveTo(s*.9,-s*.9,s*1.1,s*.1,0,s*.7);c.fill();
  }
  else if(p.kind==='trail'){const g=c.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,p.color);g.addColorStop(1,'#00000000');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();}
  else if(p.kind==='spark'){
   // Streak aligned with its velocity, hot white head.
   const sp=Math.hypot(p.vx,p.vy),len=Math.min(p.size*9,p.size*1.5+sp*.035);c.rotate(Math.atan2(p.vy,p.vx)-p.rot);
   const g=c.createLinearGradient(-len,0,p.size,0);g.addColorStop(0,p.color+'00');g.addColorStop(.7,p.color);g.addColorStop(1,'#ffffff');
   c.fillStyle=g;c.beginPath();c.ellipse(-len*.4,0,len*.7,p.size*.45,0,0,TAU);c.fill();
  }
  else{const s=p.size;c.fillStyle=p.color;c.beginPath();c.arc(0,0,s,0,TAU);c.fill();}
  c.restore();
 }
 /** Shared impact light: a short warm flash, a floor heat ring and light spill. */
 private sharedImpact(f:UltPaintFrame,k:number,fx:FxFrame){
  const age=f.at-ULT_TIMING.impact;if(age<0||age>900)return;
  const heal=f.recipe.setPiece==='tea-clover',big=f.recipe.setPiece==='lantern-dome';
  if(!f.reduced&&age<140)fx.flash=(heal?.1:.2)*(1-age/140)**2;
  if(!heal)fx.rings.push({x:f.impact.x,y:this.floorY(f),r:(big?520:400)*k,life:clamp(age/760),power:f.reduced?.5:1});
  if(!heal&&age>110&&!f.reduced)fx.rings.push({x:f.impact.x,y:this.floorY(f),r:(big?380:300)*k,life:clamp((age-110)/700),power:.6});
  fx.pools.push({x:f.impact.x,y:this.floorY(f),r:(heal?200:300)*k,power:1.1*Math.max(0,1-age/900)**1.5});
 }
 private floorY(f:UltPaintFrame){
  if(f.recipe.setPiece==='chimney-comet'&&f.target)return f.target.y+f.target.height*.95;
  if(f.recipe.setPiece==='tea-clover')return Math.max(...(f.team.length?f.team:[f.caster.box]).map(b=>b.y+b.height))-6*f.h/720;
  return f.impact.y;
 }
 /** Glow gathering at the caster's hand before the cast. */
 private charge(f:UltPaintFrame,k:number,fx:FxFrame,color:string){
  const at=f.at,H=f.caster.hand,T=ULT_TIMING;
  if(at<T.cutinOut||at>=T.impact)return;
  const u=clamp((at-T.cutinOut)/(T.impact-T.cutinOut));
  fx.pools.push({x:H.x,y:H.y,r:(60+90*u)*k,power:.5+.9*u});
  this.emit('charge',f,T.cutinOut,T.impact-80,60,()=>{const a=this.random()*TAU,d=(70+60*this.random())*k;this.add({x:H.x+Math.cos(a)*d,y:H.y+Math.sin(a)*d,vx:-Math.cos(a)*d*2.6,vy:-Math.sin(a)*d*2.6,g:0,drag:.8,life:.36,size:2*k,grow:0,rot:a,vr:0,color,alpha:1,kind:'spark',add:true});});
 }
 /** Mochi: the lantern flares, the shield slams, a paper-lantern ward rises over the team. */
 private lanternDome(f:UltPaintFrame,k:number,fx:FxFrame){
  const p=f.recipe.palette,at=f.at;
  this.charge(f,k,fx,p.glow);
  const age=at-ULT_TIMING.impact;if(age<0||age>1050||!f.team.length)return;
  const left=Math.min(...f.team.map(b=>b.x))-30*k,right=Math.max(...f.team.map(b=>b.x+b.width))+30*k,ground=Math.max(...f.team.map(b=>b.y+b.height))+6*k,top=Math.min(...f.team.map(b=>b.y))-30*k;
  const cx=(left+right)/2,rx=(right-left)/2*.95,ry=Math.max(40*k,Math.min((ground-top)*.86,ground-f.h*.06));
  const grow=f.reduced?1:easeOutBack(clamp(age/300),1.3),fade=age>760?1-(age-760)/290:Math.min(1,age/90);
  fx.dome={x:cx,y:ground,rx,ry,grow:Math.max(.05,grow),alpha:clamp(fade)};
  for(const b of f.team)fx.pools.push({x:b.x+b.width/2,y:b.y+b.height,r:b.width*.8,power:.7*clamp(fade)});
  // Burst of warm light where the shield hits the floor.
  fx.bursts.push({x:f.impact.x,y:f.impact.y,r:120*k,life:clamp(age/650),power:.75});
  this.emit('dome',f,ULT_TIMING.impact+80,ULT_TIMING.impact+850,40,()=>{const a=Math.PI+this.random()*Math.PI,s=Math.max(.05,grow);this.add({x:cx+Math.cos(a)*rx*s,y:ground+Math.sin(a)*ry*s,vx:(this.random()-.5)*20*k,vy:-(40+50*this.random())*k,g:-20*k,drag:.3,life:.9,size:2.2*k,grow:0,rot:0,vr:0,color:p.glow,alpha:1,kind:'ember',add:true});});
 }
 /** Clover: tea steam spirals up, a four-leaf clover blooms, healing light rises on every ally. */
 private teaClover(f:UltPaintFrame,k:number,fx:FxFrame){
  const c=this.c,p=f.recipe.palette,at=f.at,H=f.caster.hand,C=f.impact,T=ULT_TIMING;
  this.charge(f,k,fx,p.glow);
  if(at>=T.squash&&at<T.impact+260){
   const u=clamp((at-T.squash)/(T.impact-T.squash)),out=at>T.impact?1-(at-T.impact)/260:1;
   fx.swirl={ax:H.x,ay:H.y,bx:C.x,by:C.y,u:easeOutCubic(u),alpha:clamp(out)*1.1};
  }
  const age=at-(T.impact-120);
  if(age>=0&&age<1000){
   const fade=age>760?1-(age-760)/240:1,R=92*k;this.audit.setPiece='tea-clover';
   fx.pools.push({x:C.x,y:C.y,r:160*k,power:.9*clamp(fade)});
   c.save();c.translate(C.x,C.y);c.rotate(age*.0007-(1-clamp(age/420))*.6);c.globalAlpha=clamp(fade);
   // Leaves unfold one after another.
   for(let i=0;i<4;i++){const g=f.reduced?1:easeOutBack(clamp((age-i*55)/300),1.7);if(g<=0)continue;c.save();c.rotate(i*Math.PI/2);c.scale(g,g);this.heartLeaf(R,p.glow,p.deep);c.restore();}
   c.globalCompositeOperation='lighter';const core=c.createRadialGradient(0,0,0,0,0,R*.5);core.addColorStop(0,'#fffde8');core.addColorStop(.4,p.accent+'aa');core.addColorStop(1,p.accent+'00');c.fillStyle=core;c.beginPath();c.arc(0,0,R*.5,0,TAU);c.fill();
   c.restore();
  }
  if(at>T.impact&&at<T.impact+1000)for(const b of f.team){
   const u=clamp((at-T.impact-80)/880);if(u<=0)continue;
   fx.columns.push({x:b.x+b.width/2,y:b.y+b.height,w:b.width*.62,h:b.height*1.25,alpha:Math.sin(u*Math.PI)*1.1});
   fx.pools.push({x:b.x+b.width/2,y:b.y+b.height,r:b.width*.75,power:Math.sin(u*Math.PI)*.8});
  }
  // Leaves and drops drift down over every ally.
  this.emit('rain',f,T.impact+40,T.impact+850,70,()=>{
   const b=f.team[Math.floor(this.random()*f.team.length)];if(!b)return;
   const x=b.x+b.width*(.1+.8*this.random()),petal=this.random()<.5;
   this.add({x,y:b.y-30*k*this.random(),vx:(this.random()-.5)*40*k,vy:(petal?90:240)*k*(1+this.random()*.5),g:(petal?40:300)*k,drag:petal?1.2:0,life:petal?1.1:Math.max(.25,b.height*.7/(300*k)),size:(petal?7:5)*k,grow:0,rot:this.random()*TAU,vr:petal?(this.random()-.5)*6:0,color:petal?'#7fd477':p.glow,alpha:.95,kind:petal?'petal':'drop',add:!petal});
  });
 }
 private heartLeaf(R:number,fill:string,deep:string){
  const c=this.c;c.beginPath();c.moveTo(0,0);
  c.bezierCurveTo(-R*.15,-R*.35,-R*.75,-R*.55,-R*.55,-R*.95);c.bezierCurveTo(-R*.4,-R*1.2,-R*.08,-R*1.1,0,-R*.82);
  c.bezierCurveTo(R*.08,-R*1.1,R*.4,-R*1.2,R*.55,-R*.95);c.bezierCurveTo(R*.75,-R*.55,R*.15,-R*.35,0,0);c.closePath();
  // Translucent, back-lit leaf: soft glow behind, a light gradient body, a pale vein.
  c.save();c.globalCompositeOperation='lighter';c.shadowColor=fill;c.shadowBlur=R*.35;c.fillStyle=fill+'55';c.fill();c.restore();
  const g=c.createLinearGradient(0,0,0,-R);g.addColorStop(0,deep+'cc');g.addColorStop(.45,fill+'bb');g.addColorStop(1,'#f2ffdc99');c.fillStyle=g;c.fill();
  c.strokeStyle='#fbfff0aa';c.lineWidth=R*.025;c.stroke();c.strokeStyle='#f6ffe6aa';c.lineWidth=R*.02;c.beginPath();c.moveTo(0,-R*.05);c.quadraticCurveTo(-R*.04,-R*.45,0,-R*.8);c.stroke();
 }
 /** Soot: the lantern spits a comet up the chimney; it arcs over the field and erupts on the target. */
 private chimneyComet(f:UltPaintFrame,k:number,fx:FxFrame){
  const p=f.recipe.palette,at=f.at,T=ULT_TIMING,P=f.impact,H=f.caster.hand;
  this.charge(f,k,fx,p.glow);
  const start={x:H.x,y:H.y},ctrl={x:(H.x+P.x)/2,y:-f.h*.42},end={x:P.x,y:P.y};
  const pos=(u:number)=>({x:(1-u)**2*start.x+2*(1-u)*u*ctrl.x+u*u*end.x,y:(1-u)**2*start.y+2*(1-u)*u*ctrl.y+u*u*end.y});
  if(at>=T.squash&&at<T.impact){
   const u=easeInOut((at-T.squash)/(T.impact-T.squash)),h=pos(u);this.audit.setPiece='chimney-comet';
   const trail:[number,number][]=[];for(let i=0;i<20;i++){const q=pos(Math.max(0,u-i*.03));trail.push([q.x,q.y]);}
   fx.comet={x:h.x,y:h.y,r:(30+22*u)*k,power:1,trail};
   fx.pools.push({x:h.x,y:Math.min(f.h*.92,P.y+f.h*.18),r:(120+160*u)*k,power:.25+.6*u*u});
   this.emit('tail',f,T.squash,T.impact,110,()=>{const a=this.random()*TAU,s=(60+140*this.random())*k;this.add({x:h.x,y:h.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s+60*k,g:500*k,drag:1.2,life:.4+.4*this.random(),size:(1.6+2.2*this.random())*k,grow:0,rot:a,vr:0,color:this.random()<.6?p.glow:p.accent,alpha:1,kind:'ember',add:true});});
   this.emit('puff',f,T.squash,T.squash+220,40,()=>{this.add({x:H.x+(this.random()-.5)*20*k,y:H.y-10*k,vx:(this.random()-.5)*40*k,vy:-(60+80*this.random())*k,g:0,drag:.6,life:.8,size:(16+14*this.random())*k,grow:50*k,rot:0,vr:0,color:'#6a5878',alpha:.22,kind:'smoke',add:false});});
  }
  const age=at-T.impact;if(age<0||age>1100)return;this.audit.setPiece='chimney-comet';
  const t=f.target,foot=t?t.y+t.height*.95:P.y+90*k,size=t?Math.max(t.height*.62,150*k):190*k;
  fx.bursts.push({x:P.x,y:foot,r:size,life:clamp(age/1000),power:f.reduced?.6:1.15});
  // Every other enemy takes a smaller eruption a beat later.
  for(const [i,b] of f.enemies.entries()){
   if(t&&b.x===t.x&&b.y===t.y)continue;const a2=age-90-i*60;if(a2<0)continue;
   fx.bursts.push({x:b.x+b.width/2,y:b.y+b.height*.95,r:Math.max(b.height*.45,110*k),life:clamp(a2/850),power:.8});
   fx.pools.push({x:b.x+b.width/2,y:b.y+b.height*.95,r:b.width*.9,power:.8*Math.max(0,1-a2/850)});
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
 /** Warm lantern halo behind the portrait: soft light and slow rays, no sci-fi rings. */
 private runeCircle(x:number,y:number,r:number,at:number,glow:string,core:string,reduced:boolean){
  const c=this.c,spin=reduced?0:at*.0004;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(0,0,0,0,0,r*1.15);g.addColorStop(0,core+'cc');g.addColorStop(.35,glow+'77');g.addColorStop(1,glow+'00');
  c.fillStyle=g;c.beginPath();c.arc(0,0,r*1.15,0,TAU);c.fill();
  c.rotate(spin);
  for(let i=0;i<12;i++){c.rotate(TAU/12);const rg=c.createLinearGradient(0,0,r*1.4,0);rg.addColorStop(0,core+'55');rg.addColorStop(1,core+'00');c.fillStyle=rg;c.beginPath();c.moveTo(0,0);c.lineTo(r*1.4,-r*.07);c.lineTo(r*1.4,r*.07);c.closePath();c.fill();}
  c.restore();
 }
 dispose(){this.flipbooks.dispose();this.gl.dispose();this.canvas.remove();this.particles.length=0;}
}
export type {FlipbookId};
