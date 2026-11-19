/**
 * Runs the V9 five-beat ultimate for the MVP cats on top of SpineScene.
 * The scene asks for overrides (dim, caster root pose, camera shake, hit-stop)
 * and hands over screen-space anchors; the director paints the banner and FX
 * and drives the frozen designer frame with rim light and afterimages.
 */
import * as T from 'three';
import {ULT_TIMING,ultimateDim,castPose,impactTrauma,shakeOffset,beatsBetween,type CastPose,type UltBeat} from './timeline';
import {ultRecipe,type UltRecipe} from './recipes';
import {UltimatePainter,type Box,type Point} from './painter';
import {atlasMapChunk} from '../../rig/atlas-color';
import type {DesignerVideoMedia} from '../spine/designer-video';

export interface UltCastInput {
 planId:unknown;asset:string;elapsed:number;reduced:boolean;paused:boolean;width:number;height:number;
}
export interface UltAnchors {
 caster:{origin:Point;hand:Point;box:Box};targets:Box[];team:Box[];enemies:Box[];
}
interface Ghost {mesh:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;delay:number;alpha:number}

function silhouetteMaterial(texture:T.Texture,color:string,opacity:number){
 const m=new T.MeshBasicMaterial({map:texture,color,transparent:true,opacity,blending:T.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false,fog:false});
 m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',atlasMapChunk(true)+'\n diffuseColor.rgb = diffuse;');};
 m.customProgramCacheKey=()=>'v9-ult-silhouette';
 return m;
}

