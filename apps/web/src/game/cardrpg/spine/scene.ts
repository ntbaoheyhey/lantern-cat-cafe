import {BattlePostFx} from '../battle-v3/post-fx';
import {BattleAudio} from '../battle-v3/battle-audio';
import {CinematicPlayer} from '../battle-v3/cinematic-player';
import {sequenceAt,sequenceWorldTime} from '../battle-v3/sequence';
import * as T from 'three';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { SceneView, Anchor } from '../../squad/turn3d/scene';
import type { EffectPlan } from '../../squad/turn3d/effects';
import { layoutLabels, intersects, type Rect, type LabelInput } from '../../squad/turn3d/label-layout';
import {BattleNumbers as PuppetNumbers} from '../battle-v3/numbers';
import {BodyFx} from '../battle-v3/body-fx';
import {bodyStatuses} from '../battle-v3/status';
import {bodyTint} from '../battle-v3/clarity';
import {actionPose,actionCamera,attackMotion,hitPose,idlePhase,neutralPose,type MotionPoint} from '../battle-v3/motion';
import {MotionTrails} from '../battle-v3/motion-trails';
import {BossPhase} from '../battle-v3/boss-phase';
import { loadSpineActor, type SpineActor, spineCacheStats } from './assets';
import { SPINE_SKILLS, type SpineSocket } from './config';
import { retimedClipTime, type SpineCue } from './events';
import { stagePosition } from './layout';
import { stageLayoutC2 } from '../stage/layout-c2';
import {unitCore,ELEMENT_COLORS} from '../stage/core';
import { PaintedStage } from './stage';
import { PAINT } from './style';
import { PaintedVfx } from './vfx';
import { cinematicBox, ultimateFocus, fitStageCamera } from './cinematics';
import { chargeEvent } from '../depth/card-action-plan';

