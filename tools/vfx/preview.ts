import {SpineScene} from '../../apps/web/src/game/cardrpg/spine/scene';
import {pilotFixture} from '../../apps/web/src/game/cardrpg/vfx-layered/fixture';
import {PAINT_TIMELINES} from '../../apps/web/src/game/cardrpg/vfx-layered/player';
import {project} from '../../apps/web/src/game/cardrpg/depth/scene-actors';
import {sampleActionPlan} from '../../apps/web/src/game/squad/turn3d/effects';
import type {SceneView} from '../../apps/web/src/game/squad/turn3d/scene';
import {artPropsA6 as portraitProps} from '../../apps/web/src/game/cardrpg/ui-v3/art-a6';
import {puppetNumberRows} from '../../apps/web/src/game/squad/turn3d/look-puppet-numbers';
const host=document.querySelector<HTMLElement>('#stage')!,select=document.querySelector<HTMLSelectElement>('#skill')!,scrub=document.querySelector<HTMLInputElement>('#scrub')!,status=document.querySelector<HTMLOutputElement>('#status')!,cutin=document.querySelector<HTMLElement>('#cutin')!;
let id='mochi-1',fixture=pilotFixture(id),view:SceneView,scene:SpineScene,elapsed=0,last=0,paused=false,manual=false,reduced=false,before=false;
const measurements:number[]=[];
function populate(){view={actors:project(fixture.battle),battleKey:fixture.battle.initial,models:Object.fromEntries(fixture.battle.actors.map(a=>[a.id,a.catalogId])),rows:Object.fromEntries(fixture.battle.actors.map(a=>[a.id,a.row])),cardNumberRows:Object.fromEntries(puppetNumberRows(fixture.plan).map(row=>[row.id,row.labels.length])),formationC2:true,layeredVfx:!before,frame:null,currentId:fixture.plan.actorId,targetIds:fixture.plan.targetIds,legalIds:[],paused:true,reducedMotion:reduced,galleryPreview:true,autoBattle:true,boss:true};}
function choose(value:string){id=value;fixture=pilotFixture(id);elapsed=0;populate();select.value=id;scrub.max=String(fixture.plan.duration);scene?.effects.clear();scene?.prepare(view);
 const layerHost=document.querySelector('#layers')!;layerHost.replaceChildren();
 for(const l of PAINT_TIMELINES.get(id)!.layers){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.value=l.name;label.append(input,l.name);layerHost.append(label);input.onchange=()=>{scene.effects.layered.onlyLayers=new Set([...layerHost.querySelectorAll<HTMLInputElement>('input:checked')].map(e=>e.value));sample(elapsed);};}
 if(scene)scene.effects.layered.onlyLayers=null;
}
function sample(at:number){elapsed=at;view.frame=sampleActionPlan(fixture.plan,Math.min(at,fixture.plan.duration),reduced);view.fixedTime=3+at/1000;view.reducedMotion=reduced;view.layeredVfx=!before;const begin=performance.now();scene.render(view,0);measurements.push(performance.now()-begin);if(measurements.length>600)measurements.shift();
 scrub.value=String(at);document.querySelector('#num')!.textContent=Math.round(at)+' ms';cutin.hidden=id!=='mochi-4'||reduced||at<90||at>600;
 status.textContent=`${before?'Before':'Painted'} · ${scene.effects.layered.stats.draws} layers`;
}
for(const t of PAINT_TIMELINES.values()){const option=document.createElement('option');option.value=t.id;option.textContent=t.name;select.append(option);}
choose(id);scene=new SpineScene(host,()=>view,()=>{},()=>{},message=>{status.textContent=message;});
const portrait=document.querySelector<HTMLImageElement>('#portrait')!;portrait.src=portraitProps('mochi').src;
function tick(now:number){const dt=last?Math.min(100,now-last):0;last=now;if(!manual&&!paused&&scene.ready){elapsed+=dt;if(elapsed>fixture.plan.duration+700){fixture=pilotFixture(id);elapsed=0;populate();scene.effects.clear();scene.prepare(view);}sample(elapsed);}requestAnimationFrame(tick);}requestAnimationFrame(tick);
select.onchange=()=>choose(select.value);scrub.oninput=()=>{paused=true;sample(Number(scrub.value));};document.querySelector<HTMLButtonElement>('#play')!.onclick=e=>{paused=!paused;(e.target as HTMLElement).textContent=paused?'Play':'Pause';};
document.querySelector<HTMLInputElement>('#before')!.onchange=e=>{before=(e.target as HTMLInputElement).checked;scene.effects.clear();sample(elapsed);};
document.querySelector<HTMLInputElement>('#reduced')!.onchange=e=>{reduced=(e.target as HTMLInputElement).checked;sample(elapsed);};
Object.assign(window,{vfxPreview:{scene,choose,sample,setManual:(v:boolean)=>manual=v,setBefore:(v:boolean)=>{before=v;scene.effects.clear();},setReduced:(v:boolean)=>reduced=v,get fixture(){return fixture;},get view(){return view;},measurements}});
