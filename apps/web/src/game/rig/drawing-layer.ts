/** Discrete original-art attachments. Shared pixels; independent geometry and pose.
 * LEARN/P2.md: foot-local origin, one decode, one visible drawing, seekable overlap.
 */
import * as T from 'three';
import {usePaintedAtlasColor} from './atlas-color';
import {SecondaryMotion} from './secondary-motion';
import {drawingExpression,eyeClosure} from './drawing-expression';
import {FaceDepth} from './face-depth';
export type DrawingKey='K0'|'K1'|'K2'|'K3'|'K4'|'K5'|'K6';
export type DrawingPoint=readonly [number,number];
export interface DrawingSample {clip:string;seconds:number;reduced:boolean}
export interface DrawingOverlap {part:string;center:DrawingPoint;radius:DrawingPoint;travel:DrawingPoint;phase:number}
export interface DrawingFrame {
 image:string; face:readonly [number,number,number,number];
 opaqueBounds?:readonly [number,number,number,number];
 feet:readonly [DrawingPoint,DrawingPoint]; sockets:Record<string,DrawingPoint>;
 overlap?:readonly DrawingOverlap[];
}
export interface DrawingManifest {
 version:1;unit:string;canvas:readonly [number,number];baseline:DrawingPoint;opaqueHeight:number;
 poses:Partial<Record<DrawingKey,DrawingFrame>>;
}
export interface DrawingSet {manifest:DrawingManifest;textures:Partial<Record<DrawingKey,T.Texture>>}
export function drawingAt(name:string,seconds:number):DrawingKey {
 const ms=Math.max(0,seconds*1000);
 if(name==='attack')return ms<50||ms>=560?'K0':ms<330?'K1':'K2';
 if(name==='ult'||name==='skill')return ms<300?'K1':ms<1800?'K5':'K0';
 if(name==='hurt')return ms<180?'K4':'K0';
 if(name==='ko')return 'K4';
 return 'K0';
}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const NO_OVERLAP:readonly DrawingOverlap[]=[];
const enum Weight {Upper,Guard,Planted,Head,Neck,Ear,Accessory,Count}
type VertexWeights={data:Float64Array;stride:number};
export class DrawingLayer extends T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial> {
 key:DrawingKey='K0';private seconds=0;private clip='idle';private reduced=false;
 private source:Float32Array;
 readonly secondary:SecondaryMotion;
 readonly faceDepth=new FaceDepth();private seekFaceDepth=new FaceDepth();
 private faceOffset={x:0,y:0};
 private seekMotion:SecondaryMotion;
 private expression:ReturnType<typeof drawingExpression>;
 private overlapValues:Float32Array;
 private vertex:[number,number]=[0,0];private output={x:0,y:0};
 private vertexWeights=new Map<DrawingKey,VertexWeights>();
 private movingVertexCount=Infinity;private stationaryRowsValid=false;
 constructor(readonly set:DrawingSet,readonly origin:DrawingPoint,readonly pixelScale:number){
  const m=set.manifest;
  super(new T.PlaneGeometry(m.canvas[0],m.canvas[1],32,32),new T.MeshBasicMaterial({map:set.textures.K0,
   transparent:true,side:T.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));
  usePaintedAtlasColor(this.material,false);this.expression=drawingExpression(this.material,m.unit);
  this.secondary=new SecondaryMotion(m.unit);this.seekMotion=new SecondaryMotion(m.unit);this.overlapValues=new Float32Array(Math.max(0,...Object.values(m.poses).map(f=>f.overlap?.length??0)));
  this.name=`${m.unit} drawn keys`;this.frustumCulled=false;
  this.source=Float32Array.from(this.geometry.attributes.position!.array);this.sample('idle',0,false);
  this.movingVertexCount=this.stationaryCutoff();
 }
 /** Keep the full mesh and triangle order. Only rows below every motion region
  * can reuse the constructor's original full idle sample. Metadata is immutable. */
 private stationaryCutoff(){
  const m=this.set.manifest,full=this.source.length/3,finite=(values:readonly number[])=>values.every(Number.isFinite);
  const pair=(values:readonly number[])=>values.length===2&&finite(values);
  if(!pair(m.canvas)||!pair(m.baseline)||!pair(this.origin)||!finite([m.opaqueHeight,this.pixelScale])||
   !m.canvas.every(n=>Number.isSafeInteger(n)&&n>0)||m.opaqueHeight<=0||this.pixelScale<=0||
   !Number.isFinite(m.opaqueHeight*this.pixelScale)||m.opaqueHeight*this.pixelScale===0)return full;
  let bottom=m.baseline[1];
  for(const frame of Object.values(m.poses)){
   if(frame.face.length!==4||!finite(frame.face)||frame.face[2]<1||frame.face[3]<1||!frame.feet.every(pair)||
    !Object.values(frame.sockets).every(pair))return full;
   for(const region of frame.overlap??NO_OVERLAP){
    if(!pair(region.center)||!pair(region.radius)||!pair(region.travel)||!Number.isFinite(region.phase)||
     region.radius[0]<=0||region.radius[1]<=0)return full;
   }
   bottom=Math.max(bottom,frame.face[1]+frame.face[3]*1.31+1);
  }
  if(!Number.isFinite(bottom)||!this.source.every(Number.isFinite))return full;
  // PlaneGeometry is ordered top to bottom. Leave all earlier rows active.
  for(let i=0;i<full;i++)if(m.canvas[1]/2-this.source[i*3+1]!>=bottom)return i;
  return full;
 }
 /** Every call starts from source coordinates; backwards seeks never integrate drift. */
 sample(name:string,seconds:number,reduced:boolean,damageAge?:number,clock=seconds,target=0,critAge=-1){
  const finiteInputs=Number.isFinite(seconds*1000)&&Number.isFinite(clock)&&Number.isFinite(target)&&
   Number.isFinite(damageAge??0)&&Number.isFinite(critAge);
  // Preserve existing exceptions for invalid motion inputs, but invalidate the
  // reuse state first so a later successful sample refreshes every vertex.
  if(!finiteInputs)this.stationaryRowsValid=false;
  // A caster may take retaliation during its own action. Override only its
  // drawing for the contact interval; the action/cue clock keeps running.
  if(damageAge!==undefined&&damageAge>=0&&damageAge<.18){name='hurt';seconds=damageAge;}
  this.seconds=seconds;this.clip=name;this.reduced=reduced;
  const key=!reduced&&name==='attack'&&seconds>=.27&&seconds<.33?'K2':drawingAt(name,seconds);this.key=this.set.manifest.poses[key]?key:'K0';
  this.material.map=this.set.textures[this.key]!;
  this.userData.opaquePixelBounds=this.frame.opaqueBounds;
  const positions=this.geometry.attributes.position!,m=this.set.manifest;
  const hold=name==='attack'&&seconds>=.35&&seconds<.44?.35:(name==='ult'||name==='skill')&&seconds>=1.1&&seconds<1.19?1.1:name==='hurt'&&seconds<.09?0:seconds;
  this.secondary.sample(clock-seconds+hold,name,hold,reduced,target,damageAge??(name==='hurt'?seconds:-1),critAge);
  this.faceDepth.sample(this.secondary.turn,this.secondary.nod);
  const overlaps=this.frame.overlap??NO_OVERLAP;
  for(let i=0;i<overlaps.length;i++)this.overlapValues[i]=this.secondary.layer(overlaps[i]!.part,overlaps[i]!.phase);
  this.expression.sample(this.frame.face,m.canvas,eyeClosure(this.secondary.leftBlink,this.secondary.leftSoftness),eyeClosure(this.secondary.rightBlink,this.secondary.rightSoftness),this.key);
  const weights=this.weightsFor(this.key);
  const finite=finiteInputs&&Number.isFinite(this.secondary.body)&&
   this.overlapValues.every(Number.isFinite);
  const count=finite&&this.stationaryRowsValid?Math.min(positions.count,this.movingVertexCount):positions.count;
  for(let i=0;i<count;i++){
   this.vertex[0]=this.source[i*3]!+m.canvas[0]/2;this.vertex[1]=m.canvas[1]/2-this.source[i*3+1]!;
   const point=this.point(this.vertex,this.key,undefined,this.output,weights.data,i*weights.stride);
   positions.setXYZ(i,point.x,point.y,.002);
  }
  // A bad clock can poison even zero-weight rows (NaN*0). Refresh them once
  // after recovery before skipping work again.
  this.stationaryRowsValid=finite;
  positions.needsUpdate=true;
 }
 /** Authored regions and source vertices are immutable for this layer's lifetime.
  * Float64 storage retains the uncached calculation's precision; live motion,
  * facial projection and arbitrary socket points still evaluate each sample. */
 private weightsFor(key:DrawingKey):VertexWeights{
  const cached=this.vertexWeights.get(key);if(cached)return cached;
  const m=this.set.manifest,frame=m.poses[key]!,overlaps=frame.overlap??NO_OVERLAP;
  const stride=Weight.Count+overlaps.length,data=new Float64Array(this.source.length/3*stride),height=m.opaqueHeight*this.pixelScale;
  const [fx,fy,fw,fh]=frame.face;
  for(let i=0;i<this.source.length/3;i++){
   const x=this.source[i*3]!+m.canvas[0]/2,y=m.canvas[1]/2-this.source[i*3+1]!,offset=i*stride,py=(m.baseline[1]-y)*this.pixelScale;
   data[offset+Weight.Upper]=smooth((py/height-.08)/.52);
   const faceDistance=Math.max(Math.abs(x-fx-fw/2)/(fw/2+8),Math.abs(y-fy-fh/2)/(fh/2+8));
   const guard=data[offset+Weight.Guard]=smooth((faceDistance-1)*3)*smooth((m.baseline[1]-y)/40);
   let planted=1;for(const foot of frame.feet){const distance=Math.hypot(x-foot[0],y-foot[1]);planted=Math.min(planted,smooth(distance/24));}
   data[offset+Weight.Planted]=planted;data[offset+Weight.Head]=smooth((py/height-.32)/.38);
   const neckY=fy+fh*1.13;data[offset+Weight.Neck]=smooth((neckY-y)/(fh*.45));
   const ex=(x-fx-fw*.5)/(fw*.62),ey=(y-fy+fh*.20)/(fh*.65);data[offset+Weight.Ear]=smooth(1-ex*ex-ey*ey)*guard;
   const accessory=frame.sockets.mainHand;
   if(accessory){const ax=(x-accessory[0])/(fw*.35),ay=(y-accessory[1])/(fh*.65);data[offset+Weight.Accessory]=smooth(1-ax*ax-ay*ay)*guard;}
   for(let index=0;index<overlaps.length;index++){
    const region=overlaps[index]!,dx=(x-region.center[0])/region.radius[0],dy=(y-region.center[1])/region.radius[1];
    data[offset+Weight.Count+index]=smooth(1-dx*dx-dy*dy)*guard;
   }
  }
  const weights={data,stride};this.vertexWeights.set(key,weights);return weights;
 }
 point([x,y]:DrawingPoint,key:DrawingKey=this.key,at?:DrawingSample,out={x:0,y:0},weights?:Float64Array,offset=0){
  const seconds=at?.seconds??this.seconds,clip=at?.clip??this.clip,reduced=at?.reduced??this.reduced;
  const m=this.set.manifest,height=m.opaqueHeight*this.pixelScale;
  const px=(x-m.baseline[0])*this.pixelScale,py=(m.baseline[1]-y)*this.pixelScale;
  const upper=weights?.[offset+Weight.Upper]??smooth((py/height-.08)/.52),ms=seconds*1000;
  const hold=clip==='attack'&&ms>=350&&ms<440?.35:(clip==='ult'||clip==='skill')&&ms>=1100&&ms<1190?1.1:clip==='hurt'&&ms<90?0:seconds;
  const motion=at?this.seekMotion:this.secondary;
  if(at)motion.sample(hold,clip,hold,reduced,0,clip==='hurt'?seconds:-1);
  // The quiet body oscillator remains underneath actions; the held clock above
  // freezes it at contact, while recovery blends idle gestures back in.
  const resting=clip==='idle'||clip==='idle-phase2'||clip==='victory';
  let lift=clip==='ko'?0:.018*motion.body*(resting?1:.24),lean=0;
  if(clip==='attack'){
   // Hold the contact drawing completely still through 350–440ms hit-stop.
   if(ms<270)lift+=-.012*Math.sin(Math.min(1,ms/250)*Math.PI/2);
   else if(ms<330)lean=.018*smooth((ms-270)/60);
   else if(ms>=560&&ms<800){const t=(ms-560)/240;lift+=.012*Math.sin(t*Math.PI*2)*(1-t);}
  }else if(clip==='ult'||clip==='skill'){
   if(ms>=300&&ms<1100)lift+=.008*Math.sin((ms-300)/800*Math.PI);
   else if(ms>=1800&&ms<2200)lift+=.012*Math.sin((ms-1800)/400*Math.PI*2)*(1-(ms-1800)/400);
  }else if(clip==='hurt'&&ms>=180&&ms<400)lift+=-.012*Math.sin((ms-180)/220*Math.PI);
  // Pose changes remain available with reduced motion; overlap is attenuated.
  if(reduced){lean=0;if(clip!=='idle')lift*=.25;}
  const frame=m.poses[key]!,[fx,fy,fw,fh]=frame.face;
  const guard=weights?.[offset+Weight.Guard]??smooth((Math.max(Math.abs(x-fx-fw/2)/(fw/2+8),Math.abs(y-fy-fh/2)/(fh/2+8))-1)*3)*smooth((m.baseline[1]-y)/40);
  let ox=0,oy=0;
  const overlaps=frame.overlap??NO_OVERLAP;
  for(let index=0;index<overlaps.length;index++){
   const region=overlaps[index]!;
   let weight=weights?.[offset+Weight.Count+index];
   if(weight===undefined){const dx=(x-region.center[0])/region.radius[0],dy=(y-region.center[1])/region.radius[1];weight=smooth(1-dx*dx-dy*dy)*guard;}
   const follower=m.unit==='panko'&&(clip==='idle'||clip==='idle-phase2')?(/tail/.test(region.part)?3:/apron/.test(region.part)?1.6:1):1;
   const wave=(at?motion.layer(region.part,region.phase):this.overlapValues[index]??0)*weight*motion.overlapGain*follower;
   ox+=region.travel[0]*wave;oy+=region.travel[1]*wave;
  }
  // Ears/tufts are above the protected face, driven after the body with their own spring.
  if(!reduced&&clip!=='ko'){
   let ear=weights?.[offset+Weight.Ear];
   if(ear===undefined){const ex=(x-fx-fw*.5)/(fw*.62),ey=(y-fy+fh*.20)/(fh*.65);ear=smooth(1-ex*ex-ey*ey)*guard;}
   const flick=motion.earFlick*(x<fx+fw*.5?1:-.55);
   ox+=(motion.ear*2.3+motion.hair*.5+flick*3.5)*ear;oy+=(motion.earFlatten*fh*.12+motion.ear*1.6+flick*4)*ear;
   const accessory=frame.sockets.mainHand;
   if(accessory){let weight=weights?.[offset+Weight.Accessory];
    if(weight===undefined){const ax=(x-accessory[0])/(fw*.35),ay=(y-accessory[1])/(fh*.65);weight=smooth(1-ax*ax-ay*ay)*guard;}
    ox+=motion.accessory*1.4*weight;oy+=(motion.accessory*2-motion.handLift*m.opaqueHeight*.008)*weight;}
  }
  if(m.unit==='panko'&&(clip==='idle'||clip==='idle-phase2')&&!reduced){
   // The bread shield follows the torso locally; the feet and protected face stay fixed.
   const hand=frame.sockets.offHand;
   if(hand){const ax=(x-hand[0])/(fw*.42),ay=(y-hand[1])/(fh*.80),weight=smooth(1-ax*ax-ay*ay)*guard;
    ox+=motion.accessory*6*weight;oy+=motion.accessory*8*weight;}
  }
  const limit=m.opaqueHeight*.025,factor=Math.min(1,limit/Math.max(.001,Math.hypot(ox,oy)));
  const smear=clip==='attack'&&!reduced&&ms>=270&&ms<330?.12*Math.sin((ms-270)/60*Math.PI)*guard:0;
  // Smoothly pin the measured foot contacts, including feet just above the baseline.
  let planted=weights?.[offset+Weight.Planted]??1;
  if(!weights)for(const foot of frame.feet){const distance=Math.hypot(x-foot[0],y-foot[1]);planted=Math.min(planted,smooth(distance/24));}
  const head=motion.look*m.opaqueHeight*.008*(weights?.[offset+Weight.Head]??smooth((py/height-.32)/.38))*this.pixelScale;
  // Neck roll carries the outline; cheek/muzzle projection changes the inner
  // feature spacing so a yaw reads as depth rather than a sliding face.
  const neckX=fx+fw*.5,neckY=fy+fh*1.13,neck=weights?.[offset+Weight.Neck]??smooth((neckY-y)/(fh*.45));
  const dx=x-neckX,dy=y-neckY;
  const turnX=(dx*(motion.tiltCos-1)-dy*motion.tiltSin)*neck;
  const turnY=(dx*motion.tiltSin+dy*(motion.tiltCos-1))*neck;
  const depth=at?this.seekFaceDepth:this.faceDepth;if(at)depth.sample(motion.turn,motion.nod);
  const projected=depth.offset(x,y,frame.face,this.faceOffset);
  const lifeX=(turnX+projected.x+m.opaqueHeight*(motion.turn*.004*neck+.009*motion.weight*upper))*this.pixelScale;
  const lifeY=(-turnY-projected.y+m.opaqueHeight*.006*motion.nod*neck)*this.pixelScale;
  out.x=this.origin[0]+px+(px*smear+height*lean*upper+ox*factor*this.pixelScale+head+lifeX)*planted;
  out.y=this.origin[1]+py+(height*lift*upper-oy*factor*this.pixelScale+lifeY)*planted;
  return out;
 }
 get frame(){return this.set.manifest.poses[this.key]!;}
 faceCorners(){const [x,y,w,h]=this.frame.face;return[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(p=>this.point(p as [number,number]));}
 contactPoints(){return this.frame.feet.map(p=>this.point(p));}
 dispose(){this.vertexWeights.clear();this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
