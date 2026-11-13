import {expect,it} from 'vitest';
import {advanceBattleClock,type FinalHitPlan} from './final-hit';
const plan={finalHit:true,duration:1200,beats:[{start:0},{start:200},{start:500}]} as FinalHitPlan;
it('slows 200 authored milliseconds to half a second and stays independent of frame size',()=>{
 expect(advanceBattleClock(plan,420,500,false)).toBeCloseTo(620);
 expect(advanceBattleClock(plan,0,1500,false)).toBeCloseTo(1200);
 let at=0;for(let i=0;i<90;i++)at=advanceBattleClock(plan,at,1000/60,false);
 expect(at).toBeCloseTo(1200);
 expect(advanceBattleClock(plan,400,50,false)).toBeCloseTo(432);
});
it('keeps ordinary actions and reduced-motion playback at their original speed',()=>{
 expect(advanceBattleClock({...plan,finalHit:false},420,500,false)).toBe(920);
 expect(advanceBattleClock(plan,420,500,true)).toBe(920);
});
it.each([1,2,3])('holds the final contact at 0.4x for 500 real milliseconds at speed %s',speed=>{
 expect(advanceBattleClock(plan,420,500,false,speed)).toBeCloseTo(620);
 expect(advanceBattleClock(plan,620,100,false,speed)).toBeCloseTo(620+100*speed);
 expect(advanceBattleClock(plan,420,100,true,speed)).toBe(420+100*speed);
});

import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
it.each([1,2,3])('resolves the same seeded encounter at speed %s and slows only the wave-ending plan',speed=>{
 const m=new DepthModel(true,true,true,true,true),account=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
 for(const c of account.account.cards){c.level=6;account.skills[c.cardId]=R.CAT_BY_ID[c.cardId]!.skills.map(s=>s.id);}
 m.state=account;m.state.settings.speed=speed;m.state.settings.reducedMotion=false;
 const battle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(account),enemies:['button-guard','sock-skipper','teacup-healer','needle-moth']});
 battle.v4!.committed=true;m.tutorialBattle=battle;m.watching=true;m.sceneReady=true;m.sceneStarted=true;
 const expected=structuredClone(battle);R.playBattle(expected,'auto');let slowed=0,now=0;const seen=new Set();
 for(let i=0;i<50000&&m.watching;i++){
  if(!m.plan&&!battle.result)m.step();
  if(m.plan&&!seen.has(m.plan)){seen.add(m.plan);if((m.plan as FinalHitPlan).finalHit){slowed++;expect(m.plan.events.some(e=>e.type==='death')).toBe(true);expect(battle.actors.filter(a=>a.side==='enemy').every(a=>a.hp<=0)).toBe(true);}}
  m.tick(50,now+=50);
 }
 expect(slowed).toBe(1);expect(battle).toEqual(expected);expect(m.screen).toBe('result');
});
