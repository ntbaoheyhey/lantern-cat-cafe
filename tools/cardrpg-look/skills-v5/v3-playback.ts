// Viewer-only playback of A's published snapshots. No R.act/enemyAct or Skills V5 rules import.
import * as R from '../../../packages/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../../../apps/web/src/game/cardrpg/depth/model';
import { presentationEvents } from '../../../apps/web/src/game/cardrpg/depth/battle-presentation';
import { createCardActionPlan } from '../../../apps/web/src/game/cardrpg/depth/card-action-plan';
import { applyV5Presentation, type V5Event, type V5Plan } from '../../../apps/web/src/game/squad/turn3d/card-v5-events';
import { statusPresentation } from '../../../apps/web/src/game/squad/turn3d/card-status-beats';
import source from './v3-source.json';
export const fixtureSource=source;
export const caseNames=['bleed','bitter','crumb-burst','wildfire','rupture','spread','splash','multi-hit','bounce'] as const;
type Row=typeof source.fixtures[number];
type Action=Row['actions'][number];
const chosen=new Map<string,{row:Row;action:Action}>();
for(const row of source.fixtures)for(const action of row.actions){
 const events=row.events.filter(e=>e.actionId===action.actionId),logs=row.log.slice(action.logStart,action.logEnd);
 for(const name of caseNames){
  if(chosen.has(name))continue;
  const found=name==='bleed'?events.some(e=>e.kind==='status-tick'&&'statusId'in e&&e.statusId==='snag'&&'amount'in e&&Number(e.amount)>0)
   :name==='bitter'?action.before.some(a=>a.statuses.some(s=>s.id==='bitter')&&logs.some(e=>e.kind==='heal'&&e.targetId===a.id&&e.amount>0))
   :['splash','multi-hit','bounce'].includes(name)?events.some(e=>e.kind==='multi-hit'&&'shape'in e&&e.shape===name&&(name!=='multi-hit'||new Set('targets'in e?e.targets:[]).size<3))
   :events.some(e=>e.kind==='reaction'&&'reactionId'in e&&e.reactionId===name)&&(name!=='rupture'||action.before.some(a=>a.statuses.some(s=>s.id==='snag')&&!action.after.find(b=>b.id===a.id)?.statuses.some(s=>s.id==='snag')));
  if(found)chosen.set(name,{row,action});
 }
}
export function fixtureFrame(row:Row,action:Action){
 const battle=R.createBattle({...row.initial,gameplayV4:false,skillsV5:false} as unknown as R.BattleSetup);
 const logs=row.log.slice(action.logStart,action.logEnd),marker=logs.find(e=>e.kind==='action'||e.kind==='enemy-action');
 const skillId=marker?.skillId||'round-status';
 battle.round=action.round;battle.queue=[action.actorId,...battle.queue.filter(id=>id!==action.actorId)];battle.log=row.log.slice(0,action.logEnd) as R.BattleEvent[];
 const events=presentationEvents(logs as R.BattleEvent[],battle,skillId),targets=[...new Set(events.flatMap(e=>e.targetIds))];
 const actor=battle.actors.find(a=>a.id===action.actorId)!;
 const start={version:3 as const,seq:0,turn:0,round:action.round,actionId:action.logEnd,beat:0,type:'action_start' as const,actorId:action.actorId,skillId,targetIds:targets,amount:0};
 const plan=createCardActionPlan([start,...events],actor?.side==='enemy'?`enemy:${actor.catalogId}`:skillId) as V5Plan;
 plan.v5={logStart:action.logStart,events:row.events.filter(e=>e.actionId===action.actionId),before:action.before,after:action.after};
 const apply=(side:'before'|'after')=>{for(const a of battle.actors){const snap=action[side].find(s=>s.id===a.id);if(snap){a.hp=snap.hp;a.shield=snap.shield;a.statuses=structuredClone(snap.statuses) as R.Status[];}}};
 apply('after');
 const presentation=applyV5Presentation(plan,statusPresentation(plan,battle.log),plan.v5);
 const cueAt=Math.max(plan.beats[2]!.start,...(presentation.reactions??[]).map(r=>r.at),...(presentation.landings??[]).map(r=>r.at));
 return {battle,plan,before:action.before,after:action.after,fixtureId:row.id,actionId:action.actionId,at:cueAt+110};
}
export function selectedFixture(name:string){const selected=chosen.get(name);if(!selected)throw Error(`No published fixture for ${name}`);return fixtureFrame(selected.row,selected.action)}
function prepareViewer(m:DepthModel){
 if(!m.galleryBattle)m.inspect(m.galleryId,-1);
 m.sceneStarted=true;
}
export function mountFixture(m:DepthModel,name:string,play=false){
 prepareViewer(m);const frame=selectedFixture(name);m.galleryBattle=structuredClone(frame.battle);m.plan=structuredClone(frame.plan);m.animationAt=play?0:frame.at;m.paused=!play;m.gallerySpeed=1;m.camera='wide';m.notify(false);return frame;
}
export function startFixtureFilm(m:DepthModel,id='spread'){
 prepareViewer(m);
 const row=source.fixtures.find(f=>f.id===id)!;let index=0,raf=0,applied=false;
 const next=()=>{const action=row.actions[index++];if(!action)return false;const f=fixtureFrame(row,action);m.galleryBattle=f.battle;m.plan=f.plan;m.animationAt=0;m.paused=false;m.gallerySpeed=1;applied=false;for(const a of m.galleryBattle.actors){const s=f.before.find(s=>s.id===a.id);if(s){a.hp=s.hp;a.shield=s.shield;a.statuses=structuredClone(s.statuses) as R.Status[]}}m.notify(false);return true;};
 next();
 const tick=()=>{if(!m.galleryBattle)return;if(m.plan&&m.impactVisible&&!applied){for(const a of m.galleryBattle.actors){const s=(m.plan as V5Plan).v5!.after.find(s=>s.id===a.id);if(s){Object.assign(a,structuredClone(s));}}applied=true;m.notify(false);}if(!m.plan&&!next())return;raf=requestAnimationFrame(tick);};
 raf=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(raf);
}
export type FixtureFrame=ReturnType<typeof fixtureFrame>;
// Retain the published event type at this boundary for downstream integration tests.
export type PublishedEvent=V5Event;
