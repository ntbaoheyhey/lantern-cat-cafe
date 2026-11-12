import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
export type CinematicMode='full'|'short'|'off';
const sessions=new WeakMap<DepthModel,{auto:boolean;queued:Set<string>;cinematics:CinematicMode}>();
export function battleControls(m:DepthModel){
 let value=sessions.get(m);
 if(!value){value={auto:true,queued:new Set(),cinematics:'full'};sessions.set(m,value);}
 return value;
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
