import type {SceneView} from '../../squad/turn3d/scene';
import type {ResolveSocket} from '../spine/vfx';
import {sequenceAt,SIGNATURES} from './sequence';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const random=(n:number)=>{const v=Math.sin(n*127.1+317.7)*43758.5453;return v-Math.floor(v);};
function star(c:CanvasRenderingContext2D,x:number,y:number,r:number,n=4){
 c.beginPath();for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,k=i%2?r*.22:r;c.lineTo(x+Math.cos(a)*k,y+Math.sin(a)*k);}c.closePath();c.fill();
}
/** Fixed-clock procedural paths share the painted canvas and its face/label mask. */
export class FieldVfx {
 draws=0;
 constructor(private socket:ResolveSocket){}
 render(c:CanvasRenderingContext2D,view:SceneView){
  this.draws=0;const frame=view.frame,state=frame&&sequenceAt(frame.plan,frame.elapsed,view.reducedMotion);if(!frame||!state||state.plate)return;
  const {seq,at}=state,owner=(frame.plan.presentationId??frame.plan.skillId).replace(/^enemy:/,'').replace(/-[1-4]$/,''),palette=SIGNATURES.get(owner)?.element.palette??[frame.plan.accent,frame.color,'#241b32'];
  const from=this.socket(frame.plan.actorId,'mainHand');if(!from)return;
  const impact=clamp((at-seq.impact)/Math.max(1,seq.duration-seq.impact));
  for(const track of seq.vfx){
   if(track.type==='painted-layer')continue;
   const ids=track.anchor==='caster'?[frame.plan.actorId]:frame.plan.targetIds;
   for(const id of ids){
    const target=this.socket(id,'vfxOrigin'),feet=this.socket(id,'feet'),head=this.socket(id,'head');if(!target||!feet||!head)continue;
    const size=Math.max(80,Math.abs(feet.y-head.y)),travel=clamp((at-120)/Math.max(1,seq.impact-120));
    let x=target.x,y=target.y;
    if(track.anchor==='flight'){x=from.x+(x-from.x)*travel;y=from.y+(y-from.y)*travel-Math.sin(travel*Math.PI)*size*(track.source==='throw'?.5:.12);}
    c.save();c.globalCompositeOperation=track.blend==='normal'?'source-over':track.blend==='add'?'lighter':'screen';c.strokeStyle=palette[1]!;c.fillStyle=palette[0]!;c.lineCap='round';c.lineJoin='round';c.lineWidth=Math.max(2,size*.025);
    if(track.type==='flipbook'){
     // Six deterministic poses form a baked-style spark; no wall-clock emitters.
     const pose=Math.floor((at-seq.impact)/33.333);if(pose>=0&&pose<6){c.globalAlpha=(1-pose/6)*.85;star(c,target.x,target.y,size*(.13+pose*.025));this.draws++;}
    }else if(track.type==='particles'){
     if(at>=seq.impact){const count=view.reducedMotion?4:12;c.globalAlpha=(1-impact)*.75;for(let i=0;i<count;i++){const a=i/count*Math.PI*2,r=size*(.15+impact*.65)*(view.reducedMotion?.45:1);star(c,target.x+Math.cos(a)*r,target.y+Math.sin(a)*r*.65-impact*size*.25,2+random(i)*3,3);}this.draws+=count;}
    }else{
     const p=at<seq.impact?travel:1-impact*.3,alpha=at<seq.impact?Math.sin(travel*Math.PI)*.65:(1-impact)*.8;
     c.globalAlpha=alpha;c.translate(x,y);const r=size*.43;
     this.motif(c,track.source,r,p,at/1000,view.reducedMotion);this.draws++;
    }
    c.restore();
   }
  }
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
