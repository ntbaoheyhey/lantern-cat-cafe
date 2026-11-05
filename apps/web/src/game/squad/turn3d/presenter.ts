import type { TurnActor, TurnEvent, TurnIntent, TurnResult } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { createActionPlan, sampleActionPlan, type EffectFrame, type EffectPlan } from './effects';

export interface PresentedState { actors:TurnActor[]; intents:Record<string,TurnIntent>; wave:number; bossPhase:number; result:TurnResult|null; currentId:string|null; turn:number; round:number }
const initial=():PresentedState=>({actors:[],intents:{},wave:0,bossPhase:0,result:null,currentId:null,turn:0,round:1});
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const visible=new Set(['action_start','damage','heal','shield','passive','status_apply','status_expire','death','wave_clear','victory','defeat','fizzle']);

/** Consumes resolved events only. There is intentionally no Battle/engine reference. */
export class TurnPresenter {
  playbackRate=1; fast=false; reducedMotion=false; paused=false;
  state:PresentedState=initial();
  readonly recent:TurnEvent[]=[];
  appliedSeq=-1;
  private queuedSeq=-1;
  private queue:EffectPlan[]=[];
  private active:EffectPlan|null=null;
  private elapsed=0;
  private appliedIndex=0;
  get busy(){return this.active!==null||this.queue.length>0;}
  get frame():EffectFrame|null{return this.active?sampleActionPlan(this.active,this.elapsed,this.reducedMotion):null;}
  get pendingPlans(){return this.queue.length+(this.active?1:0);}
  push(events:readonly TurnEvent[]){
    const fresh=events.filter(e=>e.seq>this.queuedSeq);if(!fresh.length)return;
    let expected=this.queuedSeq+1;for(const e of fresh){if(e.seq!==expected++)throw Error(`Event gap: expected ${expected-1}, received ${e.seq}`);}
    const groups:TurnEvent[][]=[];for(const e of fresh){const last=groups.at(-1);if(last?.[0]?.actionId===e.actionId)last.push(clone(e));else groups.push([clone(e)]);}
    if(this.queue.length+groups.length>256)throw Error('Presenter queue exceeded its bounded capacity.');
    for(const group of groups){const plan=createActionPlan(group);if(group[0]?.actionId===0||!group.some(e=>visible.has(e.type)))plan.duration=0;this.queue.push(plan);
      // Passive and KO follow-ups are derived visual cues. Their events have already
      // resolved in the main action; empty event lists ensure they never apply twice.
      if(group.some(e=>e.type==='action_start'))for(const e of group.filter(e=>e.type==='passive'||e.type==='death'||e.type==='gear_proc')){
        const cue=createActionPlan([e]);cue.events=[];this.queue.push(cue);
      }
    }
    for(const e of fresh.filter(e=>e.type==='boss_phase'||(e.type==='wave_start'&&e.bossPhase===1))){
      const boss=e.actors?.find(a=>a.role==='yarn')??fresh.flatMap(x=>x.actors??[]).find(a=>a.role==='yarn');
      const cue=createActionPlan([{...e,type:'boss_phase',actorId:boss?.id??e.actorId,targetIds:boss?[boss.id]:[e.actorId]}]);cue.events=[];this.queue.push(cue);
    }
    this.queuedSeq=fresh.at(-1)!.seq;this.begin();
  }
  private begin(){
    while(!this.active&&this.queue.length){this.active=this.queue.shift()!;this.elapsed=0;this.appliedIndex=0;
      if(this.active.duration===0){this.applyThrough(Infinity);this.active=null;}else this.applyThrough(0);
    }
  }
  private apply(e:TurnEvent){
    if(e.seq<=this.appliedSeq)return;
    if(e.seq!==this.appliedSeq+1)throw Error('Presentation must apply each event in recorded order.');
    if(e.actors){if(e.type==='snapshot'||e.type==='wave_start'||e.type==='turn_start'||e.type==='victory'||e.type==='defeat')this.state.actors=clone(e.actors);
      else for(const a of e.actors){const i=this.state.actors.findIndex(x=>x.id===a.id);if(i>=0)this.state.actors[i]=clone(a);else this.state.actors.push(clone(a));}}
    if(e.intents)this.state.intents=clone(e.intents);
    if(e.wave!==undefined)this.state.wave=e.wave;if(e.bossPhase!==undefined)this.state.bossPhase=e.bossPhase;
    if(e.result)this.state.result=clone(e.result);if(e.type==='turn_start')this.state.currentId=e.actorId;if(e.type==='turn_end')this.state.currentId=null;
    this.state.turn=e.turn;this.state.round=e.round;this.appliedSeq=e.seq;this.recent.push(e);if(this.recent.length>40)this.recent.shift();
  }
  private applyThrough(elapsed:number){
    const p=this.active;if(!p)return;
    while(this.appliedIndex<p.events.length){const e=p.events[this.appliedIndex]!;const at=p.beats[Math.min(4,Math.max(0,e.beat))]!.start;
      if(at>elapsed)break;this.apply(e);this.appliedIndex++;}
  }
  tick(deltaMs:number){
    if(this.paused||!Number.isFinite(deltaMs)||deltaMs<=0)return;
    let remaining=deltaMs*Math.max(1,Math.min(4,this.playbackRate))*(this.fast?1.8:1);this.begin();
    while(this.active&&remaining>0){const take=Math.min(remaining,this.active.duration-this.elapsed);this.elapsed+=take;remaining-=take;this.applyThrough(this.elapsed);
      if(this.elapsed>=this.active.duration){this.applyThrough(Infinity);this.active=null;this.begin();}else break;}
  }
  /** Finish the current visual action; never choose or resolve a rules action. */
  skip(){if(this.active){this.applyThrough(Infinity);this.active=null;this.begin();}}
  reset(events:readonly TurnEvent[]=[]){this.state=initial();this.queue=[];this.active=null;this.elapsed=0;this.appliedIndex=0;this.queuedSeq=-1;this.appliedSeq=-1;this.recent.length=0;this.push(events);}
}