interface DisplayActor {actor:SpineActor;asset:string;entered:number;hurtAt:number;koAt:number;phaseAt:number;phase:number;lane:number;entranceDone:boolean;shadow:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;ring:T.Mesh<T.RingGeometry,T.MeshBasicMaterial>;hit:T.Mesh<T.RingGeometry,T.MeshBasicMaterial>}
/** A6-compatible renderer. Rules and their impact snapshot remain owned by DepthModel. */
export class SpineScene {
 private audio=new BattleAudio();
 readonly scene=new T.Scene();readonly camera=new T.OrthographicCamera(-1,1,1,0,.1,1000);
 readonly renderer:T.WebGLRenderer;readonly actors=new Map<string,DisplayActor>();
 readonly loading={completed:0,total:1,label:'Lighting the lanterns…'};ready=false;
 readonly stats={frames:0,calls:0,triangles:0,geometries:0,textures:0,particles:0,estimatedGpuBytes:0,loaded:0,hiddenFrames:0,quality:'high' as 'high'|'medium'|'low'};
 readonly labelAudit:{heads:Rect[];cards:Rect[];missing:string[];overlaps:number}={heads:[],cards:[],missing:[],overlaps:0};
 private cinematicRects:Rect[]=[];
 readonly eventAudit:{actorId:string;name:string;fallback:boolean;skillId:string;elapsed:number}[]=[];
 readonly motionAudit:{id:string;asset:string;homeX:number;homeY:number;x:number;y:number;dx:number;dy:number;phase:string;archetype:string;hitOffset:number;flash:number}[]=[];
 readonly anchors:Anchor[]=[];
 readonly cinematic={ultimateVisible:false,actorId:'',box:null as Rect|null,phaseVisible:false,phaseText:'',phaseBox:null as Rect|null,focus:0};
 private stage=new PaintedStage(()=>this.invalidate());private numbers:PuppetNumbers;readonly effects:PaintedVfx;private resize:ResizeObserver;
 private disposed=false;private pending=new Map<string,symbol>();private failed=new Set<string>();private lanes=new Map<string,{side:string;lane:number}>();private raf=0;private last=0;private time=0;private dirty=true;
 private width=1;private height=1;private worldWidth=1;private scratch=new T.Vector3();
 private plan:EffectPlan|null=null;private firstHit=false;private ultimate=false;private castAt=-100;private hitAt=-100;private currentView?:SceneView;private renderTime=0;
 private c2Seats=new Map<string,number>();private c2Capacity=4;
 private battleKey:unknown;private ultStartedAt=-100;private ultEndedAt=-100;private phaseNoticeAt=-100;
 private hitstopUntil=0;private sampled=new Map<string,{name:string;key:unknown;at:number}>();
 private framing={zoom:1,x:0};
 private homes=new Map<string,{x:number;y:number;scale:number;order:number;point:MotionPoint}>();
 private trails=new MotionTrails();
 private bossPhase:BossPhase;
 private postFx:BattlePostFx;readonly cinema:CinematicPlayer;private bodyFx:BodyFx;private shadowTexture:T.CanvasTexture;private geometry=new T.PlaneGeometry(1,1);private ringGeometry=new T.RingGeometry(.87,1,48);
 private lost=(event:Event)=>{event.preventDefault();this.onFailure('The cafe canvas needs a reload. Battle controls remain available.');};
 private visibility=()=>{this.last=0;this.dirty=true;};
 private pick=(event:PointerEvent)=>{const box=this.renderer.domElement.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;for(const unit of this.sizeAudit().units){if(x>=unit.box.x&&x<=unit.box.x+unit.box.width&&y>=unit.box.y&&y<=unit.box.y+unit.box.height){this.onTarget(unit.id);break;}}};
 constructor(private host:HTMLElement,readonly view:()=>SceneView,private onAnchors:(anchors:Anchor[])=>void,private onTarget:(id:string)=>void,private onFailure:(message:string)=>void){
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:true});
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  this.renderer.setClearColor(PAINT.wall);this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Painted 2D cafe battlefield');this.renderer.domElement.dataset.lookSpine='true';
  this.renderer.domElement.addEventListener('webglcontextlost',this.lost);this.renderer.domElement.addEventListener('pointerup',this.pick);host.appendChild(this.renderer.domElement);
  this.effects=new PaintedVfx(host,(id,socket)=>this.socket(id,socket),id=>this.pixelsPerUnit(id));this.numbers=new PuppetNumbers(host);this.bodyFx=new BodyFx(host);this.bossPhase=new BossPhase(host);this.camera.position.set(0,0,100);this.scene.add(this.stage.root,this.trails.root);this.postFx=new BattlePostFx(this.renderer,this.scene,this.camera);this.cinema=new CinematicPlayer(host);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const c=canvas.getContext('2d')!;c.scale(1,.5);
  const glow=c.createRadialGradient(64,64,1,64,64,64);glow.addColorStop(0,'#49333a70');glow.addColorStop(.55,'#49333a38');glow.addColorStop(1,'#49333a00');c.fillStyle=glow;c.fillRect(0,0,128,128);this.shadowTexture=new T.CanvasTexture(canvas);this.shadowTexture.colorSpace=T.SRGBColorSpace;
  this.resize=new ResizeObserver(()=>this.invalidate());this.resize.observe(host);document.addEventListener('visibilitychange',this.visibility);
  this.ensureActors(this.view());this.raf=requestAnimationFrame(this.loop);
 }
 invalidate(){this.dirty=true;}
 prepare(view=this.view()){this.ensureActors(view);this.invalidate();}
 private ensureActors(view:SceneView){
  if(this.disposed)return;
  if(view.battleKey!==undefined&&view.battleKey!==this.battleKey){
   this.c2Seats?.clear();this.c2Capacity=4;this.homes.clear();
   this.battleKey=view.battleKey;this.plan=null;this.sampled.clear();this.effects.clear();this.ultimate=false;this.ultStartedAt=-100;this.ultEndedAt=-100;this.phaseNoticeAt=-100;
   for(const [id,entry] of this.actors){entry.entered=this.time+entry.lane*PAINT.entranceStagger;entry.entranceDone=false;entry.hurtAt=-100;entry.koAt=-1;entry.phaseAt=-100;entry.phase=view.bossPhases?.[id]??1;}
  }
  const ids=new Set(view.actors.map(a=>a.id));
  for(const [id,entry] of this.actors)if(!ids.has(id)){this.releaseActor(entry);this.actors.delete(id);this.homes.delete(id);}
  // Removed requests no longer reserve a slot or hold the current roster's
  // loading gate. A request token also handles remove/return before completion.
  for(const id of this.lanes.keys())if(!ids.has(id)){this.lanes.delete(id);this.pending.delete(id);this.failed.delete(id);this.sampled.delete(id);}
  // Crew order is shared with the HP/rage cards. A retained cat must move to
  // its new slot when the roster changes; enemy identity lanes remain stable.
  let partyLane=0;
  for(const unit of view.actors)if(unit.side==='party'){
   const assigned=this.lanes.get(unit.id),entry=this.actors.get(unit.id);
   if(assigned)assigned.lane=partyLane;else this.lanes.set(unit.id,{side:'party',lane:partyLane});
   if(entry)entry.lane=partyLane;partyLane++;
  }
  for(const unit of view.actors){
   if(this.actors.has(unit.id)||this.pending.has(unit.id)||this.failed.has(unit.id))continue;
   const request=Symbol(unit.id);this.pending.set(unit.id,request);this.ready=false;
   const occupied=[...this.lanes.values()].filter(a=>a.side===unit.side).map(a=>a.lane);let lane=unit.side==='party'?this.lanes.get(unit.id)!.lane:0;if(unit.side==='enemy')while(occupied.includes(lane))lane++;this.lanes.set(unit.id,{side:unit.side,lane});
   const asset=view.models?.[unit.id]??unit.cardRpg?.cardId??'mochi';
   void loadSpineActor(asset).then(actor=>{
    if(this.disposed||this.pending.get(unit.id)!==request||!this.view().actors.some(a=>a.id===unit.id)){actor.dispose();return;}
    const shadow=new T.Mesh(this.geometry,new T.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));shadow.renderOrder=-10;
    const ring=new T.Mesh(this.ringGeometry,new T.MeshBasicMaterial({color:PAINT.honey,transparent:true,opacity:.6,depthTest:false,depthWrite:false,toneMapped:false}));ring.renderOrder=-5;
    const hit=new T.Mesh(this.ringGeometry,new T.MeshBasicMaterial({color:PAINT.cream,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false}));hit.renderOrder=80;
    lane=this.lanes.get(unit.id)?.lane??lane;
    const entry={actor,asset,entered:this.time+lane*PAINT.entranceStagger,hurtAt:-100,koAt:-1,phaseAt:-100,phase:view.bossPhases?.[unit.id]??1,lane,entranceDone:false,shadow,ring,hit};this.actors.set(unit.id,entry);
    actor.onCue=cue=>this.onCue(unit.id,cue);this.scene.add(actor.root,shadow,ring,hit);
    this.invalidate();
   }).catch(error=>{
    if(this.disposed||this.pending.get(unit.id)!==request||!this.view().actors.some(a=>a.id===unit.id))return;
    this.failed.add(unit.id);this.onFailure(`Could not prepare ${asset}: ${String(error)}`);
   }).finally(()=>{if(this.pending.get(unit.id)===request)this.pending.delete(unit.id);if(!this.disposed)this.refreshLoading();});
  }
  this.refreshLoading();
 }
 private refreshLoading(){
  this.loading.completed=this.actors.size;this.loading.total=this.actors.size+this.pending.size+this.failed.size;this.stats.loaded=this.actors.size;
  this.ready=this.pending.size===0&&this.failed.size===0;
 }
 private onCue(actorId:string,cue:SpineCue){
  const view=this.currentView??this.view(),frame=view.frame,actor=this.actors.get(actorId)?.actor;if(!frame||actorId!==frame.plan.actorId||!actor)return;
  this.effects.cue(cue,frame,this.renderTime,view.playbackSpeed??1,view.actors,actor.cues());
  this.eventAudit.push({actorId,name:cue.name,fallback:cue.fallback,skillId:frame.plan.skillId,elapsed:frame.elapsed});if(this.eventAudit.length>240)this.eventAudit.shift();
  if(cue.name==='ult-start'){this.ultimate=true;this.ultStartedAt=this.renderTime;this.ultEndedAt=-100;this.cinematic.actorId=actorId;}
  if(cue.name==='ult-end'){this.ultimate=false;this.ultEndedAt=this.renderTime;}
  if(cue.name==='cast')this.castAt=this.renderTime;
  if(cue.name==='hit'){
   this.firstHit=true;
   if(frame.plan.events.some(e=>e.type==='damage')){
    this.hitAt=this.renderTime;
    if(!view.reducedMotion&&view.fixedTime===undefined)this.hitstopUntil=performance.now()+(sequenceAt(frame.plan,frame.elapsed)?.seq.tier==='ultimate'?100:PAINT.hitstopMs);
   }
   for(const id of frame.plan.targetIds){const target=this.actors.get(id);if(target&&frame.plan.events.some(e=>e.targetIds.includes(id)&&e.type==='damage'))target.hurtAt=this.renderTime;}
  }
 }
 private loop=(now:number)=>{
  if(this.disposed)return;const delta=this.last?Math.min(.1,(now-this.last)/1000):0;this.last=now;const view=this.view();
  if(document.hidden||view.suspended){this.stats.hiddenFrames++;this.raf=requestAnimationFrame(this.loop);return;}
  this.ensureActors(view);if(!view.paused&&this.ready)this.time+=delta*(view.playbackSpeed??1);
  if(!view.paused||this.dirty){this.render(view,delta);this.dirty=false;}
  this.raf=requestAnimationFrame(this.loop);
 };
 render(view:SceneView,delta=0){
  const width=Math.max(1,this.host.clientWidth),height=Math.max(1,this.host.clientHeight);
  if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.renderer.setSize(width,height);this.postFx.resize(width,height);this.worldWidth=PAINT.worldHeight*width/height;}
  const time=view.fixedTime??this.time,frame=view.frame,plan=frame?.plan??null;this.currentView=view;this.renderTime=time;
  const sequence=frame?sequenceAt(frame.plan,frame.elapsed,view.reducedMotion):null;
  this.effects.useLayered=!!view.formationC2&&view.layeredVfx!==false;
  if(this.plan!==plan){this.plan=plan;this.firstHit=false;this.ultimate=false;this.ultStartedAt=-100;this.ultEndedAt=-100;this.castAt=-100;this.hitAt=-100;this.hitstopUntil=0;}
  if(frame&&!this.actors.has(frame.plan.actorId)&&frame.elapsed>=frame.plan.beats[2]!.start)this.firstHit=true;
  this.camera.left=-this.worldWidth/2;this.camera.right=this.worldWidth/2;this.camera.top=PAINT.worldHeight;this.camera.bottom=0;this.camera.zoom=1;this.camera.position.x=0;this.camera.position.y=0;
  if(!view.reducedMotion&&this.hitAt>time-.10){this.camera.position.x=Math.sin((time-this.hitAt)*105)*PAINT.shake*(1-(time-this.hitAt)/.1);}
  this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  const activeEnemies=view.actors.filter(u=>u.side==='enemy'&&u.hp>0);
  if(activeEnemies.length>4)this.c2Capacity=6;
  if(view.formationC2)for(const unit of activeEnemies){
   if(this.c2Seats.has(unit.id))continue;
   const occupied=new Set(activeEnemies.filter(u=>u.id!==unit.id).map(u=>this.c2Seats.get(u.id)));
   const row=view.rows?.[unit.id]==='rear'?2:0;
   const choices=view.boss?[2,3]:[row,row+1,...[4,5,0,1,2,3].filter(i=>i!==row&&i!==row+1)];
   if(this.actors.get(unit.id)?.actor.unit.tier!=='boss')this.c2Seats.set(unit.id,choices.find(i=>!occupied.has(i))??row);
  }
  const layout=view.formationC2?stageLayoutC2(view.actors.flatMap(unit=>{
   const entry=this.actors.get(unit.id);
   return entry&&(unit.side==='party'||unit.hp>0)?[{id:unit.id,side:unit.side,row:view.rows?.[unit.id]==='rear'?'rear' as const:'front' as const,
    boss:entry.actor.unit.tier==='boss',aspect:entry.actor.bounds.width/entry.actor.bounds.height,coreHeight:unitCore(entry.asset,entry.actor.bounds).world.height/entry.actor.bounds.height,coreRatio:unitCore(entry.asset,entry.actor.bounds).ratio,bossRatio:unitCore(entry.asset,entry.actor.bounds).ratio,seat:unit.side==='enemy'?this.c2Seats.get(unit.id):undefined}]:[];
  }),this.worldWidth,PAINT.worldHeight,PAINT.worldHeight*(width<700?width*9/16:window.innerHeight)/height,this.c2Capacity):null;
  const pixelsToWorld=this.worldWidth/width;
  // Resolve all resting positions first, so target selection is independent of draw order.
  for(const unit of view.actors){
   const entry=this.actors.get(unit.id);if(!entry)continue;
   if(unit.hp<=0&&this.homes.has(unit.id))continue;
   const actor=entry.actor,core=unitCore(entry.asset,actor.bounds),box=layout?.get(unit.id),facing=unit.side==='enemy'?-1:1;
   const base=stagePosition(unit.side,entry.lane,actor.unit.tier==='boss',view.boss,this.worldWidth);
   if(box){base.scale=box.coreHeight/core.world.height;base.x=box.footX-this.worldWidth/2-(actor.bounds.x+actor.bounds.width/2)*base.scale*facing;base.y=PAINT.worldHeight-box.footY-core.world.y*base.scale;}
   this.homes.set(unit.id,{...base,order:box?box.order:10+Math.round((1-base.y/PAINT.worldHeight)*30),point:{x:(base.x+(actor.bounds.x+actor.bounds.width/2)*base.scale*facing+this.worldWidth/2)/pixelsToWorld,y:(PAINT.worldHeight-base.y-core.world.y*base.scale)/pixelsToWorld,core:core.world.height*base.scale/pixelsToWorld}});
  }
  this.motionAudit.length=0;this.trails.root.visible=false;
  const ordered=[...view.actors].sort((a,b)=>Number(b.id===plan?.actorId)-Number(a.id===plan?.actorId));
  for(const unit of ordered){
   const entry=this.actors.get(unit.id);if(!entry)continue;const actor=entry.actor,boss=actor.unit.tier==='boss',position=stagePosition(unit.side,entry.lane,boss,view.boss,this.worldWidth);
   const core=unitCore(entry.asset,actor.bounds);
   const rear=view.rows?.[unit.id]==='rear';
   const tint=bodyTint(bodyStatuses(view.cardStatuses?.[unit.id],unit.shield),time,rear,view.reducedMotion);
   const home=this.homes.get(unit.id)!;Object.assign(position,home);
   if(unit.hp>0)entry.koAt=-1;
   else if(entry.koAt<0)entry.koAt=time;
   const deathAge=unit.hp<=0?time-entry.koAt:0;
   actor.root.traverse(node=>{if(node instanceof T.Mesh){const material=node.material as T.MeshBasicMaterial;material.color.setRGB(...tint);material.opacity=unit.hp<=0?Math.max(0,1-deathAge/.6):1;}});
   actor.root.visible=unit.hp>0||deathAge<.6;
   actor.root.rotation.z=0;actor.root.position.set(position.x,position.y,0);actor.root.scale.set((unit.side==='enemy'?-1:1)*position.scale,position.scale,1);actor.setOrder(home.order);
   entry.shadow.position.set(position.x,position.y-8,-2);entry.shadow.scale.set(Math.min(actor.bounds.width,actor.unit.targetHeight)*position.scale*1.12,core.world.height*position.scale*.13,1);
   entry.ring.visible=unit.hp>0;entry.ring.position.copy(entry.shadow.position);entry.ring.scale.set(core.world.height*position.scale*.38,core.world.height*position.scale*.095,1);entry.ring.material.color.set(ELEMENT_COLORS[entry.asset]??PAINT.rose);
   const phase=view.bossPhases?.[unit.id]??1;
   if(phase>entry.phase){entry.phase=phase;entry.phaseAt=time;this.phaseNoticeAt=time;this.cinematic.phaseText=`${unit.name} · Phase ${phase}`;this.effects.accent(unit.id,'phase',time,view.playbackSpeed??1);}
   if(!entry.entranceDone&&(view.galleryPreview||time-entry.entered>=actor.duration('appear')*.8)){
    entry.entranceDone=true;if(!view.galleryPreview&&!view.reducedMotion)this.effects.accent(unit.id,'entrance',time,view.playbackSpeed??1);
   }
   const worldTime=sequence&&frame?time-frame.elapsed/1000+sequenceWorldTime(sequence.seq,frame.elapsed)/1000:time;
   const phaseOffset=idlePhase(unit.id);
   let name='idle',key:unknown='idle',at=(worldTime+phaseOffset)%actor.duration('idle');
   if(view.model){name=({ultimate:'ult',cast:'skill',hit:'hurt',KO:'ko'} as Record<string,string>)[view.model.clip]??view.model.clip;at=(view.modelProgress??0)*actor.duration(name);key=name;}
   else if(frame&&unit.id===frame.plan.actorId){
    name=chargeEvent(frame.plan)?'skill':SPINE_SKILLS.get(frame.plan.presentationId??frame.plan.skillId)?.animation??(frame.plan.ultimate?'ult':frame.clip==='attack'?'attack':'skill');key=frame.plan;
    const authored=sequence?.seq.casterAnim.filter(k=>k.t<=frame.elapsed&&k.name).at(-1)?.name;
    if(authored&&!chargeEvent(frame.plan))name=authored;
    const duration=actor.duration(name),hit=actor.cues(name).find(c=>c.name==='hit')?.time??duration*.55;
    at=retimedClipTime(frame.actionProgress,duration,hit,frame.plan.beats[2]!.start/frame.plan.duration);
   }else if(unit.hp<=0){if(entry.koAt<0)entry.koAt=time;name='ko';key=entry.koAt;at=time-entry.koAt;}
   else if(time-entry.hurtAt<actor.duration('hurt')){name='hurt';key=entry.hurtAt;at=time-entry.hurtAt;}
   else if(time-entry.phaseAt<actor.duration('enrage')&&actor.clips.has('enrage')){name='enrage';key=entry.phaseAt;at=time-entry.phaseAt;}
   else if(time-entry.entered<actor.duration('appear')&&!view.galleryPreview&&!view.reducedMotion){name='appear';key=entry.entered;at=Math.max(0,time-entry.entered);}
   else if(entry.phase>1&&actor.clips.has('idle-phase2')){name='idle-phase2';key=name;at=time%actor.duration(name);}
   const statuses=bodyStatuses(view.cardStatuses?.[unit.id]);
   if(unit.hp>0&&name==='idle'&&statuses.includes('stun')&&actor.clips.has('stunned')){name='stunned';key=name;at=worldTime%actor.duration(name);}
   const previous=this.sampled.get(unit.id),iced=statuses.includes('freeze'),frozen=iced||!view.reducedMotion&&view.fixedTime===undefined&&performance.now()<this.hitstopUntil;
   if(iced&&unit.hp>0&&previous){name=previous.name;key=previous.key;at=previous.at;}
   else if(frozen&&previous&&previous.name===name&&previous.key===key)at=previous.at;
   if(actor.mesh&&!frozen)actor.mesh.proceduralTime=worldTime+phaseOffset;
   actor.sample(name,key,at,delta,this.camera,view.reducedMotion);
   let rootPose=neutralPose(),reaction=neutralPose();
   const caster=plan?view.actors.find(a=>a.id===plan.actorId):undefined;
   const targetId=plan?.targetIds.find(id=>view.actors.some(a=>a.id===id&&a.side!==unit.side))??plan?.targetIds.find(id=>id!==unit.id);
   const target=this.homes.get(targetId??'')?.point??{...home.point,x:home.point.x+(unit.side==='enemy'?-1:1)*width*.30};
   const input=frame?{plan:frame.plan,elapsed:frame.elapsed,asset:entry.asset,side:unit.side,home:home.point,target,width,height}:null;
   if(!view.reducedMotion&&!view.model&&!iced){
    if(input&&unit.id===plan?.actorId&&unit.hp>0)rootPose=actionPose(input);
    const from=this.homes.get(caster?.id??'')?.point.x??(unit.side==='enemy'?0:width);
    reaction=hitPose(plan,frame?.elapsed??0,unit.id,home.point.x>=from?1:-1,height);
    if(rootPose.phase==='idle'&&unit.hp>0){const breath=Math.sin(worldTime*2.1+phaseOffset);rootPose.sx=1-breath*.006;rootPose.sy=1+breath*.010;}
    if(unit.hp<=0){const fall=Math.min(1,deathAge/.4);rootPose.angle=(unit.side==='enemy'?-1:1)*fall*.9;rootPose.y=fall*12*height/720;}
   }
   const dx=rootPose.x+reaction.x,dy=rootPose.y+reaction.y,sx=rootPose.sx*reaction.sx,sy=rootPose.sy*reaction.sy,angle=rootPose.angle+reaction.angle;
   // Pivot the complete cut-out around its measured feet; sockets and labels follow.
   const facing=unit.side==='enemy'?-1:1,footX=(actor.bounds.x+actor.bounds.width/2)*position.scale*facing,footY=core.world.y*position.scale;
   actor.root.scale.set(facing*position.scale*sx,position.scale*sy,1);actor.root.rotation.z=-angle;
   const cos=Math.cos(-angle),sin=Math.sin(-angle);
   actor.root.position.set(position.x+footX-(cos*footX*sx-sin*footY*sy)+dx*pixelsToWorld,position.y+footY-(sin*footX*sx+cos*footY*sy)-dy*pixelsToWorld,0);
   actor.root.updateMatrixWorld(true);
   entry.shadow.position.x+=dx*pixelsToWorld;entry.shadow.position.y-=Math.max(0,dy)*pixelsToWorld;entry.shadow.material.opacity=unit.hp<=0?Math.max(0,1-deathAge/.6):1;
   entry.ring.position.copy(entry.shadow.position);
   if(reaction.flash)actor.root.traverse(node=>{if(node instanceof T.Mesh)(node.material as T.MeshBasicMaterial).color.lerp(new T.Color(2,2,2),.72);});
   if(input&&unit.id===plan?.actorId&&unit.hp>0&&!view.reducedMotion){
    this.trails.render(actor.root,[1,2,3].map(i=>actionPose({...input,elapsed:input.elapsed-i*1000/30})),rootPose,pixelsToWorld);
   }
   const measured=actor.root.localToWorld(this.scratch.set(actor.bounds.x+actor.bounds.width/2,core.world.y,0)),mx=(measured.x+this.worldWidth/2)/pixelsToWorld,my=(PAINT.worldHeight-measured.y)/pixelsToWorld;
   this.motionAudit.push({id:unit.id,asset:entry.asset,homeX:home.point.x,homeY:home.point.y,x:mx,y:my,dx:mx-home.point.x,dy:my-home.point.y,phase:rootPose.phase,archetype:plan?attackMotion(entry.asset,plan):'idle',hitOffset:Math.abs(reaction.x),flash:reaction.flash});
   if(previous){previous.name=name;previous.key=key;previous.at=at;}else this.sampled.set(unit.id,{name,key,at});
   const since=time-this.hitAt,hitActive=this.firstHit&&!!plan?.targetIds.includes(unit.id)&&since>=0&&since<.32;
   entry.hit.visible=false;if(hitActive){actor.socket('vfxOrigin',entry.hit.position);entry.hit.scale.setScalar((.2+since)*actor.unit.targetHeight);entry.hit.material.opacity=(1-since/.32)*.65;}
   if(unit.id===plan?.actorId&&time-this.castAt<.4){entry.ring.visible=true;entry.ring.material.opacity=.3+.3*Math.sin((time-this.castAt)/.4*Math.PI);}else entry.ring.material.opacity=.3;
  }
  const focus=ultimateFocus(time,this.ultStartedAt,this.ultEndedAt,this.ultimate);this.cinematic.focus=focus;
  const maxZoom=view.formationC2?1:Math.min(PAINT.maxZoom,...[...this.actors.values()].filter(e=>e.actor.unit.tier==='boss').map(e=>.55*PAINT.worldHeight/e.actor.bounds.height));
  this.camera.zoom=1;
  if(!view.reducedMotion&&focus>0){
   let left=Infinity,right=-Infinity;
   for(const {actor} of this.actors.values()){
    const b=actor.framingBounds(),root=actor.root,x=root.position.x+b.x*root.scale.x,end=x+b.width*root.scale.x;
    left=Math.min(left,x,end);right=Math.max(right,x,end);
   }
   const framing=fitStageCamera(this.worldWidth,left,right,1+(maxZoom-1)*focus,PAINT.framingMargin*focus+PAINT.shake,this.framing);
   this.camera.zoom=framing.zoom;this.camera.position.x+=framing.x;
  }
  // Track the acting pair through anticipation, contact and recovery. Ultimate
  // plates keep their authored camera; reduced motion keeps a stationary field.
  if(frame){
   const actor=plan&&view.actors.find(a=>a.id===plan.actorId),home=actor&&this.homes.get(actor.id)?.point;
   const targetId=plan?.targetIds.find(id=>view.actors.some(a=>a.id===id&&a.side!==actor?.side))??plan?.targetIds[0];
   const target=this.homes.get(targetId??'')?.point??home;
   const tier=sequence?.seq.tier??(frame.plan.ultimate?'ultimate':frame.clip==='special'||frame.clip==='telegraph'?'active':'basic');
   const camera=actor&&home&&target&&tier!=='ultimate'?actionCamera({plan:frame.plan,elapsed:frame.elapsed,asset:this.actors.get(actor.id)!.asset,side:actor.side,home,target,width,height},tier):sequence?.camera??{zoom:1,x:0,y:0,tilt:0};
   this.camera.zoom=view.reducedMotion?1:camera.zoom;
   this.camera.rotation.z=view.reducedMotion?0:camera.tilt;
   this.camera.position.x+=view.reducedMotion?0:camera.x*this.worldWidth;
   this.camera.position.y+=view.reducedMotion?0:camera.y*PAINT.worldHeight;
   const px=this.worldWidth/width;
   this.camera.position.x+=view.reducedMotion?0:Math.sin(frame.elapsed*.105)*(sequence?.shake??0)*px;
   this.camera.position.y+=view.reducedMotion?0:Math.cos(frame.elapsed*.085)*(sequence?.shake??0)*.4*px;
   this.firstHit=frame.elapsed>=(sequence?.seq.impact??frame.plan.beats[2]!.start);
  }else this.camera.rotation.z=0;
  this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  this.stage.update(this.worldWidth,PAINT.worldHeight,view.reducedMotion?0:20*focus,.18*focus,view.formationC2);
  this.scene.updateMatrixWorld(true);this.projectAnchors(view);
  const protectedRects=this.cinematicRects;
  this.cinematic.ultimateVisible=this.ultimate&&!this.firstHit&&time-this.ultStartedAt<PAINT.cutinSeconds&&!!plan?.ultimate&&view.actors.some(a=>a.id===plan.actorId&&a.side==='party');
  this.cinematic.box=this.cinematic.ultimateVisible?cinematicBox(width,height,protectedRects):null;
  this.cinematic.ultimateVisible&&=!!this.cinematic.box;
  this.cinematic.phaseVisible=time-this.phaseNoticeAt<PAINT.phaseSeconds&&!this.cinematic.ultimateVisible;
  this.cinematic.phaseBox=this.cinematic.phaseVisible?cinematicBox(width,height,protectedRects,true):null;
  this.cinematic.phaseVisible&&=!!this.cinematic.phaseBox;
  this.effects.render(view,time,this.width,this.height,this.labelAudit.cards);this.stats.particles=this.effects.stats.active;
  this.postFx.render(plan,frame?.elapsed??0,delta,view.quality??'high',view.reducedMotion,plan?this.actors.get(plan.actorId)?.actor.root:undefined,plan?this.actors.get(plan.targetIds[0]??plan.actorId)?.actor.root.position:undefined);
  this.cinema.render(frame,view.paused,view.playbackSpeed??1,view.reducedMotion,view.fixedTime!==undefined,view.battleKey);
  this.bossPhase.render(view,time,width,height,id=>{const entry=this.actors.get(id);return entry?this.bounds(entry):undefined;});
  this.audio.render(view);
  this.bodyFx.render(view,time,width,height,new Map([...this.actors].map(([id,e])=>[id,this.bounds(e)])));this.stats.frames++;const info=this.renderer.info;Object.assign(this.stats,{calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures});
  this.numbers.setAnchors(this.anchors);this.numbers.render(frame,view.cardPresentation,this.width,this.height,view.reducedMotion,true,view.fixedTime);
 }
 private screen(vector:T.Vector3){vector.project(this.camera);return{x:(vector.x*.5+.5)*this.width,y:(.5-vector.y*.5)*this.height};}
 private bounds(entry:DisplayActor,b=entry.actor.bounds):Rect{
  const root=entry.actor.root,a=this.screen(root.localToWorld(this.scratch.set(b.x,b.y,0))),c=this.screen(root.localToWorld(this.scratch.set(b.x+b.width,b.y+b.height,0)));
  return{x:Math.min(a.x,c.x),y:Math.min(a.y,c.y),width:Math.abs(a.x-c.x),height:Math.abs(a.y-c.y)};
 }
 private projectAnchors(view:SceneView){
  this.anchors.length=0;const labels:LabelInput[]=[],text:LabelInput[]=[],bodies:Rect[]=[];
  for(const unit of view.actors){const entry=this.actors.get(unit.id);if(!entry)continue;
   const actor=entry.actor,hp=this.screen(actor.socket('hpAnchor',this.scratch)),face=this.screen(actor.socket('head',this.scratch)),foot=this.screen(actor.socket('feet',this.scratch)),body=this.bounds(entry);
   const anchor:Anchor={id:unit.id,x:face.x,y:hp.y,labelX:hp.x,labelY:hp.y,footY:foot.y,visible:unit.hp>0&&(unit.side==='enemy'||!!view.formationC2)};this.anchors.push(anchor);
   if(unit.hp>0)bodies.push(body);
   if(anchor.visible)labels.push({id:unit.id,x:hp.x,y:hp.y,height:view.formationC2?40:52,head:body});
   const rows=view.cardNumberRows?.[unit.id]??0,burst=view.cardPresentation?.bursts.includes(unit.id);if(rows||burst)text.push({id:unit.id,x:hp.x,y:hp.y-52,height:Math.max(34,rows*34)+(burst?34:0),head:body});
  }
  const labelWidth=view.formationC2?110:138,placed=layoutLabels(labels,this.width,this.height,labelWidth,bodies),words=layoutLabels(text,this.width,this.height,150,[...bodies,...placed.values()]);
  for(const anchor of this.anchors){const box=placed.get(anchor.id);if(box){anchor.labelX=box.x+labelWidth/2;anchor.labelY=box.y;}else anchor.visible=false;anchor.textLane=words.get(anchor.id);
   // Dense formations can exhaust empty floor lanes. Keep contact feedback on
   // the target's lower body, safely below its face, instead of dropping it.
   if(!anchor.textLane&&text.some(t=>t.id===anchor.id)){const h=text.find(t=>t.id===anchor.id)!.height;anchor.textLane={x:Math.max(4,Math.min(this.width-154,anchor.x-75)),y:Math.max(4,Math.min(this.height-h-4,anchor.footY-h-12)),width:150,height:h};}
  }
  this.labelAudit.heads=bodies;this.labelAudit.cards=[...placed.values(),...words.values()];this.labelAudit.missing=labels.filter(l=>!placed.has(l.id)).map(l=>l.id);
  // Reserve number lanes for their later contact, but do not let invisible
  // numbers displace the pre-contact ultimate card. HP and bodies stay protected.
  this.cinematicRects=[...bodies,...placed.values(),...(this.firstHit?words.values():[])];
  this.labelAudit.overlaps=this.labelAudit.cards.reduce((sum,box,i)=>sum+bodies.filter(b=>intersects(box,b,0)).length+this.labelAudit.cards.slice(i+1).filter(b=>intersects(box,b,0)).length,0);
  if(view.formationC2)for(const anchor of this.anchors){
   const entry=this.actors.get(anchor.id);if(!entry)continue;
   const b=this.bounds(entry);anchor.labelX=Math.max(36,Math.min(this.width-36,anchor.x));
   anchor.labelY=Math.max(18,b.y-9);anchor.visible=view.actors.some(u=>u.id===anchor.id&&u.hp>0);
  }
  this.onAnchors(this.anchors);
 }
 socket(actorId:string,name:SpineSocket){const entry=this.actors.get(actorId);return entry?this.screen(entry.actor.socket(name,this.scratch)):undefined;}
 pixelsPerUnit(actorId:string){const entry=this.actors.get(actorId);return entry?this.height*this.camera.zoom/(this.camera.top-this.camera.bottom)*Math.abs(entry.actor.root.scale.y):undefined;}
 sizeAudit(){return{width:this.width,height:this.height,modelToStage:1,units:[...this.actors].filter(([,entry])=>entry.actor.root.visible).map(([id,entry])=>{const box=this.bounds(entry),coreBox=this.bounds(entry,unitCore(entry.asset,entry.actor.bounds).world),faceBox={x:coreBox.x+coreBox.width*.08,y:coreBox.y,width:coreBox.width*.84,height:coreBox.height*.44};return{id,asset:entry.asset,side:entry.actor.unit.side,kind:entry.actor.unit.tier,height:entry.actor.bounds.height,footprint:entry.actor.bounds.width,box,coreBox,faceBox,drawOrder:entry.actor.root.children[0]?.renderOrder??0,ratio:box.height/this.height,source:entry.actor.source,fallback:entry.actor.source==='puppet'};})};}
 audit(){return{renderer:'taskbar-cutout',orthographic:true,zoom:this.camera.zoom,stage:this.stage.audit(),cache:spineCacheStats(),events:this.eventAudit,motion:this.motionAudit,labels:this.labelAudit,stats:this.stats,vfx:this.effects.stats,cinematic:this.cinematic,sequence:this.cinema.audit,bossPhase:this.bossPhase.audit,units:this.sizeAudit().units};}
 private releaseActor(entry:DisplayActor){entry.actor.dispose();for(const mesh of [entry.shadow,entry.ring,entry.hit]){mesh.material.dispose();mesh.removeFromParent();}}
 dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.resize.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.renderer.domElement.removeEventListener('pointerup',this.pick);for(const entry of this.actors.values())this.releaseActor(entry);this.actors.clear();this.pending.clear();this.failed.clear();this.lanes.clear();this.sampled.clear();this.ready=false;this.stage.dispose();this.shadowTexture.dispose();this.geometry.dispose();this.ringGeometry.dispose();this.effects.dispose();this.numbers.dispose();this.bodyFx.dispose();this.bossPhase.dispose();this.trails.dispose();this.homes.clear();this.cinema.dispose();this.postFx.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
