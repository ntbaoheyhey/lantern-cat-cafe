/** Validated designer exports are preloaded once, with independent reusable Spine states. */
import * as T from 'three';
import type { SkeletonMesh } from '@esotericsoftware/spine-threejs';
import registry from '../../../../../../assets/cardrpg-look/vfx-designer/registry.json';
import { loadSkeleton, spineAssetUrl } from './assets';
import type { SpineSocket } from './config';
export interface VfxOverride {format:'sequence'|'spine';frames?:string[];fps?:number;skeleton?:string;atlas?:string;animation?:string;scale:number;width:number;height:number;socket:SpineSocket;cue:'hit'|'cast';revision?:string}
interface Player {active:boolean;at:number;born:number;target:string;mesh?:SkeletonMesh}
interface ReadyEffect {spec:VfxOverride;duration:number;images:HTMLImageElement[];players:Player[]}
export class DesignerVfx {
 readonly effects=new Map<string,ReadyEffect>();readonly warnings:string[]=[];
 readonly stats={draws:0,active:0,ready:0};private renderer?:T.WebGLRenderer;private scene=new T.Scene();private camera=new T.OrthographicCamera(-256,256,256,-256,.1,1000);private disposed=false;
 async prepare(overrides:Record<string,VfxOverride>=registry.effects){
  for(const [id,spec] of Object.entries(overrides))try{
   let images:HTMLImageElement[]=[],players:Player[]=[],duration=0;
   if(spec.format==='sequence'){
    for(const path of spec.frames??[]){const image=new Image();image.src=spineAssetUrl(path);await image.decode();images.push(image);}duration=images.length/(spec.fps??24);players=Array.from({length:8},()=>({active:false,at:0,born:0,target:''}));
   }else{
    const data=await loadSkeleton({skeleton:spec.skeleton!,atlas:spec.atlas!,scale:spec.scale});const animation=data.clips.get(spec.animation??'effect');if(!animation)throw Error('Missing effect clip');duration=animation.duration;
    if(!this.renderer){this.renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});this.renderer.setSize(512,512);this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=T.SRGBColorSpace;this.camera.position.z=100;}
    players=Array.from({length:8},()=>({active:false,at:0,born:0,target:'',mesh:data.create()}));
   }
   if(this.disposed){players.forEach(p=>p.mesh?.dispose());return;}if(duration<=0)throw Error('Empty effect');this.effects.set(id,{spec,duration,images,players});
  }catch(error){this.warnings.push(`${id}: ${String(error)}; keeping painted fallback.`);}
  this.stats.ready=this.effects.size;
 }
 emit(id:string,cue:string,targets:readonly string[]|string,time:number){const effect=this.effects.get(id);if(!effect||effect.spec.cue!==cue)return false;for(let index=0;index<(typeof targets==='string'?1:targets.length);index++){const target=typeof targets==='string'?targets:targets[index]!;const player=effect.players.find(p=>!p.active);if(!player)continue;player.active=true;player.at=0;player.born=time;player.target=target;if(player.mesh){player.mesh.skeleton.setToSetupPose();player.mesh.state.clearTracks();player.mesh.state.setAnimation(0,effect.spec.animation??'effect',false);}}return true;}
 render(time:number,draw:(image:CanvasImageSource,target:string,spec:VfxOverride)=>void){this.stats.draws=0;this.stats.active=0;for(const effect of this.effects.values())for(const p of effect.players){if(!p.active)continue;const age=Math.max(0,time-p.born);if(age>=effect.duration){p.active=false;continue;}this.stats.active++;if(p.mesh&&this.renderer){p.mesh.update(Math.max(0,age-p.at));p.at=age;this.scene.add(p.mesh);const size=Math.max(effect.spec.width,effect.spec.height)*effect.spec.scale;this.camera.left=this.camera.bottom=-size/2;this.camera.right=this.camera.top=size/2;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);this.stats.draws+=this.renderer.info.render.calls;draw(this.renderer.domElement,p.target,effect.spec);p.mesh.removeFromParent();}else{const frame=effect.images[Math.min(effect.images.length-1,Math.floor(age*(effect.spec.fps??24)))];if(frame)draw(frame,p.target,effect.spec);}}}
 clear(){for(const effect of this.effects.values())for(const p of effect.players)p.active=false;}
 dispose(){this.disposed=true;this.clear();for(const effect of this.effects.values())for(const p of effect.players)p.mesh?.dispose();this.effects.clear();this.renderer?.dispose();this.renderer?.forceContextLoss();}
}