export class UltimateDirector {
 readonly painter:UltimatePainter;readonly group=new T.Group();
 private plan:unknown=null;private recipe:UltRecipe|undefined;private last=-1;private lastNow=0;
 private media:DesignerVideoMedia|undefined;private rim:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>|undefined;private ghosts:Ghost[]=[];
 private history:{t:number;matrix:T.Matrix4}[]=[];private cutin:HTMLImageElement|undefined;private cutinCrop:Box|undefined;
 private reach=0;private hitstopUntil=0;private frozenAt=0;private seed=1;
 /** Sound hook; the scene routes ids to its audio bus. */
 onBeat:(beat:UltBeat,recipe:UltRecipe)=>void=()=>{};
 readonly audit={active:false,cat:'',at:0,dim:0,phase:'' as CastPose['phase']|'',shake:0,held:false,beats:[] as string[]};
 constructor(host:HTMLElement,scene:T.Scene){this.painter=new UltimatePainter(host);this.group.name='v9-ultimate';scene.add(this.group);this.painter.flipbooks.load();}
 /** True when this plan is a V9 ultimate the director owns. */
 owns(ultimate:boolean,asset:string|undefined){return ultimate&&!!ultRecipe(asset);}
 get active(){return !!this.recipe;}
 /** Start/stop tracking; call once per frame before poses are resolved. */
 begin(input:UltCastInput|null,media:DesignerVideoMedia|undefined){
  if(!input){this.end();return null;}
  if(input.planId!==this.plan){
   this.end();this.plan=input.planId;this.recipe=ultRecipe(input.asset);this.last=-1;this.history.length=0;this.seed=(this.seed*48271)%2147483647;
   this.painter.reset(this.seed);this.media=media;this.loadCutin(input.asset,media);this.audit.beats.length=0;
   if(media&&!input.reduced)this.buildSilhouettes(media);
  }
  // Hit-stop holds the whole beat clock (pose, FX, shake) for ~90 ms.
  const recipe=this.recipe!;const at=performance.now()<this.hitstopUntil?this.frozenAt:input.elapsed;
  if(at>=ULT_TIMING.lingerEnd){this.audit.active=false;return {recipe,at,dim:0,pose:null as CastPose|null,shake:{x:0,y:0,angle:0},done:true};}
  const pose=castPose(at,this.reach,input.height*.3,input.reduced);
  if(this.media){if(pose.held&&!this.media.isHeld)this.media.hold();else if(!pose.held&&this.media.isHeld)this.media.release();}
  const trauma=impactTrauma(at,input.reduced),shake=trauma?shakeOffset(at,trauma,16*input.height/720):{x:0,y:0,angle:0};
  const dim=ultimateDim(at,input.reduced);
  Object.assign(this.audit,{active:true,cat:recipe.cat,at,dim,phase:pose.phase,shake:trauma,held:this.media?.isHeld??false});
  return {recipe,at,dim,pose,shake,done:false};
 }
 /** Lunge distance in screen pixels for the current cast, set once anchors are known. */
 aim(anchors:UltAnchors,width:number){
  const r=this.recipe;if(!r)return;
  const c=anchors.caster.box,cx=c.x+c.width/2;
  const pool=r.aim==='team'?anchors.team.filter(b=>Math.abs(b.x+b.width/2-cx)>4):anchors.targets.length?anchors.targets:anchors.enemies;
  const tx=pool.length?pool.reduce((s,b)=>s+b.x+b.width/2,0)/pool.length:cx+width;
  const dir=Math.sign(tx-cx)||1,max=r.lunge*width;
  // Brief: a 6-10% lunge toward the target, never past it.
  this.reach=dir*Math.min(max,Math.max(width*.06,Math.abs(tx-cx)*.45),Math.max(width*.03,Math.abs(tx-cx)-c.width*.3));
 }
 get lungeReach(){return this.reach;}
 /** Hit-stop deadline in performance.now() ms; the scene freezes poses until then. */
 hitstop(now:number){return now<this.hitstopUntil;}
 get hitstopDeadline(){return this.hitstopUntil;}
 /** Paint and fire beats. `now` is performance.now(); `anchors` are screen-space. */
 paint(at:number,anchors:UltAnchors,width:number,height:number,reduced:boolean,paused:boolean,root:T.Object3D|undefined){
  const r=this.recipe;if(!r)return;
  const now=performance.now(),frozen=now<this.hitstopUntil;
  let dt=this.lastNow?Math.min(50,now-this.lastNow):16;this.lastNow=now;if(paused||frozen)dt=0;
  const impact=this.impactPoint(r,anchors,width,height);
  const frame={at,dt,w:width,h:height,reduced,recipe:r,caster:anchors.caster,impact,target:anchors.targets[0],team:anchors.team,enemies:anchors.enemies,cutin:this.cutin,cutinCrop:this.cutinCrop};
  for(const b of beatsBetween(this.last,at)){
   this.audit.beats.push(b.beat);this.onBeat(b.beat,r);
   if(b.beat==='impact'){this.painter.beat('impact',frame);if(!reduced){this.hitstopUntil=now+ULT_TIMING.hitstop;this.frozenAt=at;}}
   if(b.beat==='linger')this.painter.beat('linger',frame);
  }
  this.last=Math.max(this.last,at);
  this.painter.paint(frame);
  this.updateSilhouettes(at,root,reduced);
 }
 private impactPoint(r:UltRecipe,a:UltAnchors,w:number,h:number):Point{
  const k=h/720,c=a.caster.box,dir=Math.sign(this.reach)||1;
  if(r.setPiece==='tea-clover'){
   const team=a.team.length?a.team:[c],left=Math.min(...team.map(b=>b.x)),right=Math.max(...team.map(b=>b.x+b.width)),top=Math.min(...team.map(b=>b.y));
   return {x:(left+right)/2,y:Math.max(h*.24,top+h*.1)};
  }
  if(r.setPiece==='chimney-comet'){const t=a.targets[0]??a.enemies[0];return t?{x:t.x+t.width/2,y:t.y+t.height*.55}:{x:w*.75,y:h*.5};}
  // Mochi slams the ground just ahead of the shield.
  return {x:c.x+c.width/2+dir*c.width*.45,y:c.y+c.height*.96};
 }
 private loadCutin(asset:string,media:DesignerVideoMedia|undefined){
  this.cutin=undefined;this.cutinCrop=undefined;if(typeof Image==='undefined')return;
  const image=new Image();image.decoding='async';
  image.src=media?`/units/${asset}/designer/cutin.png`:`/units/${asset}/portrait.webp`;
  image.onerror=()=>{if(!image.src.endsWith('portrait.webp'))image.src=`/units/${asset}/portrait.webp`;};
  image.onload=()=>{
   const w=image.naturalWidth,h=image.naturalHeight;
   if(image.src.endsWith('cutin.png')&&media){
    // Head and shoulders: the upper ~52% of the opaque body, centred on the anchor.
    const m=media.meta,scale=w/m.width,margin=(m.marginPx??0)*scale,bodyH=m.heightPx*scale,top=margin;
    const cropH=bodyH*.52,cropW=Math.min(w,cropH*1.05),cx=m.anchor[0]*w;
    this.cutinCrop={x:Math.max(0,Math.min(w-cropW,cx-cropW/2)),y:Math.max(0,top-bodyH*.02),width:cropW,height:cropH};
   }else this.cutinCrop={x:0,y:0,width:w,height:Math.min(h,w*1.0)};
  };
  this.cutin=image;
 }
 private buildSilhouettes(media:DesignerVideoMedia){
  const r=this.recipe!,geometry=media.plane.geometry;
  this.rim=new T.Mesh(geometry,silhouetteMaterial(media.texture,r.palette.glow,0));this.rim.matrixAutoUpdate=false;this.rim.frustumCulled=false;this.group.add(this.rim);
  this.ghosts=[[45,.42],[90,.28],[140,.16]].map(([delay,alpha])=>{const mesh=new T.Mesh(geometry,silhouetteMaterial(media.texture,r.palette.accent,0));mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;this.group.add(mesh);return{mesh,delay:delay!,alpha:alpha!};});
 }
 private updateSilhouettes(at:number,root:T.Object3D|undefined,reduced:boolean){
  if(!this.rim||!this.media||!root)return;
  const plane=this.media.plane;plane.updateMatrix();
  const base=new T.Matrix4().multiplyMatrices(root.matrixWorld,plane.matrix);
  // Rim: grows in on the banner, peaks on impact, fades in the linger.
  const rimAlpha=reduced?0:at<ULT_TIMING.impact?.25+.45*Math.min(1,at/ULT_TIMING.impact):Math.max(0,.75*(1-(at-ULT_TIMING.impact)/700));
  const grow=new T.Matrix4().makeScale(1.045,1.03,1),order=(plane.renderOrder||0)-.5;
  this.rim.matrix.copy(base).multiply(grow);this.rim.material.opacity=rimAlpha;this.rim.renderOrder=order;this.rim.visible=rimAlpha>.01;
  this.history.push({t:at,matrix:base.clone()});while(this.history.length>30)this.history.shift();
  const lunging=at>=ULT_TIMING.lunge&&at<ULT_TIMING.impact+160;
  for(const g of this.ghosts){
   const snap=[...this.history].reverse().find(h=>h.t<=at-g.delay);
   g.mesh.visible=!reduced&&lunging&&!!snap;if(!snap)continue;
   g.mesh.matrix.copy(snap.matrix);g.mesh.material.opacity=g.alpha*(at<ULT_TIMING.impact?1:1-(at-ULT_TIMING.impact)/160);g.mesh.renderOrder=order-.1;
  }
 }
 private disposeSilhouettes(){
  for(const m of [this.rim,...this.ghosts.map(g=>g.mesh)])if(m){m.material.dispose();m.removeFromParent();}
  this.rim=undefined;this.ghosts=[];
 }
 end(){
  if(!this.recipe&&this.plan===null)return;
  if(this.media?.isHeld)this.media.release();
  this.media=undefined;this.plan=null;this.recipe=undefined;this.last=-1;this.lastNow=0;this.reach=0;this.hitstopUntil=0;this.frozenAt=0;
  this.disposeSilhouettes();this.painter.clear();this.audit.active=false;
 }
 dispose(){this.end();this.painter.dispose();this.group.removeFromParent();}
}
