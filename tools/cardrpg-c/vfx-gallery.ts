import {SpineScene} from '../../apps/web/src/game/cardrpg/spine/scene';
import {galleryFixture} from '../../apps/web/src/game/cardrpg/depth/feel-lab';
import {project} from '../../apps/web/src/game/cardrpg/depth/scene-actors';
import {sampleActionPlan} from '../../apps/web/src/game/squad/turn3d/effects';
import type {SceneView} from '../../apps/web/src/game/squad/turn3d/scene';
import {PAINTED_VFX,PAINTED_STATUSES} from '../../apps/web/src/game/cardrpg/spine/vfx-registry';
import {SPINE_UNIT_BY_ID} from '../../apps/web/src/game/cardrpg/spine/config';
import {UnitPlayer} from './unit-player';
const host=document.querySelector<HTMLElement>('#stage')!,title=document.querySelector<HTMLElement>('#effect-title')!,detail=document.querySelector<HTMLElement>('#detail')!,status=document.querySelector<HTMLElement>('#status')!,choose=document.querySelector<HTMLSelectElement>('#choose')!;
let fixture=galleryFixture('mochi-1'),view:SceneView,scene:SpineScene,elapsed=0,time=0,last=0,speed=1,paused=false,reduced=false,selected='mochi-1',manual=false,units:UnitPlayer|undefined,mode='effects';
function populate(){view={actors:project(fixture.battle),models:Object.fromEntries(fixture.battle.actors.map(a=>[a.id,a.catalogId])),frame:null,currentId:fixture.plan.actorId,targetIds:fixture.plan.targetIds,legalIds:[],paused:true,reducedMotion:reduced,galleryPreview:true,autoBattle:true,boss:SPINE_UNIT_BY_ID.get(fixture.action.owner)?.tier==='boss',cardNumberRows:Object.fromEntries(fixture.plan.targetIds.map(id=>[id,1]))};}
function select(id:string){selected=id;const isStatus=id.startsWith('status:'),spec=isStatus?PAINTED_STATUSES.find(s=>s.id===id.slice(7)):PAINTED_VFX.get(id);fixture=galleryFixture(isStatus?'mochi-1':id);elapsed=0;time=3;populate();if(isStatus)view.cardStatuses={[view.actors[0]!.id]:[id.slice(7)]};scene?.effects.clear();scene?.prepare(view);choose.value=id;title.textContent=spec?.name??id;detail.textContent=isStatus?`${id.slice(7)} · persistent foot-level cue`:`${fixture.action.owner} · ${fixture.action.ultimate?'Ultimate':fixture.action.enemy?'Enemy action':'Cat action'} · ${id}`;}
for(const unit of SPINE_UNIT_BY_ID.values()){const group=document.createElement('optgroup');group.label=unit.name;for(const skill of unit.skills){const option=document.createElement('option');option.value=skill.id;option.textContent=skill.name;group.append(option);}choose.append(group);}
const group=document.createElement('optgroup');group.label='Status keywords';for(const s of PAINTED_STATUSES){const option=document.createElement('option');option.value='status:'+s.id;option.textContent=s.name+' · '+s.id;group.append(option);}choose.append(group);
select('mochi-1');scene=new SpineScene(host,()=>view,()=>{},()=>{},message=>{status.textContent=message;});
function sample(at:number){elapsed=at;view.frame=selected.startsWith('status:')?null:sampleActionPlan(fixture.plan,Math.min(at,fixture.plan.duration),reduced);view.fixedTime=time;view.reducedMotion=reduced;view.playbackSpeed=speed;scene.render(view,0);}
function tick(now:number){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(mode==='effects'&&!document.hidden&&!manual&&scene.ready&&!paused){time+=dt*speed;elapsed+=dt*1000*speed;if(elapsed>fixture.plan.duration+900){fixture=galleryFixture(fixture.action.id);elapsed=0;scene.effects.clear();}sample(elapsed);}if(!manual)status.textContent=scene.ready?`${PAINTED_VFX.size} skills · ${PAINTED_STATUSES.length} statuses · ${scene.stats.calls} GPU draws · ${scene.effects.stats.active} / 256 particles`:'Lighting the lanterns…';requestAnimationFrame(tick);}
requestAnimationFrame(tick);
choose.addEventListener('change',()=>select(choose.value));
document.querySelector('#previous')!.addEventListener('click',()=>{choose.selectedIndex=(choose.selectedIndex+choose.options.length-1)%choose.options.length;select(choose.value);});
document.querySelector('#next')!.addEventListener('click',()=>{choose.selectedIndex=(choose.selectedIndex+1)%choose.options.length;select(choose.value);});
document.querySelector('#speed')!.addEventListener('change',event=>{speed=Number((event.target as HTMLSelectElement).value);});
document.querySelector('#pause')!.addEventListener('click',event=>{paused=!paused;(event.target as HTMLButtonElement).textContent=paused?'Play':'Pause';});
document.querySelector('#motion')!.addEventListener('change',event=>{reduced=(event.target as HTMLInputElement).checked;sample(elapsed);});
Object.assign(window,{vfxGallery:{scene,select,setSpeed:(value:number)=>{speed=value;},manual:(value:boolean)=>{manual=value;},sample:(at:number,t:number)=>{time=t;sample(at);},get fixture(){return fixture;},get view(){return view;}}});
function setMode(next:string){
 mode=next;document.querySelector<HTMLElement>('#effects-panel')!.hidden=mode!=='effects';document.querySelector<HTMLElement>('#units-panel')!.hidden=mode!=='units';
 document.querySelectorAll<HTMLButtonElement>('[data-gallery-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.galleryMode===mode)));
 if(mode==='units'&&!units){units=new UnitPlayer(document.querySelector<HTMLElement>('#unit-stage')!);Object.assign(window,{unitPlayer:units});void units.load('mochi');}
 if(units)units.active=mode==='units';
}
document.querySelectorAll<HTMLButtonElement>('[data-gallery-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.galleryMode!)));
setMode(new URLSearchParams(location.search).get('mode')==='units'?'units':'effects');
