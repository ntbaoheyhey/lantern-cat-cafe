import type {SceneView} from '../../squad/turn3d/scene';
import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
import {idlePhase,neutralPose} from './motion';

/** Spectators react to a resolved beat; no extra action or combat event is created. */
export function crowdPose(view:SceneView,unit:TurnActor,height:number){
 const pose=neutralPose(),frame=view.frame,result={pose,kind:'idle' as 'idle'|'cheer'|'flinch',age:0};
 if(view.reducedMotion||view.model||unit.hp<=0||!frame||unit.id===frame.plan.actorId)return result;
 const statuses=view.cardStatuses?.[unit.id]??[];
 if(statuses.some(s=>['freeze','stun'].includes(typeof s==='string'?s:s.id)))return result;
 const plan=frame.plan,caster=view.actors.find(a=>a.id===plan.actorId),hits=plan.events.filter(e=>e.type==='damage');
 if(hits.some(e=>e.targetIds.includes(unit.id)))return result;
 const impact=plan.beats[2]!.start,delay=idlePhase(unit.id)*18,age=frame.elapsed-impact-delay;
 if(age<0||age>650)return result;
 const cheering=caster?.side==='party'&&unit.side==='party'&&(plan.ultimate||hits.some(e=>e.critical));
 const bossHit=hits.some(e=>e.targetIds.some(id=>Object.hasOwn(view.bossPhases??{},id)));
 const flinching=unit.side==='enemy'&&caster?.side==='party'&&bossHit&&!Object.hasOwn(view.bossPhases??{},unit.id);
 if(!cheering&&!flinching)return result;
 const t=age/650,envelope=Math.sin(t*Math.PI),scale=height/720,phase=idlePhase(unit.id);
 result.kind=cheering?'cheer':'flinch';result.age=age;pose.phase='strike';
 pose.y=-(cheering?18+phase*2:4)*envelope*scale;
 pose.x=(cheering?Math.sin(phase)*5:15)*envelope*scale;
 pose.angle=(cheering?Math.sin(phase)*.14:.085)*envelope;
 pose.sx=1-(cheering?.045:.07)*envelope;pose.sy=1+(cheering?.075:.04)*envelope;
 return result;
}
