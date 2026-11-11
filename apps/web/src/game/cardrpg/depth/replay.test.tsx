import {useSyncExternalStore} from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {SettingsA6} from '../ui-v3/SettingsA6';
import {SaveSettings} from './Utility';
import BattleHudV3 from '../ui-v3/BattleHudV3';
import {ResultV3} from '../ui-v3/EncounterV3';

afterEach(cleanup);
function setup(a6=true){
 const m=new DepthModel(true,true,true,a6);m.state.tutorial=4;m.state.account.cards.forEach(c=>c.level=12);
 m.start(1);m.enter('0-0');m.sceneReady=true;return m;
}
function finishFight(m:DepthModel){R.playBattle(m.battle!,'auto');m.go('result');return structuredClone(m.battle!);}
function Settings({m,legacy=false}:{m:DepthModel;legacy?:boolean}){useSyncExternalStore(m.subscribe,m.snapshot);return legacy?<SaveSettings m={m}/>:<SettingsA6 m={m}/>;}

it.each([false,true])('replays an unsettled result through Settings, A6=%s, without changing rewards',a6=>{
 const m=setup(a6),recorded=finishFight(m),before=structuredClone(m.state);m.go('save');
 expect(m.state.lastChoices).toHaveLength(0);
 m.replayLast();m.skip();
 expect(m.replay).toEqual(recorded);expect(m.state).toEqual(before);
 m.finish();expect(m.screen).toBe('save');expect(m.replay).toBeNull();expect(m.state).toEqual(before);
 m.go('result');const expected=R.finishEncounter(before);m.finish();expect(m.state).toEqual(expected.state);
});
it.each([false,true])('does not offer an empty memory at preparation, legacy settings=%s',legacy=>{
 const m=setup(!legacy);m.go('save');const before=structuredClone(m.state);
 render(<Settings m={m} legacy={legacy}/>);
 expect((screen.getByRole('button',{name:'Replay last battle'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Replay last battle'}));
 m.replayLast();expect(m.replay).toBeNull();expect(m.screen).toBe('save');expect(m.state).toEqual(before);
});
it('replays a finished lesson from Settings without consuming its invitation',()=>{
 const m=setup();m.state.run=null;m.tutorial();const recorded=finishFight(m);m.go('save');const before=structuredClone(m.state);
 render(<Settings m={m}/>);expect((screen.getByRole('button',{name:'Replay last battle'}) as HTMLButtonElement).disabled).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Replay last battle'}));m.skip();expect(m.replay).toEqual(recorded);
 m.finish();expect(m.screen).toBe('save');expect(m.tutorialBattle).toEqual(recorded);expect(m.state).toEqual(before);
});
it('keeps a saved partial recording and a settled full recording repeatable',()=>{
 for(const partial of[false,true]){
  const m=setup();
  if(partial){m.fight();m.step();while(m.plan)m.finishMoment();m.leave();}
  else{finishFight(m);m.finish();}
  const before=structuredClone(m.state),expected=R.replayBattle(m.state.lastBattle!,m.state.lastChoices);m.go('save');
  m.replayLast();m.skip();expect(m.replay).toEqual(expected);m.finish();
  m.replayLast();m.skip();expect(m.replay).toEqual(expected);m.finish();expect(m.state).toEqual(before);
 }
});
it('labels a replay and never presents current account rank as recorded rank or Auto-next',()=>{
 const m=setup();finishFight(m);m.replayLast();m.state.account.cards.forEach(c=>{c.level=60;c.stars=5;});m.autoContinue=true;
 const before=structuredClone(m.state),view=render(<BattleHudV3 m={m}/>);
 expect(screen.getByText('Recorded replay')).toBeTruthy();expect(screen.queryByRole('checkbox',{name:'Auto-next'})).toBeNull();
 expect(view.container.querySelector('.a6-hud-level')).toBeNull();expect(view.container.querySelector('.a6-hud-stars')).toBeNull();
 expect(m.state).toEqual(before);
});
it('preserves the original return screen when a second replay request arrives',()=>{
 const m=setup();finishFight(m);m.go('save');m.replayLast();const recording=m.replay;
 m.replayLast();expect(m.replay).toBe(recording);m.finish();expect(m.screen).toBe('save');
});
it.each([false,true])('returns from the replay result to Settings, A6=%s, without settling the pending result',a6=>{
 const m=setup(a6);finishFight(m);m.go('save');const before=structuredClone(m.state);m.replayLast();m.skip();
 render(<ResultV3 m={m}/>);
 expect(screen.getByText('Replay only. Rewards and route progress stay unchanged.')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/^Close replay/}));
 expect(m.screen).toBe('save');expect(m.state).toEqual(before);expect(m.replay).toBeNull();
});
it('calls a partial replay a recorded segment instead of a completed encounter',()=>{
 const m=setup();m.fight();m.step();while(m.plan)m.finishMoment();m.leave();m.go('save');m.replayLast();m.skip();
 expect(m.replay!.result).toBeNull();render(<ResultV3 m={m}/>);
 expect(screen.getByRole('heading',{name:'Recorded segment complete'})).toBeTruthy();
});
it.each(['hub','save','codex','map'] as const)('clears a finished replay when navigating to %s without settling the real encounter',destination=>{
 const m=setup();finishFight(m);m.go('save');const before=structuredClone(m.state);m.replayLast();m.skip();m.go(destination);
 expect(m.replay).toBeNull();expect(m.battle).toBe(m.state.run!.battle);expect(m.state).toEqual(before);
 expect(m.screen).toBe(destination==='map'?'result':destination);
});
