import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterAll,afterEach,beforeAll,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import BattleHudV3 from './BattleHudV3';
import {HealthMeterA6} from './HudMetersA6';
const dialogMethods=['showModal','close'] as const;
const originalDialogMethods=dialogMethods.map(key=>Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,key));
beforeAll(()=>{
 // jsdom has no top layer; browser checks cover native focus trapping/inertness.
 for(const key of dialogMethods)Object.defineProperty(HTMLDialogElement.prototype,key,{configurable:true,value:function(this:HTMLDialogElement){this.open=key==='showModal';}});
});
afterAll(()=>{dialogMethods.forEach((key,i)=>{const original=originalDialogMethods[i];if(original)Object.defineProperty(HTMLDialogElement.prototype,key,original);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);});});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
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
it('explains either ultimate unlock and keeps a fallen cat from announcing readiness',()=>{
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;
 m.state.account.cards.find(c=>c.cardId==='soot')!.stars=3;
 m.state.account.cards.find(c=>c.cardId==='clover')!.level=6;
 m.state.account.cards.forEach(c=>{m.state.skills[c.cardId]=R.defaultSkills(m.state,c.cardId)});
 m.start(1);m.enter('0-0');m.sceneReady=true;
 m.battle!.actors.filter(a=>a.side==='party').forEach(a=>a.charge=100);
 const before=structuredClone(m.battle),view=render(<Harness m={m}/>);
 expect(screen.getByText('Ult · Lv. 6 or 3★')).toBeTruthy();
 expect(screen.getByLabelText('Mochi ultimate: Unlocks at level 6 or three stars')).toBeTruthy();
 expect(screen.getAllByText('Ultimate ready')).toHaveLength(2);
 expect(m.battle).toEqual(before);
 act(()=>{m.battle!.actors.find(a=>a.catalogId==='soot')!.hp=0;m.notify(false)});
 expect(screen.getByText('Fallen')).toBeTruthy();
 expect(screen.getByLabelText('Soot ultimate: Fallen')).toBeTruthy();
 expect(view.container.querySelector('[data-fallen="true"]')!.getAttribute('data-ready')).toBe('false');
 expect(screen.getAllByText('Ultimate ready')).toHaveLength(1);
 expect(screen.queryByRole('button',{name:/cast|ultimate/i})).toBeNull();
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
it.each([false,true])('restores prior pause=%s after reading an empty battle log',wasPaused=>{
 const m=readyBattle();m.paused=wasPaused;m.battle!.log=[];
 const account=structuredClone(m.state.account),battle=structuredClone(m.battle);
 render(<Harness m={m}/>);
 const more=screen.getByRole('button',{name:'More battle options'});
 fireEvent.click(more);fireEvent.click(screen.getByRole('button',{name:'Read battle log'}));
 expect(m.paused).toBe(true);
 const clock=m.playbackAt;act(()=>m.tick(1000));expect(m.playbackAt).toBe(clock);
 const log=screen.getByRole('dialog',{name:'Battle log'});
 expect(within(log).getByText('The first page is waiting')).toBeTruthy();
 expect(within(log).getByText(wasPaused?'The table will stay paused when you close this book.':'Close this book to resume the auto battle.')).toBeTruthy();
 if(wasPaused)fireEvent(log,new Event('cancel',{cancelable:true}));
 else fireEvent.click(within(log).getByRole('button',{name:'Close log'}));
 expect(screen.queryByRole('dialog')).toBeNull();expect(m.paused).toBe(wasPaused);
 expect(document.activeElement).toBe(more);
 expect(m.battle).toEqual(battle);expect(m.state.account).toEqual(account);
});
it('reads exactly the last100 events newest first, including fallback text, without changing the log',()=>{
 const m=readyBattle();m.battle!.log=Array.from({length:125},(_,i)=>({round:Math.floor(i/7)+1,actorId:'',targetId:'',skillId:'',kind:'damage',amount:i,text:i===124?'':`Event ${i}`}));
 const before=structuredClone(m.battle);
 render(<Harness m={m}/>);fireEvent.click(screen.getByRole('button',{name:'More battle options'}));fireEvent.click(screen.getByRole('button',{name:'Read battle log'}));
 const log=screen.getByRole('dialog',{name:'Battle log'});
 expect(within(log).getByText('Latest 100 of 125 events · Newest first')).toBeTruthy();
 const events=[...log.querySelectorAll('[data-event-index]')];
 expect(events.map(e=>e.getAttribute('data-event-index'))).toEqual(Array.from({length:100},(_,i)=>String(124-i)));
 expect(events[0]!.textContent).toContain('damage 124');
 expect(within(log).queryByText('Event 24')).toBeNull();
 expect(within(log).getByRole('heading',{name:'Round 18'})).toBeTruthy();
 expect(m.battle).toEqual(before);
});
