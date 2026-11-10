import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import BattleHudV3 from './BattleHudV3';
import {HealthMeterA6} from './HudMetersA6';
afterEach(()=>{cleanup();vi.useRealTimers();});
function Harness({m}:{m:DepthModel}){useSyncExternalStore(m.subscribe,m.snapshot);return <BattleHudV3 m={m}/>;}
function readyBattle(){
 const m=new DepthModel(true,true,true,true);
 m.state.tutorial=4;m.state.account.cards.forEach(c=>{c.level=6;m.state.skills[c.cardId]=R.defaultSkills(m.state,c.cardId)});
 m.start(1);m.enter('0-0');m.sceneReady=true;
 return m;
}
it('holds recent damage before trailing down, while a heal and reduced motion update immediately',()=>{
 vi.useFakeTimers();const v=render(<HealthMeterA6 hp={100} maxHp={100} name="Mochi"/>);
 v.rerender(<HealthMeterA6 hp={40} maxHp={100} name="Mochi"/>);
 expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40');
 const width=()=>v.container.querySelector<HTMLElement>('.a6-health-trail')!.style.width;
 expect(width()).toBe('100%');act(()=>vi.advanceTimersByTime(279));expect(width()).toBe('100%');
 act(()=>vi.advanceTimersByTime(1));expect(width()).toBe('40%');
 v.rerender(<HealthMeterA6 hp={85} maxHp={100} name="Mochi"/>);expect(width()).toBe('85%');
 v.rerender(<HealthMeterA6 hp={10} maxHp={100} name="Mochi" reduced/>);expect(width()).toBe('10%');
});
it('shows full rage as ready and leaves casting entirely automatic',()=>{
 const m=readyBattle();m.battle!.actors.filter(a=>a.side==='party').forEach(a=>a.charge=100);
 render(<Harness m={m}/>);expect(screen.getAllByText('Ultimate ready').length).toBe(3);
 expect(screen.queryByRole('button',{name:/cast|ultimate/i})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Change playback speed'}));expect(m.state.settings.speed).toBe(2);
 fireEvent.click(screen.getByRole('button',{name:'Change playback speed'}));expect(m.state.settings.speed).toBe(3);
});
it('an earned skip resolves the battle and removes the current cut-in without issuing another cast',()=>{
 const m=readyBattle(),run=m.state.run!,node=run.nodes.find(n=>n.id===run.current)!;
 const key=R.nodeStarKeyV4(run,node);m.state.v4!.journey!.stars[key]={key,chapter:run.chapter,band:run.challengeLevel!,nodeId:node.id,kind:node.kind,conditions:[true,true,true]};
 m.fight();render(<Harness m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Skip to result'}));
 expect(m.screen).toBe('result');expect(m.plan).toBeNull();expect(m.watching).toBe(false);
});
it('gives an automatic ultimate a speed-scaled 800ms wall-clock window',()=>{
 for(const speed of [1,2,3]){
  const m=readyBattle();m.state.settings.speed=speed;m.fight();
  let found=false;
  for(let i=0;i<100&&!m.battle!.result;i++){
   m.battle!.actors.filter(a=>a.side==='party').forEach(a=>a.charge=100);
   m.act();
   if(m.plan?.ultimate&&m.ultimateBannerUntil>m.playbackAt){
    expect(m.ultimateBannerUntil-m.playbackAt).toBe(800/speed);expect(800/speed).toBeGreaterThan(260);found=true;break;
   }
   while(m.plan)m.finishMoment();
  }
  expect(found).toBe(true);
 }
});
it('shows the boss phase thresholds from real rules without a second DOM damage-number layer',()=>{
 const m=readyBattle();m.state.run!.battle=R.createBattle({...m.battle!.initial,enemies:['yarn-giant']});
 const boss=m.battle!.actors.find(a=>a.catalogId==='yarn-giant')!;
 window.__LOOK_V2__=true;
 const view=render(<Harness m={m}/>);
 expect(screen.getByLabelText('Phase 1 of 3')).toBeTruthy();
 act(()=>{boss.hp=Math.floor(boss.maxHp*.6);R.phaseBossA6(m.battle!,boss);m.notify(false)});
 expect(screen.getByLabelText('Phase 2 of 3')).toBeTruthy();
 act(()=>{boss.hp=Math.floor(boss.maxHp*.3);R.phaseBossA6(m.battle!,boss);m.notify(false)});
 expect(screen.getByLabelText('Phase 3 of 3')).toBeTruthy();
 expect(view.container.querySelectorAll('.uv-float-number').length).toBe(0);
 delete window.__LOOK_V2__;
});
