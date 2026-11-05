import { createTurnBattle, startTurn, endTurn, chooseAction, resolveAction, getTimeline, getLegalActions, getLegalTargets, getAutoAction } from '@taskbar-hero/game-rules/src/squad/turn/engine';
import type { TurnBattle, TurnChoice, TurnOptions, TurnEvent, RoundSlot, Role } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { TurnPresenter } from './presenter';
import { createEffectFixture } from './fixtures';
import { createActionPlan, sampleActionPlan, type EffectFrame } from './effects';

/** Single synchronous writer. Presentation must drain before another rules boundary. */
export class TurnController {
  battle:TurnBattle=createTurnBattle({encounter:'campaign'});
  presenter=new TurnPresenter(); running=true; selectedSkill=''; hoverId='';
  mode:'battle'|'effects'|'models'='battle'; galleryId='lanternstorm';
  model={role:'guardian' as Role,clip:'idle',angle:.35};
  timeline:RoundSlot[]=[]; policy:'auto'|'active'='auto';
  captureFrame:EffectFrame|null=null; fixedTime:number|undefined;
  private cursor=0; private version=0;private listeners=new Set<()=>void>();private sinceNotify=0;private pendingNotify=true;private galleryWait=0;
  constructor(){this.flush();this.boundary();}
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);};
  snapshot=()=>this.version;
  notify=()=>{this.version++;for(const fn of this.listeners)fn();};
  get active(){return this.battle.actors.find(a=>a.id===this.battle.activeId);}
  get canChoose(){return this.mode==='battle'&&this.running&&!this.presenter.busy&&this.battle.phase==='choose'&&this.active?.side==='party'&&!this.active.auto;}
  get actions(){return getLegalActions(this.battle);}
  get targets(){return this.selectedSkill?getLegalTargets(this.battle,this.selectedSkill):[];}
  private flush(){const fresh=this.battle.events.slice(this.cursor);this.cursor=this.battle.events.length;this.presenter.push(fresh);this.timeline=getTimeline(this.battle);}
  private boundary(){
    if(this.mode!=='battle'||!this.running||this.presenter.busy||this.battle.result)return;
    if(this.battle.phase==='resolved'){endTurn(this.battle);this.flush();return;}
    if(this.battle.phase==='ready'){startTurn(this.battle);this.timeline=getTimeline(this.battle);this.flush();return;}
    if(this.battle.phase==='choose'&&(this.active?.side==='enemy'||this.active?.auto)){
      const choice=getAutoAction(this.battle,this.policy);if(choice)this.act(choice);
    }
  }
  tick(delta:number,hidden=false){
    if(hidden||!this.running||this.mode==='models'||this.fixedTime!==undefined)return;
    const wasBusy=this.presenter.busy,beforeSeq=this.presenter.appliedSeq;
    const ms=Math.min(100,Math.max(0,delta));this.presenter.tick(ms);
    if(this.mode==='effects'&&!this.presenter.busy){this.galleryWait+=ms;if(this.galleryWait>750)this.gallery(this.galleryId);}
    else this.boundary();
    this.pendingNotify ||= wasBusy||this.presenter.busy||beforeSeq!==this.presenter.appliedSeq;
    this.sinceNotify+=ms;if(this.sinceNotify>=33){this.sinceNotify=0;if(this.pendingNotify){this.pendingNotify=false;this.notify();}}
  }
  act(choice:TurnChoice){
    if(this.presenter.busy||!this.running||this.mode!=='battle')return false;
    if(!chooseAction(this.battle,choice))return false;
    this.selectedSkill='';this.hoverId='';resolveAction(this.battle);this.flush();this.notify();return true;
  }
  select(skill:string){if(!this.canChoose||!this.actions.some(a=>a.skill.id===skill&&a.legal))return;this.selectedSkill=skill;this.hoverId='';this.notify();}
  target(id:string){if(this.canChoose&&this.selectedSkill&&this.targets.some(t=>t.actorId===id&&t.legal))this.act({actorId:this.battle.activeId!,skillId:this.selectedSkill,targetId:id});}
  auto(id:string,enabled:boolean){const a=this.battle.actors.find(a=>a.id===id);if(a?.side==='party')a.auto=enabled;this.notify();}
  autoAll(enabled:boolean){this.battle.actors.filter(a=>a.side==='party').forEach(a=>a.auto=enabled);this.notify();}
  reset(options:TurnOptions={}){this.battle=createTurnBattle(options);this.cursor=0;this.mode='battle';this.selectedSkill='';this.hoverId='';this.captureFrame=null;this.fixedTime=undefined;this.presenter.reset();this.presenter.paused=false;this.running=true;this.flush();this.boundary();this.notify();}
  pause(){this.running=!this.running;this.presenter.paused=!this.running;this.notify();}
  skip(){this.presenter.skip();this.notify();}
  debugSnapshot(){const e:TurnEvent={version: 3,seq:this.battle.events.length,actionId:(this.battle.events.at(-1)?.actionId??0)+1,turn:this.battle.turn,round:this.battle.round,beat:4,type:'snapshot',actorId:'',skillId:'',targetIds:[],amount:0,actors:structuredClone(this.battle.actors),intents:structuredClone(this.battle.intents)};this.battle.events.push(e);this.flush();this.notify();}
  grantCharge(){if(this.presenter.busy)return;this.battle.actors.filter(a=>a.side==='party').forEach(a=>a.charge=100);this.debugSnapshot();}
  gallery(id:string){
    const fixture=createEffectFixture(id);this.mode='effects';this.galleryId=id;this.battle=fixture.battle;this.presenter.reset(fixture.initial);while(this.presenter.busy)this.presenter.skip();
    const type=['status_apply','status_expire','death','wave_clear','victory','defeat'].includes(id)?id:'passive';
    const special=fixture.events.find(e=>e.type===type&&(type!=='passive'||e.skillId===id));
    if(special){const cue=createActionPlan([special]);cue.events=[];this.captureFrame=sampleActionPlan(cue,0);}
    else this.captureFrame=null;
    this.presenter.push(fixture.events);this.galleryWait=0;this.running=true;this.presenter.paused=false;this.fixedTime=undefined;this.notify();
  }
  inspect(id:string,beat=2){this.gallery(id);const p=this.captureFrame?.plan??this.presenter.frame?.plan;if(!p)return;
    const at=p.beats[beat]!.start+p.beats[beat]!.duration*.45;const underlying=this.presenter.frame?.plan??p;const projectedAt=underlying.beats[beat]!.start+underlying.beats[beat]!.duration*.45;this.presenter.tick(projectedAt/this.presenter.playbackRate/(this.presenter.fast?1.8:1));this.captureFrame=sampleActionPlan(p,at,this.presenter.reducedMotion);this.fixedTime=1;this.notify();}
  get frame(){if(this.captureFrame&&this.fixedTime===undefined){const at=this.presenter.frame?.elapsed??this.captureFrame.plan.duration;return sampleActionPlan(this.captureFrame.plan,at,this.presenter.reducedMotion);}return this.captureFrame??this.presenter.frame;}
}
