/** Discrete original-art attachments. Shared pixels; independent geometry and pose.
 * LEARN/P2.md: foot-local origin, one decode, one visible drawing, seekable overlap.
 */
import * as T from 'three';
import {usePaintedAtlasColor} from '/src/game/rig/atlas-color';
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
export class DrawingLayer extends T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial> {
 key:DrawingKey='K0';private seconds=0;private clip='idle';private reduced=false;
 private source:Float32Array;
 constructor(readonly set:DrawingSet,readonly origin:DrawingPoint,readonly pixelScale:number){
  const m=set.manifest;
  super(new T.PlaneGeometry(m.canvas[0],m.canvas[1],32,32),new T.MeshBasicMaterial({map:set.textures.K0,
   transparent:true,side:T.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false}));
  usePaintedAtlasColor(this.material,false);this.name=`${m.unit} drawn keys`;this.frustumCulled=false;
  this.source=Float32Array.from(this.geometry.attributes.position!.array);this.sample('idle',0,false);
 }
 /** Every call starts from source coordinates; backwards seeks never integrate drift. */
 sample(name:string,seconds:number,reduced:boolean,damageAge?:number){
  // A caster may take retaliation during its own action. Override only its
  // drawing for the contact interval; the action/cue clock keeps running.
  if(damageAge!==undefined&&damageAge>=0&&damageAge<.18){name='hurt';seconds=damageAge;}
  this.seconds=seconds;this.clip=name;this.reduced=reduced;
  const key=!reduced&&name==='attack'&&seconds>=.27&&seconds<.33?'K2':drawingAt(name,seconds);this.key=this.set.manifest.poses[key]?key:'K0';
  this.material.map=this.set.textures[this.key]!;
  const positions=this.geometry.attributes.position!,m=this.set.manifest;
  for(let i=0;i<positions.count;i++){
   const point=this.point([this.source[i*3]!+m.canvas[0]/2,m.canvas[1]/2-this.source[i*3+1]!]);
   positions.setXYZ(i,point.x,point.y,.002);
  }
  positions.needsUpdate=true;
 }
 point([x,y]:DrawingPoint,key:DrawingKey=this.key,at?:DrawingSample){
  const seconds=at?.seconds??this.seconds,clip=at?.clip??this.clip,reduced=at?.reduced??this.reduced;
  const m=this.set.manifest,height=m.opaqueHeight*this.pixelScale;
  const px=(x-m.baseline[0])*this.pixelScale,py=(m.baseline[1]-y)*this.pixelScale;
  const upper=smooth((py/height-.08)/.52),ms=seconds*1000;
  let lift=0,lean=0;
  if(clip==='idle'||clip==='idle-phase2'||clip==='victory'){
   lift=.018*Math.sin(seconds/3.6*Math.PI*2)*(reduced?.25:1);
  }else if(clip==='attack'){
   // Hold the contact drawing completely still through 350–440ms hit-stop.
   if(ms<270)lift=-.012*Math.sin(Math.min(1,ms/250)*Math.PI/2);
   else if(ms<330)lean=.018*smooth((ms-270)/60);
   else if(ms>=560&&ms<800){const t=(ms-560)/240;lift=.012*Math.sin(t*Math.PI*2)*(1-t);}
  }else if(clip==='ult'||clip==='skill'){
   if(ms>=300&&ms<1100)lift=.008*Math.sin((ms-300)/800*Math.PI);
   else if(ms>=1800&&ms<2200)lift=.012*Math.sin((ms-1800)/400*Math.PI*2)*(1-(ms-1800)/400);
  }else if(clip==='hurt'&&ms>=180&&ms<400)lift=-.012*Math.sin((ms-180)/220*Math.PI);
  // Pose changes remain available with reduced motion; overlap is attenuated.
  if(reduced){lean=0;if(clip!=='idle')lift*=.25;}
  const frame=m.poses[key]!,[fx,fy,fw,fh]=frame.face;
  const faceDistance=Math.max(Math.abs(x-fx-fw/2)/(fw/2+8),Math.abs(y-fy-fh/2)/(fh/2+8));
  const guard=smooth((faceDistance-1)*3)*smooth((m.baseline[1]-y)/40);
  const hold=clip==='attack'&&ms>=350&&ms<440?.35:(clip==='ult'||clip==='skill')&&ms>=1100&&ms<1190?1.1:clip==='hurt'&&ms<90?0:seconds;
  const activity=clip==='attack'?Math.sin(Math.min(1,hold/.8)*Math.PI):clip==='hurt'?Math.sin(Math.min(1,hold/.4)*Math.PI):clip==='ko'?0:1;
  let ox=0,oy=0;
  for(const region of frame.overlap??[]){
   const dx=(x-region.center[0])/region.radius[0],dy=(y-region.center[1])/region.radius[1];
   const weight=smooth(1-dx*dx-dy*dy)*guard,phase=hold*Math.PI*2/(clip==='idle'?2.6:1.1)+region.phase;
   const wave=Math.sin(phase)*activity*(reduced?.25:1)*weight;
   ox+=region.travel[0]*wave;oy+=region.travel[1]*wave;
  }
  const limit=m.opaqueHeight*.025,factor=Math.min(1,limit/Math.max(.001,Math.hypot(ox,oy)));
  const smear=clip==='attack'&&!reduced&&ms>=270&&ms<330?.12*Math.sin((ms-270)/60*Math.PI)*guard:0;
  return{x:this.origin[0]+px*(1+smear)+height*lean*upper+ox*factor*this.pixelScale,y:this.origin[1]+py+height*lift*upper-oy*factor*this.pixelScale};
 }
 get frame(){return this.set.manifest.poses[this.key]!;}
 faceCorners(){const [x,y,w,h]=this.frame.face;return[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(p=>this.point(p as [number,number]));}
 contactPoints(){return this.frame.feet.map(p=>this.point(p));}
 dispose(){this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
