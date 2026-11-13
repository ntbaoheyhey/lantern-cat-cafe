import type {SceneView} from '../../squad/turn3d/scene';
import type {ResolveSocket} from '../spine/vfx';
import {sequenceAt,SIGNATURES} from './sequence';
import type {PackedPaint} from '../vfx-layered/atlas';
import {GroundPool,ElementParticlePool} from './field-pool';
import {paintImpactWake} from './impact-wake';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const random=(n:number)=>{const v=Math.sin(n*127.1+317.7)*43758.5453;return v-Math.floor(v);};
function star(c:CanvasRenderingContext2D,x:number,y:number,r:number,n=4){
 c.beginPath();for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,k=i%2?r*.22:r;c.lineTo(x+Math.cos(a)*k,y+Math.sin(a)*k);}c.closePath();c.fill();
}
/** Fixed-clock procedural paths share the painted canvas and its face/label mask. */
export class FieldVfx {
 draws=0;readonly audit={skill:'',tier:'',particles:0,layers:[] as string[],groundCount:0,groundCapacity:24,pooledParticles:0};
 private ground=new GroundPool();
 private particles=new ElementParticlePool();
 private groundPlan:unknown;private lastTime=-Infinity;
 constructor(private socket:ResolveSocket,private painted:(id:string)=>PackedPaint|undefined=()=>undefined){}
 render(c:CanvasRenderingContext2D,view:SceneView,width:number,height:number,time:number){
  this.draws=0;this.audit.particles=0;this.audit.layers.length=0;
  if(time<this.lastTime)this.ground.clear();this.lastTime=time;
  this.audit.groundCount=this.ground.expire(time);
  for(const g of this.ground.items)if(g.active)this.residue(c,g,time-g.born);
  const frame=view.frame,state=frame&&sequenceAt(frame.plan,frame.elapsed,view.reducedMotion);
  if(!frame||state?.plate)return;
  const plan=frame.plan,seq=state?.seq,at=frame.elapsed,contact=seq?.impact??plan.beats[2]!.start;
  const active=seq?.tier==='active'||!seq&&['special','telegraph'].includes(plan.beats[0]!.clip),tier=seq?.tier??(plan.ultimate?'ultimate':active?'active':'basic');
  const unit=view.actors.find(a=>a.id===plan.actorId),owner=(plan.presentationId??unit?.cardRpg?.cardId??plan.skillId).replace(/^enemy:/,'').replace(/-[1-4]$/,'');
  const palette=SIGNATURES.get(owner)?.element.palette??[plan.accent,plan.color,'#241b32'];
  const from=this.socket(plan.actorId,'mainHand');if(!from)return;
  const painted=this.painted(plan.presentationId??plan.skillId);
  const progress=clamp((at-100)/Math.max(1,contact-100)),since=at-contact;
  const release=since<0?Math.sin(progress*Math.PI*.5):Math.max(0,1-since/620);
  if(at<80||release<=0)return;
  const shader=seq?.vfx.find(t=>t.type==='shader'),family=shader?.source??plan.shape;
  const seed=[...owner].reduce((n,ch)=>n+ch.charCodeAt(0),0),viewportHeight=Math.max(height,typeof window==='undefined'?height:window.innerHeight);
  const radius=Math.sqrt(width*viewportHeight*(tier==='basic'?.05:.15)/Math.PI)*(tier==='basic'?(owner==='velvet'?2.2:seq?1.5:1.8):1.65);
  const targets=plan.targetIds.length?plan.targetIds:[plan.actorId];
  Object.assign(this.audit,{skill:plan.presentationId??plan.skillId,tier});
  if(tier!=='basic')this.castField(c,owner,width,height,at/1000,release,palette,seed,view.reducedMotion);
  for(const [ti,id] of targets.entries()){
   const target=this.socket(id,'vfxOrigin'),feet=this.socket(id,'feet');if(!target||!feet)continue;
   const arrival=clamp((at-contact+220-ti*20)/220),travel=1-(1-arrival)**2;
   const x=from.x+(target.x-from.x)*travel,y=from.y+(target.y-from.y)*travel-Math.sin(travel*Math.PI)*radius*.24;
   const expansion=since<0?.40+.60*arrival:1+Math.min(.22,since/1000),r=radius*expansion;
   c.save();c.globalCompositeOperation='screen';c.lineCap='round';c.lineJoin='round';
   // Broad painted-style energy, composed from each element's own silhouette.
   c.save();c.translate(x,y);
   const winding=view.reducedMotion?0:(since<0?progress*.7:.7+Math.min(.8,since/450))*(seed%2?1:-1);
   c.rotate((seed%11-5)*.08+winding);
   const aura=c.createRadialGradient(0,0,r*.10,0,0,r*1.05);
   aura.addColorStop(0,palette[1]+'b0');aura.addColorStop(.48,palette[1]+'90');aura.addColorStop(.8,palette[1]+'48');aura.addColorStop(1,palette[1]+'00');
   c.globalAlpha=release/Math.sqrt(targets.length);c.fillStyle=aura;c.strokeStyle=aura;
   this.silhouette(c,owner,family,r,progress,at/1000,seed);
   if(painted){
    // Unfurl the painted energy around the hand, then sweep it out through the
    // target. The original painting remains intact; this is a moving cut-out.
    const swell=view.reducedMotion?1:since<0?.48+.52*progress:1+.30*Math.sin(Math.min(1,since/420)*Math.PI);
    c.save();c.scale(swell,swell);
    c.globalCompositeOperation='source-over';c.globalAlpha=release*.95;
    const extent=r*(tier==='basic'?2.1:2.5);c.drawImage(painted.image,painted.x+256,painted.y,256,256,-extent/2,-extent/2,extent,extent);
    c.globalCompositeOperation='screen';c.globalAlpha=release*.42;
    c.rotate((seed%2?1:-1)*.25);c.drawImage(painted.image,painted.x+512,painted.y,256,256,-r*1.4,-r*1.05,r*2.8,r*2.1);
    c.restore();
    this.audit.layers.push('painted-core','painted-sweep');this.draws+=2;
   }else{c.globalAlpha=release*.8;c.strokeStyle=palette[0]!;c.fillStyle=palette[0]!;c.lineWidth=r*.025;this.motif(c,family,r*.68,Math.max(.3,progress),at/1000,view.reducedMotion);}
   c.restore();this.draws+=2;this.audit.layers.push('element-aura');
   if(arrival>0&&arrival<1){
    c.strokeStyle=palette[1]!;c.globalAlpha=.3*release;c.lineWidth=radius*.23;c.beginPath();c.moveTo(from.x,from.y);c.quadraticCurveTo((from.x+x)/2,Math.min(from.y,y)-radius*.3,x,y);c.stroke();
    c.strokeStyle=palette[0]!;c.lineWidth=radius*.035;c.globalAlpha=.8;c.stroke();this.draws+=2;this.audit.layers.push('travel-ribbon');
   }
   const pose=Math.floor(since/(1000/30));
   if(pose>=0&&pose<12){
    const p=pose/12;c.save();c.translate(target.x,target.y);c.rotate(seed*.1+p*.3);c.globalAlpha=(1-p)*.86/Math.sqrt(targets.length);c.fillStyle=palette[0]!;
    if(painted){const size=r*(1.1+p*.9);c.drawImage(painted.image,painted.x+768,painted.y,256,256,-size/2,-size/2,size,size);}
    else star(c,0,0,r*(.22+p*.25),4+seed%4);
    c.restore();this.draws++;this.audit.layers.push('twelve-frame-spark');
   }
   const low=view.quality==='low',count=view.reducedMotion?12:tier==='basic'?(low?14:32):(low?28:72),spread=since<0?progress*.45:.35+since/470;
   const points=this.particles.get(seed);this.audit.pooledParticles=this.particles.allocated;
   c.globalAlpha=release*.8;for(let i=0;i<count;i++){
    const j=i*5,angle=points[j]!,rr=r*points[j+3]!*spread,px=target.x+points[j+1]!*rr,py=target.y+points[j+2]!*rr*.72-(since>0?since*.07:0),size=(tier==='basic'?3:5)+points[j+4]!;
    c.fillStyle=i%3?palette[1]!:palette[0]!;
    if(seed%3===0){c.save();c.translate(px,py);c.rotate(angle+at/700);c.beginPath();c.ellipse(0,0,size,size*2.5,0,0,7);c.fill();c.restore();}
    else if(seed%3===1){c.fillRect(px-size/2,py-size/2,size,size*1.6);}else star(c,px,py,size,3+i%3);
   }
   this.draws+=count;this.audit.particles+=count;this.audit.layers.push('element-particles');
   c.restore();
   if(painted&&view.quality!=='low'&&paintImpactWake(c,painted,since,feet.x,feet.y,radius,target.x>=from.x?1:-1,targets.length,view.reducedMotion)){
    this.draws++;this.audit.layers.push('painted-impact-wake');
   }
   if(since>=0&&this.groundPlan!==plan)this.ground.emit(feet.x,feet.y,radius*.8,time-since/1000,palette[1]!,family,seed);
  }
  if(since>=0)this.groundPlan=plan;
 }
 private castField(c:CanvasRenderingContext2D,owner:string,w:number,h:number,time:number,release:number,palette:string[],seed:number,reduced:boolean){
  // Each element occupies the whole field with its own moving environmental
  // motif. Soft light stays behind the painted core and the final face mask.
  const t=reduced?0:time,cx=w*.5,cy=h*.55;
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=release*.22;c.lineCap='round';c.lineJoin='round';
  const wash=c.createRadialGradient(cx,cy,0,cx,cy,w*.7);wash.addColorStop(0,palette[1]+'88');wash.addColorStop(.6,palette[1]+'34');wash.addColorStop(1,palette[1]+'00');
  c.fillStyle=wash;c.fillRect(0,0,w,h);c.strokeStyle=palette[1]!;c.fillStyle=palette[1]!;
  const ellipse=(x:number,y:number,rx:number,ry:number,angle=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.stroke();};
  switch(owner){
   case 'mochi':
    for(let i=0;i<7;i++){const x=w*(i/6)+Math.sin(t*2.5)*w*.18;c.beginPath();c.moveTo(cx,h*.75);c.lineTo(x-w*.1,0);c.lineTo(x+w*.035,0);c.closePath();c.fill();}c.lineWidth=8;ellipse(cx,cy,w*(.34+.08*Math.sin(t*3)),h*.48);break;
   case 'soot':
    for(let i=0;i<8;i++){const x=w*(i+.4)/8,y=h*((t*.4+i*.21)%1);c.lineWidth=18+(i%3)*9;c.beginPath();c.moveTo(x-w*.12,y-h*.65);c.quadraticCurveTo(x-w*.04,y-h*.2,x,y);c.stroke();}break;
   case 'clover':
    for(let i=0;i<15;i++){const x=w*(i+.5)/15,y=h*(.5+.43*Math.sin(i*2.4+t));c.save();c.translate(x,y);c.rotate(i+t*.4);c.beginPath();c.ellipse(0,0,w*.055,h*.055,0,0,7);c.fill();c.restore();}break;
   case 'panko':
    for(let i=0;i<6;i++){const x=w*(i+.5)/6,d=w*.08,drop=Math.sin(t*3+i*.65)*h*.16;c.save();c.translate(0,drop);c.beginPath();c.moveTo(x-d,h*.12);c.lineTo(x+d,h*.12);c.lineTo(x+d,h*.72);c.lineTo(x,h*.98);c.lineTo(x-d,h*.72);c.closePath();c.lineWidth=11;c.stroke();c.restore();}break;
   case 'biscuit':
    c.globalAlpha=release*.42;c.lineWidth=4;c.beginPath();for(let i=0;i<12;i++){const x=w*(i+.5)/12,y=h*(.5+.39*Math.sin(i*3.1));if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();
    for(let i=0;i<12;i++)star(c,w*(i+.5)/12,h*(.5+.39*Math.sin(i*3.1)),22+8*Math.sin(t*3+i),5);
    c.lineWidth=7;ellipse(w*.27,h*.52,w*.25,h*.4,t*.2);ellipse(w*.73,h*.52,w*.25,h*.4,-t*.2);
    for(let i=0;i<24;i++){const a=i*Math.PI/12+t*.2;c.beginPath();c.moveTo(cx+Math.cos(a)*w*.38,cy+Math.sin(a)*h*.34);c.lineTo(cx+Math.cos(a)*w*.44,cy+Math.sin(a)*h*.41);c.stroke();}break;
   case 'inkcap':
    for(let i=0;i<7;i++){const x=w*(i+.5)/7,y=h*(.5+.3*Math.sin(i*2+t));const fog=c.createRadialGradient(x,y,0,x,y,w*.19);fog.addColorStop(0,palette[1]+'dd');fog.addColorStop(1,palette[1]+'00');c.fillStyle=fog;c.fillRect(x-w*.2,y-w*.2,w*.4,w*.4);}break;
   case 'velvet':
    c.lineWidth=8;for(let i=-2;i<8;i++){const x=w*i/6+w*(t*.45%1)/6;c.beginPath();c.moveTo(x,0);c.lineTo(x+w*.5,h);c.moveTo(x,h);c.lineTo(x+w*.5,0);c.stroke();}break;
   case 'cinnamon':
    c.lineWidth=24;for(let i=0;i<5;i++){const x=w*(i+.5)/5;ellipse(x,h*.58,w*.12,h*(.22+.03*Math.sin(t*3+i)),t*.3+i);}break;
   case 'sorrel':
    for(let i=0;i<7;i++){const y=h*(i+.5)/7;c.lineWidth=10+i*2;c.beginPath();c.moveTo(-30,y);c.bezierCurveTo(w*.3,y-h*.3*Math.sin(t+i),w*.7,y+h*.25*Math.cos(t+i),w+30,y);c.stroke();}break;
   case 'brioche':
    c.lineWidth=36;for(let i=0;i<4;i++){c.beginPath();c.ellipse(w*(i+.3)/3,h*.6,w*.25,h*.6,-.4+t*.08,Math.PI*.15,Math.PI*1.65);c.stroke();}break;
   case 'marigold':
    c.translate(cx,cy);c.lineWidth=20;for(let i=0;i<10;i++){const a=i*Math.PI/5+t*.2;ellipse(Math.cos(a)*w*.2,Math.sin(a)*h*.22,w*.23,h*.13,a);}break;
   case 'mallow':
    for(let i=0;i<14;i++){const x=w*(i+.5)/14,y=h*(.5+.4*Math.sin(i*1.8+t*.5));c.beginPath();c.moveTo(x,y-h*.19);c.lineTo(x+w*.025,y);c.lineTo(x,y+h*.19);c.lineTo(x-w*.025,y);c.closePath();c.fill();}break;
   default:c.lineWidth=14;for(let i=0;i<4;i++)ellipse(cx,cy,w*(.12+i*.10),h*(.10+i*.10),(seed%5)*.3+t*.1);
  }
  c.restore();this.draws+=16;this.audit.layers.push('element-field-motion');
 }
 private silhouette(c:CanvasRenderingContext2D,owner:string,family:string,r:number,p:number,time:number,seed:number){
  const oval=(x:number,y:number,rx:number,ry:number,a=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,a,0,Math.PI*2);c.fill();};
  const ribbon=(sign:number)=>{c.beginPath();c.moveTo(-r,-r*.55*sign);c.bezierCurveTo(-r*.05,-r*sign,-r*.15,r*sign,r,r*.45*sign);c.lineTo(r,r*.8*sign);c.bezierCurveTo(-r*.3,r*1.1*sign,r*.15,-r*.6*sign,-r,-r*.1*sign);c.closePath();c.fill();};
  switch(owner){
   case 'mochi':c.beginPath();c.moveTo(-r,r*.45);c.bezierCurveTo(-r,-r,r,-r,r,r*.45);c.quadraticCurveTo(0,r*.9,-r,r*.45);c.fill();break;
   case 'soot':for(let j=0;j<7;j++){const x=(j-3)*r*.3,h=r*(.7+random(j+seed)*.8);c.beginPath();c.moveTo(x-r*.25,r*.65);c.quadraticCurveTo(x-r*.6,-h*.4,x+Math.sin(time*4+j)*r*.15,-h);c.quadraticCurveTo(x+r*.5,-h*.1,x+r*.25,r*.65);c.fill();}break;
   case 'mallow':for(let j=0;j<9;j++){const a=j*Math.PI*2/9;const x=Math.cos(a)*r*.6,y=Math.sin(a)*r*.6;c.beginPath();c.moveTo(x,y-r*.65);c.lineTo(x+r*.26,y);c.lineTo(x,y+r*.65);c.lineTo(x-r*.26,y);c.closePath();c.fill();}break;
   case 'clover':for(let j=0;j<7;j++){const a=j*Math.PI*2/7+time*.7;oval(Math.cos(a)*r*.3,Math.sin(a)*r*.3,r*.7,r*.34,a);}break;
   case 'marigold':for(let j=0;j<12;j++){const a=j*Math.PI/6+time*.2;oval(Math.cos(a)*r*.5,Math.sin(a)*r*.5,r*.5,r*.2,a);}break;
   case 'panko':c.beginPath();c.moveTo(0,-r);c.lineTo(r,r*-.45);c.lineTo(r*.85,r*.5);c.quadraticCurveTo(0,r*1.2,-r*.85,r*.5);c.lineTo(-r,-r*.45);c.closePath();c.fill();break;
   case 'biscuit':for(let j=0;j<8;j++){const a=j*2.4+time*.4;star(c,Math.cos(a)*r*.46,Math.sin(a)*r*.46,r*.6,3+j%3);}break;
   case 'inkcap':for(let j=0;j<9;j++){const a=j*2.4;oval(Math.cos(a)*r*.43,Math.sin(a)*r*.43,r*(.3+random(j)*.35),r*.42,a+time*.15);}break;
   case 'velvet':ribbon(1);ribbon(-1);break;
   case 'cinnamon':ribbon(1);oval(r*.2,r*.45,r*.85,r*.35,-.2);break;
   case 'sorrel':c.lineWidth=r*.28;for(let j=0;j<3;j++){c.beginPath();c.ellipse((j-1)*r*.3,0,r*(.45+j*.2),r*.75,j*.7+time*.8,0,Math.PI*1.7);c.stroke();}break;
   case 'brioche':c.beginPath();c.arc(0,0,r,Math.PI*.2,Math.PI*1.8);c.bezierCurveTo(-r*.5,-r*.9,-r*.5,r*.9,r*Math.cos(Math.PI*.2),r*Math.sin(Math.PI*.2));c.fill();break;
   default:if(family.includes('thread')){ribbon(1);ribbon(-1);}else if(family.includes('slash')||family.includes('sweep')){c.lineWidth=r*.5;c.beginPath();c.arc(-r*.1,0,r*.75,-1.7,1.8);c.stroke();}else star(c,0,0,r,5+seed%4);
  }
 }
 private residue(c:CanvasRenderingContext2D,g:{x:number;y:number;r:number;born:number;color:string;family:string;seed:number},age:number){
  const p=clamp(age/.85);if(p>=1||p<0)return;c.save();c.translate(g.x,g.y);c.scale(1,.26);c.globalAlpha=(1-p)*.55;c.strokeStyle=g.color;c.fillStyle=g.color;c.lineWidth=8;
  c.beginPath();c.ellipse(0,0,g.r*(.75+p*.45),g.r*(.75+p*.45),0,0,7);c.stroke();
  if(/leaf|petal|herb|spore|ink|tea/.test(g.family)){for(let j=0;j<8;j++){const a=j*2.4;c.beginPath();c.ellipse(Math.cos(a)*g.r*.6,Math.sin(a)*g.r*.6,g.r*.22,g.r*.1,a,0,7);c.fill();}}
  else for(let j=0;j<7;j++){const a=j*2.4+g.seed;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*g.r*.5,Math.sin(a)*g.r*.4);c.lineTo(Math.cos(a+.12)*g.r,Math.sin(a+.12)*g.r);c.stroke();}
  c.restore();this.draws+=9;this.audit.layers.push('lingering-ground');
 }
 private motif(c:CanvasRenderingContext2D,name:string,r:number,p:number,time:number,reduced:boolean){
  const ellipse=(x:number,y:number,rx:number,ry:number,a=0)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),a,0,Math.PI*2);c.stroke();};
  const arc=(a:number,b:number,k=1)=>{c.beginPath();c.arc(0,0,r*k,a,b);c.stroke();};
  const line=(x:number,y:number,x2:number,y2:number)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();};
  const rotation=reduced?0:time*2;
  switch(name){
   case 'slash':case 'blade-cross':case 'crescent-cut':case 'slash-arcs':
    c.rotate(-.6+p*.8);c.lineWidth=r*.11;arc(-1.2,1.15,p);if(name==='blade-cross'){c.rotate(1.6);arc(-1.2,1.15,p*.8);}if(name==='crescent-cut')arc(-1.1,1.1,p*.72);break;
   case 'thrust':case 'shield-rush':case 'shield-bash':line(-r*1.8,0,r*p,0);line(r*p,0,r*(p-.3),-r*.2);line(r*p,0,r*(p-.3),r*.2);if(name!=='thrust')c.strokeRect(r*p-r*.3,-r*.6,r*.6,r*1.2);break;
   case 'throw':case 'vial-arc':c.rotate(rotation);c.fillRect(-r*.13,-r*.22,r*.26,r*.44);c.strokeRect(-r*.13,-r*.22,r*.26,r*.44);line(-r*.08,-r*.22,-r*.08,-r*.32);break;
   case 'staff':case 'ember-orb':ellipse(0,0,r*.24,r*.24);star(c,0,0,r*.35);if(name==='ember-orb')for(let i=0;i<5;i++){c.rotate(1.26);arc(-.3,.6,.5+p*.4);}break;
   case 'shield-pulse':case 'shield-dome':ellipse(0,r*.4,r*p,r*.3*p);c.beginPath();c.arc(0,r*.3,r*p,Math.PI,0);c.stroke();break;
   case 'rally-rays':for(let i=0;i<7;i++){const a=(i/6-1)*Math.PI;line(Math.cos(a)*r*.3,Math.sin(a)*r*.3,Math.cos(a)*r*p,Math.sin(a)*r*p);}break;
   case 'thread-snare':for(let i=0;i<3;i++)ellipse(0,(i-1)*r*.35,r*p,r*.22,rotation+i);break;
   case 'leaf-patch':case 'petal-storm':case 'paper-cranes':for(let i=0;i<7;i++){const a=i*2.4+rotation,x=Math.cos(a)*r*p,y=Math.sin(a)*r*p*.5;c.save();c.translate(x,y);c.rotate(a);ellipse(0,0,r*.25,r*.08);c.restore();}break;
   case 'crumb-fan':case 'needle-fan':case 'needle-rain':for(let i=0;i<7;i++){const a=(i-3)*.23,x=Math.cos(a)*r*p,y=Math.sin(a)*r*p;if(name==='crumb-fan')star(c,x,y,r*.12,3);else line(x-r*.4,y,x,y);}break;
   case 'oven-ring':ellipse(0,r*.4,r*p,r*.35);for(let i=0;i<6;i++)star(c,(i-2.5)*r*.32,r*.4,r*(.15+Math.sin(time*10+i)*.05),3);break;
   case 'flame-column':case 'ground-eruption':for(let i=0;i<5;i++){const x=(i-2)*r*.3;c.beginPath();c.moveTo(x-r*.15,r);c.lineTo(x,-r*p*(.8+random(i)));c.lineTo(x+r*.15,r);c.fill();}break;
   case 'herb-spiral':case 'sugar-orbit':case 'ribbon-vortex':for(let i=0;i<12;i++){const a=i*.65+rotation,rr=r*i/12*p;if(name==='sugar-orbit')star(c,Math.cos(a)*rr,Math.sin(a)*rr*.5,r*.1,5);else ellipse(Math.cos(a)*rr,Math.sin(a)*rr*.5,r*.12,r*.04,a);}break;
   case 'crumb-crown':for(let i=0;i<5;i++)star(c,(i-2)*r*.38,-r*.6-Math.sin(i*Math.PI/4)*r*.4,r*.18,5);break;
   case 'ink-pool':case 'ink-splash':for(let i=0;i<7;i++){const a=i*2.4;c.beginPath();c.ellipse(Math.cos(a)*r*p*.6,Math.sin(a)*r*p*.4+r*.5,r*(.12+random(i)*.2),r*.12,0,0,7);c.fill();}break;
   case 'spore-cloud':for(let i=0;i<9;i++)ellipse((random(i)-.5)*r*1.8,(random(i+5)-.5)*r*1.5-time%1*r*.3,r*.12,r*.12);break;
   case 'tea-stream':case 'teapot-summon':c.beginPath();c.moveTo(-r,-r);c.bezierCurveTo(-r*.2,-r*.9,-r*.5,r*.5,r,r*.5);c.stroke();ellipse(r,r*.5,r*.4,r*.12);break;
   case 'steam-ring':for(let i=0;i<3;i++){const x=(i-1)*r*.4;c.beginPath();c.moveTo(x,r*.5);c.bezierCurveTo(x-r*.4,0,x+r*.4,-r*.3,x,-r);c.stroke();}break;
   case 'ribbon-cross':for(const sign of [-1,1]){c.beginPath();c.moveTo(-r,-r*sign);c.bezierCurveTo(r*.7,-r*sign,-r*.7,r*sign,r,r*sign);c.stroke();}break;
   case 'frost-cone':c.beginPath();c.moveTo(-r,0);c.lineTo(r,-r*.7*p);c.lineTo(r,r*.7*p);c.closePath();c.stroke();for(let i=0;i<3;i++)star(c,r*.5,(i-1)*r*.3,r*.15,6);break;
   case 'petal-bell':c.beginPath();c.moveTo(-r*.6,r*.3);c.bezierCurveTo(-r*.5,-r,r*.5,-r,r*.6,r*.3);c.closePath();c.stroke();ellipse(0,r*.3,r*.6,r*.15);star(c,0,r*.4,r*.15);break;
   case 'sun-rings':for(let i=0;i<3;i++)ellipse(0,0,r*(.4+i*.3)*p,r*(.4+i*.3)*p);break;
   case 'falling-meteors':for(let i=0;i<4;i++){const x=(i-1.5)*r*.5;line(x-r*.4,-r,x,r*.5);star(c,x,r*.5,r*.2);}break;
   case 'moon-beam':c.lineWidth=r*.35;line(0,-r*1.6,0,r);ellipse(0,r,r*.65,r*.2);break;
   case 'yarn-whale':ellipse(0,0,r,r*.5,-.1);for(let i=0;i<5;i++)ellipse((i-2)*r*.2,0,r*.2,r*.45);line(r,0,r*1.4,-r*.5);line(r,0,r*1.4,r*.3);break;
   default:ellipse(0,0,r*p,r*.3*p);break;
  }
 }
}
