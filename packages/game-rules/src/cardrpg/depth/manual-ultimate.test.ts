import {describe,expect,it} from 'vitest';
import {createBattle,currentActor,enemyAct,act,legalChoices,skillById} from './battle';
import {chooseAction,chooseHeldAction,chooseUltimateAction} from './policies';
import {demoSetupV9} from './demo-v9';
import type {Battle} from './contract';
const isUlt=(id:string)=>skillById(id,true)?.type==='ultimate';
/** Advance with held ultimates until a party actor has a castable ultimate. */
function untilUltimate(b:Battle){
  for(let i=0;i<400&&!b.result;i++){
    const actor=currentActor(b);
    if(actor?.side==='enemy'){enemyAct(b);continue;}
    if(legalChoices(b).some(c=>isUlt(c.skillId)))return b;
    act(b,chooseHeldAction(b));
  }
  return b;
}
describe('player-timed ultimates',()=>{
  it('holds a charged ultimate when the player has not asked for it',()=>{
    const b=untilUltimate(createBattle(demoSetupV9('boss')));
    expect(b.result).toBeNull();
    expect(isUlt(chooseAction(b,'auto').skillId)).toBe(true);
    expect(isUlt(chooseHeldAction(b).skillId)).toBe(false);
  });
  it('casts the requested ultimate on the cat\'s turn and records it for replay',()=>{
    const b=untilUltimate(createBattle(demoSetupV9('boss')));
    const choice=chooseUltimateAction(b)!;
    expect(choice).not.toBeNull();expect(isUlt(choice.skillId)).toBe(true);
    expect(act(b,choice)).toBe(true);
    expect(b.choices.at(-1)).toEqual(choice);
  });
  it('returns null when no ultimate is castable this turn',()=>{
    const b=createBattle(demoSetupV9('wave'));
    while(currentActor(b)?.side==='enemy')enemyAct(b);
    if(!legalChoices(b).some(c=>isUlt(c.skillId)))expect(chooseUltimateAction(b)).toBeNull();
  });
});
