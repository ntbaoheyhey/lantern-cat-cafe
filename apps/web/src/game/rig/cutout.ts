/** Independent flat cut-out player; data and GPU pixels are shared, pose state is not. */
import * as T from 'three';
import {usePaintedAtlasColor} from './atlas-color';
import {DrawingLayer,type DrawingSet,type DrawingPoint} from './drawing-layer';
export interface CutoutKey {time?:number;x?:number;y?:number;value?:number;angle?:number;name?:string|null;curve?:'stepped'|number[]}
interface CutoutNode {name:string;parent:number;x:number;y:number;rotation:number;sx:number;sy:number}
interface Weight {bone:number;x:number;y:number;weight:number}
interface Part {name:string;slot:string;visible:boolean;page:number;vertices:Weight[][];uv:number[];triangles:number[]}
interface Clip {duration:number;tracks:{node:number;property:string;keys:CutoutKey[]}[];visibility:{slot:string;keys:CutoutKey[]}[];events:{name:string;time:number}[]}
export interface CutoutData {format:'taskbar-cutout-v1';nodes:CutoutNode[];parts:Part[];pages:{name:string;width:number;height:number;pma:boolean}[];clips:Record<string,Clip>;bounds:{x:number;y:number;width:number;height:number};face?:{seed:number};blink?:{part:string;bone:number;seed:number;eyes:{x:number;y:number;rx:number;ry:number}[]}}
export interface CutoutBone {worldX:number;worldY:number;a:number;b:number;c:number;d:number}
/** Seekable independent blink clock; seeded intervals stay within 2.5–5 seconds. */
export function blinkAt(time:number,seed:number){
 const intervals=Array.from({length:16},(_,i)=>2.5+(((Math.imul(seed+i,1664525)+1013904223)>>>0)%2500)/1000);
 let at=Math.max(0,time)%intervals.reduce((a,b)=>a+b,0);
 for(const duration of intervals){if(at<duration)return at>duration-.1?Math.sin((at-duration+.1)/.1*Math.PI):0;at-=duration;}return 0;
}
/** Separate painted attachments, using only the simulation clock and clip phase. */
export function faceAt(name:string,at:number,duration:number,clock:number,seed:number){
 const speaking=at>.02&&at<duration*.88;
 return {closed:(name==='death'||name==='ko')&&at>.2||blinkAt(clock,seed)>.15,
  mouth:speaking&&/^(ultimate|ult|enrage)$/.test(name)?'mouth_shout':speaking&&/^(attack|cast|skill|hit|hurt)$/.test(name)?'mouth_open':'mouth_neutral'};
}
/** Monotonic cubic solve for exported normalized Bezier timing. */
function curve(t:number,c:CutoutKey['curve']){
 if(c==='stepped')return 0;if(!Array.isArray(c)||c.length!==4)return t;
 const bez=(x:number,a:number,b:number)=>3*(1-x)**2*x*a+3*(1-x)*x*x*b+x*x*x;
 let lo=0,hi=1;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(bez(mid,c[0]!,c[2]!)<t)lo=mid;else hi=mid;}return bez((lo+hi)/2,c[1]!,c[3]!);
}
function value(keys:CutoutKey[],at:number,key:'x'|'y'|'value',fallback:number){
 if(!keys.length||at<(keys[0]!.time??0))return fallback;let i=0;while(i+1<keys.length&&(keys[i+1]!.time??0)<=at)i++;
 const a=keys[i]!,b=keys[i+1],v=a[key]??(key==='value'?a.angle:undefined)??fallback;if(!b)return v;
 const t=curve(Math.min(1,(at-(a.time??0))/Math.max(1e-6,(b.time??0)-(a.time??0))),a.curve);return v+((b[key]??(key==='value'?b.angle:undefined)??fallback)-v)*t;
}
export class CutoutMesh extends T.Group {
 drawing?:DrawingLayer;
 private drawingHidden:{node:T.Object3D;visible:boolean}[]=[];
 installDrawings(set:DrawingSet,origin:DrawingPoint,scale:number){
  this.clearDrawings();
  this.traverse(node=>{if((node as T.Mesh).isMesh){this.drawingHidden.push({node,visible:node.visible});node.visible=false;}});
  this.drawing=new DrawingLayer(set,origin,scale);this.add(this.drawing);return this.drawing;
 }
 clearDrawings(){this.drawing?.dispose();this.drawing=undefined;for(const {node,visible}of this.drawingHidden)node.visible=visible;this.drawingHidden=[];}
 proceduralTime=0;
 readonly bones:CutoutBone[];private boneOrder:number[]=[];private local:number[][];private at=0;private clip='';private loop=false;
 private batches:{geometry:T.BufferGeometry;parts:{part:Part;offset:number}[];positions:Float32Array}[]=[];
 zOffset=.001;
 readonly state:{data:{defaultMix:number};setAnimation:(track:number,name:string,loop:boolean)=>void;clearTracks:()=>void;getCurrent:(track:number)=>{animation:{name:string}}|null};
 readonly skeleton:{data:CutoutData;setToSetupPose:()=>void;findBone:(name:string)=>CutoutBone|undefined;getBoundsRect:()=>CutoutData['bounds'];getBounds:(offset:T.Vector2,size:T.Vector2,vertices?:number[])=>void};
 constructor(readonly data:CutoutData,textures:T.Texture[]){
  super();
  // Prop pivots may be reparented to a hand declared later in the template.
  // Evaluate parents first so arbitrary seek never uses the preceding pose.
  const visited=new Uint8Array(data.nodes.length);
  const visit=(i:number)=>{if(visited[i]===2)return;if(visited[i]===1)throw Error('Cyclic cut-out skeleton');
   visited[i]=1;const parent=data.nodes[i]!.parent;
   if(parent>=0){if(parent>=data.nodes.length)throw Error('Invalid cut-out parent');visit(parent);}
   visited[i]=2;this.boneOrder.push(i);
  };for(let i=0;i<data.nodes.length;i++)visit(i);
  this.bones=data.nodes.map(()=>({worldX:0,worldY:0,a:1,b:0,c:0,d:1}));this.local=data.nodes.map(()=>[0,0,0,1,1]);
  this.state={data:{defaultMix:0},setAnimation:(_track,name,loop)=>{this.clip=name;this.at=0;this.loop=loop;},clearTracks:()=>{this.clip='';this.at=0;this.drawing?.sample('idle',0,false);},getCurrent:()=>this.clip?{animation:{name:this.clip}}:null};
  this.skeleton={data,setToSetupPose:()=>{this.pose(0,'');this.drawing?.sample('idle',0,false);},findBone:name=>this.bones[data.nodes.findIndex(n=>n.name===name)],getBoundsRect:()=>this.bounds(),getBounds:(offset,size)=>{const b=this.bounds();offset.set(b.x,b.y);size.set(b.width,b.height);}};
  for(let page=0;page<textures.length;page++){
   const parts=data.parts.filter(p=>p.page===page);let count=0;const entries=parts.map(part=>{const offset=count;count+=part.vertices.length;return{part,offset};});
   const positions=new Float32Array(count*3),uv=new Float32Array(count*2),indices:number[]=[];
   for(const {part,offset} of entries){uv.set(part.uv,offset*2);indices.push(...part.triangles.map(i=>i+offset));}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setIndex(indices);
   const material=new T.MeshBasicMaterial({map:textures[page],transparent:true,side:T.DoubleSide,forceSinglePass:true,depthTest:false,depthWrite:false,toneMapped:false});
   usePaintedAtlasColor(material,!!data.pages[page]?.pma);
   const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;this.add(mesh);this.batches.push({geometry,parts:entries,positions});
  }
  this.pose(0,'');
 }
 update(delta:number){this.at+=delta;const d=this.data.clips[this.clip]?.duration??1;this.pose(this.loop?this.at%d:Math.min(this.at,d),this.clip);}
 pose(at:number,name:string){
  const clip=this.data.clips[name];for(let i=0;i<this.local.length;i++){const n=this.data.nodes[i]!,p=this.local[i]!;p[0]=n.x;p[1]=n.y;p[2]=n.rotation;p[3]=n.sx;p[4]=n.sy;}
  for(const track of clip?.tracks??[]){const p=this.local[track.node];if(!p)continue;
   if(track.property==='translate'){p[0]!+=value(track.keys,at,'x',0);p[1]!+=value(track.keys,at,'y',0);}
   if(track.property==='rotate')p[2]!+=value(track.keys,at,'value',0);
   if(track.property==='scale'){p[3]!*=value(track.keys,at,'x',1);p[4]!*=value(track.keys,at,'y',1);}
  }
  for(const i of this.boneOrder){
   const p=this.local[i]!,b=this.bones[i]!,parent=this.bones[this.data.nodes[i]!.parent],r=p[2]!*Math.PI/180,a=Math.cos(r)*p[3]!,c=Math.sin(r)*p[3]!,bb=-Math.sin(r)*p[4]!,d=Math.cos(r)*p[4]!;
   if(parent){b.worldX=parent.a*p[0]!+parent.b*p[1]!+parent.worldX;b.worldY=parent.c*p[0]!+parent.d*p[1]!+parent.worldY;b.a=parent.a*a+parent.b*c;b.b=parent.a*bb+parent.b*d;b.c=parent.c*a+parent.d*c;b.d=parent.c*bb+parent.d*d;}
   else Object.assign(b,{worldX:p[0],worldY:p[1],a,b:bb,c,d});
  }
  const attachments=new Map<string,string|null>();for(const v of clip?.visibility??[]){let key:CutoutKey|undefined;for(const k of v.keys)if((k.time??0)<=at)key=k;else break;if(key)attachments.set(v.slot,key.name??null);}
  if(this.data.face){const face=faceAt(name,at,clip?.duration??1,this.proceduralTime,this.data.face.seed);
   for(const side of ['l','r'])attachments.set('eye_'+side,'eye_'+side+(face.closed?'_closed':''));
   attachments.set('mouth',face.mouth);
  }
  const blink=this.data.blink,amount=blink?blinkAt(this.proceduralTime,blink.seed):0;
  for(const batch of this.batches){for(const {part,offset} of batch.parts){const visible=attachments.has(part.slot)?attachments.get(part.slot)===part.name:part.visible;
   for(let i=0;i<part.vertices.length;i++){let x=0,y=0;if(visible)for(const w of part.vertices[i]!){const b=this.bones[w.bone]!;x+=(b.a*w.x+b.b*w.y+b.worldX)*w.weight;y+=(b.c*w.x+b.d*w.y+b.worldY)*w.weight;}
    if(visible&&blink&&amount>0&&part.name===blink.part){const b=this.bones[blink.bone]!,det=b.a*b.d-b.b*b.c,dx=x-b.worldX,dy=y-b.worldY,lx=(b.d*dx-b.b*dy)/det;let ly=(-b.c*dx+b.a*dy)/det;
     for(const eye of blink.eyes){const qx=Math.abs(lx-eye.x)/eye.rx,qy=Math.abs(ly-eye.y)/eye.ry;if(qx<1&&qy<1)ly+=(eye.y-ly)*amount*.94*(1-qx**4)*(1-qy**4);}
     x=b.a*lx+b.b*ly+b.worldX;y=b.c*lx+b.d*ly+b.worldY;
    }batch.positions[(offset+i)*3]=x;batch.positions[(offset+i)*3+1]=y;}
  }batch.geometry.attributes.position!.needsUpdate=true;}
 }
 private bounds(){let x=Infinity,y=Infinity,right=-Infinity,top=-Infinity;for(const batch of this.batches)for(let i=0;i<batch.positions.length;i+=3){const px=batch.positions[i]!,py=batch.positions[i+1]!;if(px===0&&py===0)continue;x=Math.min(x,px);y=Math.min(y,py);right=Math.max(right,px);top=Math.max(top,py);}return Number.isFinite(x)?{x,y,width:right-x,height:top-y}:{...this.data.bounds};}
 dispose(){this.clearDrawings();for(const node of this.children)if(node instanceof T.Mesh){node.geometry.dispose();(node.material as T.Material).dispose();}this.removeFromParent();}
}
