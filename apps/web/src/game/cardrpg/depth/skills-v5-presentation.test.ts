import {expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARDS} from '@taskbar-hero/game-rules/src/cardrpg/catalog';
import {snapshotBattle,splitPresentation} from './battle-presentation';
it('V5 snapshots isolate event growth and keep round-end ticks out of the impact beat',()=>{
  const b=R.createBattle({seed:1,chapter:1,gameplayV4:true,skillsV5:true,cats:['mochi','soot','clover'].map(id=>({id,stats:{...CARDS.find(c=>c.id===id)!.baseStats},skills:R.CAT_BY_ID[id]!.skills.map(s=>s.id),row:R.CAT_BY_ID[id]!.row})),enemies:['button-guard']});
  const target=b.actors[3]!,source=b.actors[0]!,before=snapshotBattle(b),oldEvents=before.v4!.events.length;
  const e=(kind:string,amount:number)=>({round:1,actorId:source.id,targetId:target.id,skillId:'mochi-1',kind,amount,text:''});
  b.log.push(e('reaction-damage',12));R.emitGameplayEvent(b,{kind:'reaction',reactionId:'rupture',primerIds:['snag','brittle'],targets:[target.id],sourceId:source.id,targetId:target.id,text:'Rupture'});
  b.log.push(e('action',0));b.procRounds.v5RoundEnd=1;b.log.push(e('dot',12));R.emitGameplayEvent(b,{kind:'status-tick',statusId:'scald',amount:12,sourceId:source.id,targetId:target.id,text:'Burn'});delete b.procRounds.v5RoundEnd;
  target.hp-=24;b.round++;
  expect(before.v4!.events).toHaveLength(oldEvents);
  const {impact,events,roundPlan}=splitPresentation(before,b,'mochi-1');
  expect(impact.actors[3]!.hp).toBe(before.actors[3]!.hp-12);
  expect(impact.v4!.events.some(e=>e.kind==='reaction')).toBe(true);
  expect(impact.v4!.events.some(e=>e.kind==='status-tick')).toBe(false);
  expect(events.some(e=>e.type==='damage'&&e.amount===12)).toBe(true);
  expect(roundPlan!.duration).toBeLessThanOrEqual(400);
  expect(b.v4!.events.some(e=>e.kind==='status-tick')).toBe(true);
});

import {DepthModel} from './model';
it('demo V5 opt-in reaches tutorial, resets and new routes while old active routes retain their rules',()=>{
 const ordinary=new DepthModel(true,true);expect(R.skillsV5(ordinary.state)).toBe(false);ordinary.tutorial();expect(ordinary.battle!.initial.skillsV5).toBeUndefined();
 const v5=new DepthModel(true,true,true);expect(R.skillsV5(v5.state)).toBe(true);v5.tutorial();expect(v5.battle!.initial.skillsV5).toBe(true);v5.reset();expect(R.skillsV5(v5.state)).toBe(true);
 const old=R.enterNode(R.startRun(R.setGameplayV4(R.createDepthAccount(4),true),1,4).state,'0-0').state;
 v5.import(R.exportSave(old));expect(v5.error).toBe(false);expect(v5.state.skillsV5).toBe(true);expect(v5.battle!.initial.skillsV5).toBeUndefined();
});
