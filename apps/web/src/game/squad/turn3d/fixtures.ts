/** Dev/offline inspection uses the real rules to produce resolved actions. */
import { createTurnBattle, startTurn, chooseAction, resolveAction, getLegalTargets, endTurn } from '@taskbar-hero/game-rules/src/squad/turn/engine';
import { TURN_KITS, TURN_SKILLS } from '@taskbar-hero/game-rules/src/squad/turn/config';
import type { Hero, TurnEvent, TurnBattle } from '@taskbar-hero/game-rules/src/squad/turn/types';

export interface EffectFixture { battle:TurnBattle; initial:TurnEvent[]; events:TurnEvent[]; requested:string }
export function createEffectFixture(requested:string):EffectFixture {
  const special:Record<string,string>={steadfast:'shieldBash',warmWick:'emberOrb',lastSip:'milkFlask',lastLight:'milkFlask',needleLantern:'witchBasic',status_apply:'threadSnare',status_expire:'rally',burn:'guardAttack',death:'guardianBasic',wave_clear:'guardianBasic',victory:'guardianBasic',defeat:'guardAttack'};
  const skillId=special[requested]??requested;
  const hero=Object.entries(TURN_KITS).find(([,kit])=>kit.includes(skillId))?.[0] as Hero|undefined;
  const boss=['yarnAttack','bindThread','crossSweep'].includes(skillId);
  const b=createTurnBattle({seed:11,encounter:boss?'boss':['victory','wave_clear','death'].includes(requested)?'dummy':'group',preset:requested==='needleLantern'?'lanternbreakers':'hearthkeepers'});
  let actor=b.actors.find(a=>a.id===hero)??b.actors.find(a=>`${a.role}Attack`===skillId)??b.actors.find(a=>a.role==='yarn');
  if(!actor&&skillId==='threadAttack'){
    // Obtain a real summoned thread by resolving the boss bind, then inspect Tighten.
    const parent=createEffectFixture('bindThread');const thread=parent.battle.actors.find(a=>a.role==='thread')!;
    b.actors.push(structuredClone(thread));b.queue.push({actorId:thread.id,at:0});b.intents[thread.id]=structuredClone(parent.battle.intents[thread.id]!);actor=b.actors.at(-1);
  }
  if(!actor&&skillId==='dummyAttack'){const a=createTurnBattle({encounter:'dummy'}).actors.find(a=>a.role==='dummy')!;b.actors.push(a);b.queue.push({actorId:a.id,at:0});actor=a;}
  if(!actor)throw Error(`No fixture actor for ${requested}`);
  b.actors.forEach(a=>{if(a.side==='party'){a.charge=100;a.hp=Math.round(a.maxHp*.55);}if(a.side==='enemy')a.hp=a.maxHp=Math.max(a.maxHp,600);});
  if(['death','wave_clear','victory'].includes(requested))b.actors.filter(a=>a.side==='enemy').forEach(a=>a.hp=1);
  if(requested==='defeat')b.actors.filter(a=>a.side==='party').forEach((a,i)=>a.hp=i?0:1);
  if(requested==='warmWick')b.actors.filter(a=>a.side==='enemy').forEach(a=>a.statuses.push({kind:'burn',source:'witch',turns:2,strength:1,appliedTurn:0}));
  if(requested==='burn')actor.statuses.push({kind:'burn',source:'witch',turns:2,strength:1,appliedTurn:-1});
  if(requested==='status_expire')actor.statuses.push({kind:'snare',source:'witch',turns:1,strength:1,appliedTurn:-1});
  if(actor.side==='enemy'){
    const friendly=TURN_SKILLS[skillId]!.target==='ally';const t=b.actors.find(a=>a.hp>0&&a.side===(friendly?'enemy':'party'))!;
    b.intents[actor.id]={actorId:actor.id,skillId,targetId:t.id,targetIds:[t.id],icon:TURN_SKILLS[skillId]!.icon,label:TURN_SKILLS[skillId]!.name,countdown:1,interrupted:false};
  }
  b.queue=b.queue.filter(s=>s.actorId!==actor.id);b.queue.unshift({actorId:actor.id,at:0});
  // Replace stale creation snapshots with a fresh complete snapshot of the documented fixture.
  const init:TurnEvent={version:2,seq:0,turn:0,actionId:0,beat:4,type:'snapshot',actorId:'',skillId:'',targetIds:[],amount:0,actors:structuredClone(b.actors),intents:structuredClone(b.intents),wave:b.wave,bossPhase:b.bossPhase};
  b.events=[init];startTurn(b);const initial=b.events.slice();
  const target=getLegalTargets(b,skillId).find(t=>t.legal&&(actor!.side!=='enemy'||t.actorId===b.intents[actor!.id]?.targetId))!;
  if(!target||!chooseAction(b,{actorId:actor.id,skillId,targetId:target.actorId}))throw Error(`Illegal fixture action ${requested}`);
  resolveAction(b);endTurn(b);let events=b.events.slice(initial.length);
  return {battle:b,initial,events,requested};
}
