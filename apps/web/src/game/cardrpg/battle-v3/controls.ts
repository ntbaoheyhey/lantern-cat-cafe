import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {configureSequence,type CinematicMode,type SequencePlan} from './sequence';
import type {EffectPlan} from '../../squad/turn3d/effects';
export type {CinematicMode} from './sequence';
const sessions=new WeakMap<DepthModel,{auto:boolean;queued:Set<string>;cinematics:CinematicMode;seen:Map<string,number>}>();
export function battleControls(m:DepthModel){
 let value=sessions.get(m);
 if(!value){value={auto:true,queued:new Set(),cinematics:'full',seen:new Map()};sessions.set(m,value);}
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
 const controls=battleControls(m),choices=R.legalChoices(b);
 const ultimate=choices.find(c=>R.SKILLS[c.skillId]?.type==='ultimate');
 if(controls.queued.has(actor.id)&&ultimate){controls.queued.delete(actor.id);m.act(ultimate);return;}
 const chosen=R.chooseAction(b,'auto');
 m.act(R.SKILLS[chosen.skillId]?.type!=='ultimate'?chosen:choices.find(c=>R.SKILLS[c.skillId]?.type!=='ultimate'));
}
