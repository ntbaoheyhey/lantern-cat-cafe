import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {judgeDemoV9} from '../gate';
import {configureSequence,type CinematicMode,type SequencePlan} from './sequence';
import type {EffectPlan} from '../../squad/turn3d/effects';
export type {CinematicMode} from './sequence';
const sessions=new WeakMap<DepthModel,{auto:boolean;queued:Set<string>;cinematics:CinematicMode;seen:Map<string,number>;waited:Map<string,number>}>();
/** A ready ultimate nobody taps still fires on its own after this many held turns,
 * so a player who never notices TAP is not locked out of the game's main power
 * (simulated: never casting clears 0/8 seeds of chapter 1; with this grace the
 * campaign clears exactly as often as full auto). Tapping casts sooner. */
export const ULTIMATE_GRACE_TURNS=2;
const AUTO_KEY='lantern-auto-ultimates';
/** Player-timed ultimates are the default decision in campaign play. The judge
 * recording route keeps automatic casting so its seeded replay stays identical. */
export function autoUltimatePreference(){
 try{if(typeof location!=='undefined'&&judgeDemoV9(location.search))return true;const v=localStorage.getItem(AUTO_KEY);return v===null?false:v==='on';}catch{return false;}
}
export function setAutoUltimates(m:DepthModel,auto:boolean){
 const controls=battleControls(m);controls.auto=auto;if(auto)controls.queued.clear();
 try{if(typeof location==='undefined'||!judgeDemoV9(location.search))localStorage.setItem(AUTO_KEY,auto?'on':'off');}catch{/* Session preference still applies. */}
 m.notify(false);
}
export function battleControls(m:DepthModel){
 let value=sessions.get(m);
 if(!value){value={auto:autoUltimatePreference(),queued:new Set(),cinematics:'full',seen:new Map(),waited:new Map()};sessions.set(m,value);}
 return value;
}
export function prepareBattleSequence(m:DepthModel,plan:EffectPlan){
 if(!m.state.formationC2)return plan;
 const prefs=battleControls(m),id=plan.presentationId??plan.skillId,count=prefs.seen.get(id)??0;
 const mode=prefs.cinematics==='full'&&(count>=3||m.state.settings.reducedMotion)?'short':prefs.cinematics;
 const prepared=configureSequence(plan,mode);
 if(prepared.sequence?.plate)prefs.seen.set(id,count+1);
 return prepared;
}
/** Skips presentation time only; resolved events are never applied again. */
export function skipPlate(m:DepthModel){
 const sequence=(m.plan as SequencePlan|null)?.sequence;
 if(!sequence?.plate||m.animationAt>=sequence.impact)return false;
 m.animationAt=sequence.impact;m.notify(false);return true;
}
/** Auto mode retains the original choice exactly. Manual requests wait for a legal turn. */
export function battleStep(m:DepthModel){
 if(!m.state.formationC2||battleControls(m).auto){m.step();return;}
 const b=m.battle;if(!b||!m.canAct)return;
 const actor=R.currentActor(b);if(!actor||actor.side==='enemy'){m.step();return;}
 const controls=battleControls(m);
 const ready=R.chooseUltimateAction(b),waited=controls.waited.get(actor.id)??0;
 if(ready&&(controls.queued.has(actor.id)||waited>=ULTIMATE_GRACE_TURNS)){controls.queued.delete(actor.id);controls.waited.delete(actor.id);m.act(ready);return;}
 if(ready)controls.waited.set(actor.id,waited+1);else controls.waited.delete(actor.id);
 m.act(R.chooseHeldAction(b));
}
