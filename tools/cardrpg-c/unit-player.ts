import * as T from 'three';
import {loadSpineActor,type SpineActor} from '../../apps/web/src/game/cardrpg/spine/assets';
import {SPINE_UNITS} from '../../apps/web/src/game/cardrpg/spine/config';

/** Offline review uses the same cached actors as battle, with one independent state. */
export class UnitPlayer {
 readonly scene=new T.Scene();readonly camera=new T.OrthographicCamera(-650,650,1100,-200,.1,1000);
 readonly renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 actor?:SpineActor;clip='idle';elapsed=0;playing=true;active=false;ready=false;speed=1;
 private serial=0;private key={};private last=0;
 private unit=document.querySelector<HTMLSelectElement>('#unit-choose')!;
 private animation=document.querySelector<HTMLSelectElement>('#clip-choose')!;
 private status=document.querySelector<HTMLElement>('#unit-status')!;
 constructor(private host:HTMLElement){
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.camera.position.z=100;
  this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.setAttribute('aria-label','Character animation on a shared size grid');
  host.append(this.renderer.domElement);
  for(const unit of SPINE_UNITS){const option=new Option(unit.name,unit.id);this.unit.append(option);}
  this.unit.addEventListener('change',()=>{void this.load(this.unit.value);});
  this.animation.addEventListener('change',()=>this.selectClip(this.animation.value));
  document.querySelector('#unit-play')!.addEventListener('click',event=>{this.playing=!this.playing;(event.target as HTMLElement).textContent=this.playing?'Pause':'Play';});
  document.querySelector('#unit-speed')!.addEventListener('change',event=>{this.speed=Number((event.target as HTMLSelectElement).value);});
  document.querySelector('#unit-restart')!.addEventListener('click',()=>this.selectClip(this.clip));
  new ResizeObserver(()=>this.render(0)).observe(host);
  requestAnimationFrame(this.tick);
 }
 async load(id:string){
  const serial=++this.serial;this.ready=false;this.status.textContent='Opening character…';
  try{
   const actor=await loadSpineActor(id);
   if(serial!==this.serial){actor.dispose();return;}
   this.actor?.dispose();this.actor=actor;actor.setOrder(1);this.scene.add(actor.root);
   this.animation.replaceChildren(...[...actor.clips.keys()].map(clip=>new Option(clip,clip)));
   this.unit.value=id;this.ready=true;this.selectClip('idle');
  }catch(error){if(serial===this.serial)this.status.textContent='Could not open this character. '+String(error);}
 }
 selectClip(clip:string){this.clip=clip;this.animation.value=clip;this.elapsed=0;this.key={};this.render(0);}
 sample(clip:string,progress:number){if(this.clip!==clip)this.selectClip(clip);this.elapsed=this.actor!.duration(clip)*progress;this.render(0);}
 private tick=(now:number)=>{
  const dt=this.last?Math.min(.1,(now-this.last)/1000):0;this.last=now;
  if(this.active&&this.ready&&!document.hidden){
   if(this.playing){this.elapsed+=dt*this.speed;const duration=this.actor!.duration(this.clip),loop=['idle','idle-phase2','victory'].includes(this.clip);if(this.elapsed>duration+(loop?0:.7)){this.elapsed=loop?this.elapsed%duration:0;this.key={};}}
   this.render(dt);
  }
  requestAnimationFrame(this.tick);
 };
 private render(delta:number){
  if(!this.actor||!this.host.clientWidth||!this.host.clientHeight)return;
  const width=this.host.clientWidth,height=this.host.clientHeight;
  this.renderer.setSize(width,height,false);this.camera.left=-650*width/height;this.camera.right=650*width/height;this.camera.updateProjectionMatrix();
  this.host.style.setProperty('--grid-step',`${512/1300*height}px`);this.host.style.setProperty('--ground',`${1100/1300*height}px`);
  this.actor.sample(this.clip,this.key,Math.min(this.elapsed,this.actor.duration(this.clip)),delta,this.camera,false);
  this.renderer.render(this.scene,this.camera);
  const source=this.actor.source==='designer'?'Designer export':this.actor.source==='sequence'?'Designer PNG sequence':this.actor.source==='puppet'?'Legacy fallback':'Temporary rig';
  this.status.textContent=`${this.actor.unit.name} · ${this.clip} · ${this.actor.duration(this.clip).toFixed(2)} s · ${source} · ${Math.round(this.actor.bounds.height)} units (${this.actor.unit.side==='party'?'all cats':this.actor.unit.tier})`;
 }
}
