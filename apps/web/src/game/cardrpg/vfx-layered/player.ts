import type {SceneView} from '../../squad/turn3d/scene';
import type {EffectPlan} from '../../squad/turn3d/effects';
import type {SpineSocket} from '../spine/config';
import {paintedTargets} from '../spine/vfx-registry';
import {chargeEvent} from '../depth/card-action-plan';
import {stageLayoutC2} from '../stage/layout-c2';
import {samplePaint,paintTime,validatePaint,type PaintTimeline} from './timeline';
import {packPaintSheets,type PackedPaint} from './atlas';

const manifests=import.meta.glob('../../../../../../assets/cardrpg-look/vfx-layered/*.json',{eager:true,import:'default'}) as Record<string,PaintTimeline>;
const textures=import.meta.glob('../../../../../../assets/cardrpg-look/vfx-layered/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const PAINT_TIMELINES=new Map(Object.values(manifests).map(t=>[t.id,validatePaint(t)]));
type Point={x:number;y:number};
export class LayeredVfx {
 readonly images=new Map<string,PackedPaint>();
 readonly stats={draws:0,active:0,failed:[] as string[]};
 readonly ready:Promise<void>;
 enabled=true;onlyLayers:Set<string>|null=null;
 private disposed=false;
 constructor(private socket:(id:string,socket:SpineSocket)=>Point|undefined){
  const groups=new Map<string,{id:string;url:string}[]>();
  for(const [id,timeline] of PAINT_TIMELINES){
   const url=Object.entries(textures).find(([path])=>path.endsWith('/'+id.replaceAll(':','-')+'.webp'))?.[1];
   if(!url){this.stats.failed.push(id);continue;}
   const group=groups.get(timeline.owner)??[];group.push({id,url});groups.set(timeline.owner,group);
  }
  this.ready=Promise.all([...groups.values()].map(async entries=>{
   try{const packed=await packPaintSheets(entries,()=>this.disposed);for(const [id,image] of packed)this.images.set(id,image);}
   catch{this.stats.failed.push(...entries.map(e=>e.id));}
  })).then(()=>{});
 }
 handles(plan:EffectPlan){const id=plan.presentationId??plan.skillId;return this.enabled&&this.images.has(id)&&PAINT_TIMELINES.has(id);}
 /** Decode and upload the atlas before its first combat impact. */
 warm(c:CanvasRenderingContext2D){c.save();for(const image of new Set([...this.images.values()].map(p=>p.image)))c.drawImage(image,0,0,8,8);c.restore();c.clearRect(0,0,8,8);}
 render(c:CanvasRenderingContext2D,view:SceneView,width:number,height:number){
  this.stats.draws=0;this.stats.active=0;
  const frame=view.frame;if(!frame)return;
  if(this.handles(frame.plan))this.renderClip(c,view,width,height,frame.plan.presentationId??frame.plan.skillId);
  for(const id of frame.plan.presentationCues??[]){
   const target=frame.plan.presentationCueTargets?.[id]??frame.plan.actorId;
   if(this.images.has(id)&&PAINT_TIMELINES.has(id))this.renderClip(c,view,width,height,id,target);
  }
 }
 private renderClip(c:CanvasRenderingContext2D,view:SceneView,width:number,height:number,id:string,passiveTarget?:string){
  const frame=view.frame!,plan=frame.plan,timeline=PAINT_TIMELINES.get(id)!,image=this.images.get(id)!;
  if(passiveTarget&&frame.elapsed<plan.beats[2]!.start)return;
  const at=passiveTarget?timeline.impact+(frame.elapsed-plan.beats[2]!.start)*(view.reducedMotion?2:1):paintTime(timeline,frame.elapsed,plan.duration,plan.beats[2]!.start,view.reducedMotion);
  const charging=!passiveTarget&&!!chargeEvent(plan);
  const targets:string[]=[];
  if(passiveTarget||charging)targets.push(passiveTarget??plan.actorId);
  else paintedTargets(plan,timeline.friendly?'friendly':'hostile',view.actors,targets);
  const caster=view.actors.find(a=>a.id===(passiveTarget??plan.actorId));if(!caster)return;
  const fallback=stageLayoutC2(view.actors.map(a=>({id:a.id,side:a.side,row:view.rows?.[a.id]==='rear'?'rear':'front',aspect:1})),width,height);
  const point=(id:string,socket:SpineSocket):Point|undefined=>{const live=this.socket(id,socket);if(live)return live;const box=fallback.get(id);return box?{x:box.footX,y:socket==='feet'?box.footY:box.footY-box.height*.45}:undefined;};
  const facing=caster.side==='party'?1:-1;
  for(const layer of timeline.layers){
   if(charging&&!['charge-glow','core-shape','sparks','residue'].includes(layer.name))continue;
   if(this.onlyLayers&&!this.onlyLayers.has(layer.name)||view.reducedMotion&&layer.flash)continue;
   const key=samplePaint(layer,at);if(!key||key.alpha<=0)continue;
   const recipients=layer.anchor==='caster'?[caster.id]:targets;
   for(const id of recipients){
    let p=point(id,layer.socket);const feet=point(id,'feet'),head=point(id,'head');if(!p||!feet)continue;
    const unit=head?Math.max(height*.16,Math.abs(feet.y-head.y)/.77):height*.31;
    // Keep a small passive motif around the lower body, clear of the face mask.
    if(passiveTarget&&layer.socket!=='feet')p={x:feet.x,y:feet.y-unit*.28};
    if(layer.anchor==='flight'&&!charging&&!passiveTarget){const source=point(caster.id,'mainHand');if(!source)continue;const progress=Math.max(0,Math.min(1,(at-layer.start)/Math.max(1,timeline.impact-layer.start)));p={x:source.x+(p.x-source.x)*progress,y:source.y+(p.y-source.y)*progress-Math.sin(progress*Math.PI)*unit*.18};}
    const region=layer.flipbook?.regions[Math.min(layer.flipbook.regions.length-1,Math.floor((at-layer.start)/1000*layer.flipbook.fps))]??layer.region;
    const extent=unit*layer.size*(passiveTarget?.75:charging?.7:1),rotation=view.reducedMotion?0:key.rotate;
    c.save();c.globalCompositeOperation=layer.blend==='add'?'lighter':layer.blend==='screen'?'screen':'source-over';c.globalAlpha=key.alpha;
    c.translate(p.x+key.x*unit*facing,p.y+key.y*unit);c.rotate(rotation*facing);c.scale(key.sx*facing,key.sy);
    c.drawImage(image.image,image.x+region[0],image.y+region[1],region[2],region[3],-extent/2,-extent/2,extent,extent);c.restore();this.stats.draws++;this.stats.active++;
   }
  }
 }
 dispose(){this.disposed=true;for(const image of new Set([...this.images.values()].map(p=>p.image)))image.width=image.height=1;this.images.clear();}
}
