import {describe,it,expect} from 'vitest';
import {TurnController} from './controller';
import {getAutoAction} from '@taskbar-hero/game-rules/src/squad/turn/engine';
const drain=(c:TurnController)=>{for(let i=0;i<300&&c.presenter.busy;i++)c.tick(100)};
describe('turn controller serialization',()=>{
 it('waits indefinitely for a manual cat, rejects a double input, and drains before ending',()=>{
  const c=new TurnController();for(let i=0;i<1000&&!c.canChoose;i++)c.tick(100);
  expect(c.canChoose).toBe(true);const turn=c.battle.turn;for(let i=0;i<100;i++)c.tick(100);expect(c.battle.turn).toBe(turn);
  const before=c.battle.history.length;const choice=getAutoAction(c.battle)!;expect(c.act(choice)).toBe(true);expect(c.act(choice)).toBe(false);
  expect(c.battle.turn).toBe(turn);expect(c.presenter.busy).toBe(true);c.tick(1);expect(c.battle.turn).toBe(turn);
  expect(c.battle.history).toHaveLength(before+1);drain(c);expect(c.battle.history.filter(x=>x.actorId===choice.actorId)).toHaveLength(1);
 });
 it('hidden and paused ticks never move rules or presentation',()=>{
  const c=new TurnController(),seq=c.presenter.appliedSeq,turn=c.battle.turn;c.tick(500,true);expect(c.presenter.appliedSeq).toBe(seq);expect(c.battle.turn).toBe(turn);
  c.pause();c.tick(500);expect(c.battle.turn).toBe(turn);
 });
 it('auto completes a whole campaign without overlapping plans or illegal choices',()=>{
  const c=new TurnController();c.autoAll(true);c.presenter.playbackRate=4;c.presenter.fast=true;
  for(let i=0;i<50000&&!c.battle.result;i++){c.tick(100);expect(c.presenter.pendingPlans).toBeLessThan(15)}
  expect(c.battle.result?.winner).toBe('party');expect(c.battle.settledWaves).toHaveLength(4);
 });
 it('resets a paused inspection into an actionable battle',()=>{
  const c=new TurnController();c.inspect('lanternstorm');expect(c.fixedTime).toBe(1);c.reset();expect(c.fixedTime).toBeUndefined();expect(c.mode).toBe('battle');
 });
});
it('publishes the manual-turn boundary even between throttled notification frames',()=>{
 for(const delta of [1,7,16,19]){
  const c=new TurnController();let observed=false,notifications=0;c.subscribe(()=>{observed=!!c.canChoose;notifications++});
  for(let i=0;i<20000&&!c.canChoose;i++)c.tick(delta);
  for(let i=0;i<40;i++)c.tick(delta);expect(c.canChoose).toBe(true);expect(observed).toBe(true);
  const count=notifications;for(let i=0;i<100;i++)c.tick(delta);expect(notifications).toBe(count);
 }
});
