/** Pooled 2D sprites on the same projected skeleton sockets as the HUD. */
import type { SceneView } from '../../squad/turn3d/scene';
import type { Rect } from '../../squad/turn3d/label-layout';
import type { EffectFrame } from '../../squad/turn3d/effects';
import type { SpineCue } from './events';
import type { SpineSocket } from './config';
import { paintedRecipe, PAINTED_STATUSES, type PaintedLayer, type PaintedRecipe } from './vfx-registry';
import { PaintedStamps } from './vfx-stamps';
import { PAINT } from './style';
import { DesignerVfx } from './vfx-overrides';
type Point={x:number;y:number};
interface Particle {active:boolean;born:number;life:number;source:string;target:string;layer:PaintedLayer|null;recipe:PaintedRecipe|null;index:number;total:number;stamp:HTMLCanvasElement|null;origin:Point;end:Point;captured:boolean;impact:boolean}
export type ResolveSocket=(id:string,socket:SpineSocket)=>Point|undefined;
export class PaintedVfx {
 readonly overrides=new DesignerVfx();readonly ready:Promise<void>;
 readonly canvas=document.createElement('canvas');private ctx:CanvasRenderingContext2D;readonly stamps=new PaintedStamps();
 readonly stats={active:0,peak:0,dropped:0,draws:0,cues:0,allocated:PAINT.fxPool,maskedFaces:0,override:0};
 private pool:Particle[]=Array.from({length:PAINT.fxPool},()=>({active:false,born:0,life:0,source:'',target:'',layer:null,recipe:null,index:0,total:0,stamp:null,origin:{x:0,y:0},end:{x:0,y:0},captured:false,impact:false}));
 private cursor=0;private plan:unknown;private hitFrames=0;private prepared=false;
 constructor(private host:HTMLElement,private socket:ResolveSocket){
  const context=this.canvas.getContext('2d');if(!context)throw Error('Painted effects canvas unavailable');this.ctx=context;
  this.canvas.dataset.paintedVfx='true';this.canvas.setAttribute('aria-hidden','true');Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'2'});host.appendChild(this.canvas);this.ready=this.overrides.prepare();
 }
 private spawn(recipe:PaintedRecipe,layer:PaintedLayer,source:string,target:string,time:number,index:number,total:number,speed:number,impact=false){
  let particle:Particle|undefined;for(let i=0;i<this.pool.length;i++){const candidate=this.pool[this.cursor];this.cursor=(this.cursor+1)%this.pool.length;if(!candidate!.active){particle=candidate;break;}}
  if(!particle){this.stats.dropped++;return;}
  particle.active=true;particle.born=time+layer.delay;particle.life=layer.life*Math.max(1,speed*.65);particle.source=source;particle.target=target;particle.layer=layer;particle.recipe=recipe;particle.index=index;particle.total=total;particle.stamp=this.stamps.get(layer.glyph,layer.accent?PAINT.cream:recipe.color)??null;particle.captured=false;particle.impact=impact;
 }
 cue(cue:SpineCue,frame:EffectFrame,time:number,speed:number){
  if(this.plan!==frame.plan){this.plan=frame.plan;this.hitFrames=0;this.prepared=false;}
  const recipe=paintedRecipe(frame.plan.presentationId??frame.plan.skillId);if(!recipe)return;
  this.stats.cues++;
  if(this.overrides.effects.has(recipe.id)){this.overrides.emit(recipe.id,cue.name,cue.name==='cast'?frame.plan.actorId:frame.plan.targetIds,time);return;}
  if(cue.name==='cast'||cue.name==='ult-start'){
   if(!this.prepared){for(const layer of recipe.layers)if(layer.anchor==='caster')for(let i=0;i<layer.count;i++)this.spawn(recipe,layer,frame.plan.actorId,frame.plan.actorId,time,i,layer.count,speed);this.prepared=true;}
   if(cue.name==='cast')for(const layer of recipe.layers)if(layer.anchor!=='caster'&&['projectile','pour','converge'].includes(layer.motion))for(const target of frame.plan.targetIds)for(let i=0;i<layer.count;i++)this.spawn(recipe,layer,frame.plan.actorId,target,time,i,layer.count,speed);
  }
  if(cue.name!=='hit')return;
  this.hitFrames=2;
  for(const layer of recipe.layers){
   if(layer.anchor==='caster'&&this.prepared)continue;
   if(layer.anchor==='caster'){for(let i=0;i<layer.count;i++)this.spawn(recipe,layer,frame.plan.actorId,frame.plan.actorId,time,i,layer.count,speed);continue;}
   for(const target of frame.plan.targetIds){for(let i=0;i<layer.count;i++)this.spawn(recipe,layer,frame.plan.actorId,target,time,i,layer.count,speed,true);}
  }
 }
 render(view:SceneView,time:number,width:number,height:number,protectedLabels:readonly Rect[]){
  const c=this.ctx,ratio=Math.min(devicePixelRatio||1,2),w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);c.save();this.stats.active=0;this.stats.draws=0;this.stats.maskedFaces=0;
  // Intersect each exclusion separately: overlapping masks cannot reopen a face.
  for(const actor of view.actors){if(actor.hp<=0)continue;const face=this.socket(actor.id,'head'),feet=this.socket(actor.id,'feet');if(!face||!feet)continue;const size=Math.abs(feet.y-face.y)/.77;c.beginPath();c.rect(0,0,width,height);c.ellipse(face.x,face.y,size*.30,size*.27,0,0,Math.PI*2,true);c.clip('evenodd');this.stats.maskedFaces++;}
  for(const box of protectedLabels){c.beginPath();c.rect(0,0,width,height);c.rect(box.x-3,box.y-3,box.width+6,box.height+6);c.clip('evenodd');}
  for(const p of this.pool){
   if(!p.active)continue;const age=time-p.born;if(age>p.life){p.active=false;continue;}if(age<0)continue;
   const layer=p.layer!,recipe=p.recipe!,origin=this.socket(p.source,recipe.origin),target=this.socket(p.target,layer.socket),feet=this.socket(p.target,'feet'),head=this.socket(p.target,'head');if(!origin||!target||!feet||!head||!p.stamp)continue;
   if(!p.captured){p.origin.x=origin.x;p.origin.y=origin.y;p.end.x=target.x;p.end.y=target.y;p.captured=true;}
   const progress=Math.min(1,age/p.life),size=Math.max(1,Math.abs(feet.y-head.y)/.77),angle=p.index/Math.max(1,p.total)*Math.PI*2,spread=layer.spread*size;
   let x=target.x,y=target.y,scale=1,rotation=0,alpha=Math.sin(Math.min(1,progress*5)*Math.PI/2)*(1-progress)**.6;
   const moving=!p.impact&&(layer.motion==='projectile'||layer.motion==='pour'||layer.motion==='converge');
   if(moving){const t=1-(1-progress)**2;x=p.origin.x+(target.x-p.origin.x)*t;y=p.origin.y+(target.y-p.origin.y)*t-Math.sin(t*Math.PI)*size*.35;rotation=Math.atan2(target.y-p.origin.y,target.x-p.origin.x);}
   else if(['burst','emit','fall','rise','orbit'].includes(layer.motion)){const radius=layer.motion==='orbit'?spread:spread*Math.sqrt(progress);const a=angle+(layer.motion==='orbit'?progress*layer.turns*Math.PI*2:0);x+=Math.cos(a)*radius;y+=Math.sin(a)*radius*.5;if(layer.motion==='rise')y-=progress*size*.4;if(layer.motion==='fall')y+=progress*size*.3;rotation=angle*.3+progress*layer.turns;}
   else if(['sweep','cross','crescent'].includes(layer.motion)){rotation=(progress-.5)*Math.PI*(layer.motion==='cross'?2:1)+angle;x+=Math.cos(angle)*spread*.25;}
   if(layer.motion==='expand'||layer.motion==='pulse')scale=.5+Math.sin(progress*Math.PI/2)*.7;
   if(layer.motion==='shrink')scale=1-progress*.7;
   if(view.reducedMotion){rotation=0;if(!moving){x=target.x+Math.cos(angle)*spread*.4;y=target.y+Math.sin(angle)*spread*.2;}}
   if(moving&&p.index===0){c.save();c.globalAlpha=alpha*.5;c.beginPath();c.moveTo(p.origin.x,p.origin.y);c.quadraticCurveTo((p.origin.x+x)/2,Math.min(p.origin.y,y)-size*.25,x,y);c.lineCap='round';c.lineWidth=size*.025;c.strokeStyle=recipe.color;c.stroke();c.restore();this.stats.draws++;}
   const extent=size*layer.size*scale;c.globalAlpha=alpha*layer.opacity;c.save();c.translate(x,y);c.rotate(rotation);c.scale(1,layer.ground?.24:1);c.drawImage(p.stamp,-extent/2,-extent/2,extent,extent);c.restore();this.stats.active++;this.stats.draws++;
  }
  // Persistent status keywords sit beside the foot, below faces and labels.
  for(const actor of view.actors){if(actor.hp<=0)continue;const feet=this.socket(actor.id,'feet'),head=this.socket(actor.id,'head');if(!feet||!head)continue;const size=Math.abs(feet.y-head.y)/.77,statuses=view.cardStatuses?.[actor.id]??[];let index=0;
   for(const entry of statuses){const id=typeof entry==='string'?entry:entry.id,spec=PAINTED_STATUSES.find(s=>s.id===id);if(!spec)continue;const stamp=this.stamps.get('status:'+id,spec.color);if(!stamp)continue;const n=statuses.length,extent=size*.19,x=feet.x+(index-(n-1)/2)*size*.17,y=feet.y-size*.09+(view.reducedMotion?0:Math.sin(time*2+index)*size*.012);c.globalAlpha=.85;c.drawImage(stamp,x-extent/2,y-extent/2,extent,extent);index++;this.stats.draws++;}
  }
  if(this.hitFrames>0&&view.frame){const recipe=paintedRecipe(view.frame.plan.presentationId??view.frame.plan.skillId);if(recipe&&!recipe.friendly){const stamp=this.stamps.get('spark',PAINT.cream)!;for(const id of view.frame.plan.targetIds){const point=this.socket(id,'vfxOrigin'),feet=this.socket(id,'feet'),head=this.socket(id,'head');if(point&&feet&&head){const size=Math.abs(feet.y-head.y)*.42;c.globalAlpha=.7;c.drawImage(stamp,point.x-size/2,point.y-size/2,size,size);this.stats.draws++;}}}if(!view.paused)this.hitFrames--;}
  this.overrides.render(time,(image,id,spec)=>{const point=this.socket(id,spec.socket),feet=this.socket(id,'feet'),head=this.socket(id,'head');if(!point||!feet||!head)return;const unit=Math.abs(feet.y-head.y)/.77,extent=unit*(spec.format==='spine'?Math.max(spec.height,spec.width):spec.height)*spec.scale/512,aspect=spec.format==='spine'?1:spec.width/spec.height;c.globalAlpha=1;c.drawImage(image,point.x-extent*aspect/2,point.y-extent/2,extent*aspect,extent);this.stats.draws++;});this.stats.override=this.overrides.stats.active;
  c.restore();c.globalAlpha=1;this.stats.peak=Math.max(this.stats.peak,this.stats.active);
 }
 clear(){this.overrides.clear();for(const p of this.pool)p.active=false;this.hitFrames=0;this.plan=null;}
 dispose(){this.clear();this.stamps.dispose();this.overrides.dispose();this.canvas.remove();}
}
