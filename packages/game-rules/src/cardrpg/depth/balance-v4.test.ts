import {describe,expect,it} from 'vitest';
import {clone} from '../internal';
import * as R from './index';
const cats=()=>{const s=R.setGameplayV4(R.createDepthAccount(23),true);s.account.cards.forEach(c=>c.level=6);return R.battleCats(s);};
const battle=(enabled=true)=>R.createBattle({seed:19,chapter:1,cats:cats(),enemies:['yarn-giant'],gameplayV4:enabled,challengeLevel:6});
describe('v4 balance safety',()=>{
 it('keeps every nested committed field untouched during automatic lookahead',()=>{
  for(const enabled of [false,true])for(const chapter of [1,2,3]){
   const b=R.createBattle({seed:23,chapter,cats:cats(),enemies:[R.CHAPTERS[chapter-1]!.boss],gameplayV4:enabled,challengeLevel:6});
   for(let step=0;step<12&&!b.result;step++){
    if(R.currentActor(b)?.side==='enemy')R.enemyAct(b);
    else {const before=clone(b),choice=R.chooseAction(b,'auto');expect(b).toEqual(before);expect(R.act(b,choice)).toBe(true);}
   }
   expect(R.replayBattle(b.initial,b.choices)).toEqual(b);
  }
 });
 it('does not renew the Mossbrew Cozy bonus by waiting for another own turn',()=>{
  const b=battle(),actor=b.actors[2]!;actor.setEffects=['steep-cozy'];
  R.applyStatus(b,actor,actor,'steep');expect(R.stacks(actor,'cozy')).toBe(1);
  actor.statuses=[];actor.turns+=2;R.applyStatus(b,actor,actor,'steep');expect(R.stacks(actor,'cozy')).toBe(0);
  const next=battle(),fresh=next.actors[2]!;fresh.setEffects=['steep-cozy'];R.applyStatus(next,fresh,fresh,'steep');expect(R.stacks(fresh,'cozy')).toBe(1);
 });
});
