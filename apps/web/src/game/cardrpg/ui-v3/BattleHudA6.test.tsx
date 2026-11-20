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
it('uses current effects and caps for both visible and overflow battle statuses without changing combat',()=>{
 const m=readyBattle(),cat=m.battle!.actors.find(a=>a.catalogId==='mochi')!;
 cat.statuses=(['drowsy','brittle','scald','scent','snag','bitter','steep','cozy'] as const).map(id=>({id,stacks:1,remaining:1,source:cat.id,appliedRound:1}));
 const before=structuredClone(m.battle);render(<Harness m={m}/>);
 const badges=screen.getByLabelText('Mochi statuses');
 fireEvent.focus(within(badges).getByRole('button',{name:/^Daze\. Your next action becomes a half-power basic/}));
 expect(screen.getByRole('tooltip').textContent).toContain('Bosses only lose a signature. Stacks 1/1. 1 rounds remaining.');
 fireEvent.focus(within(badges).getByRole('button',{name:/^Shred\. Lose 8% defense and 15 shield per direct hit, per stack/}));
 expect(screen.getByRole('tooltip').textContent).toContain('Stacks 1/3.');
 expect(within(badges).getByRole('button',{name:/^Burn\. Lose 12 HP per stack at round end, through shields/})).toBeTruthy();
 expect(within(badges).getByRole('button',{name:/^Mark\. Take 20% more direct damage/})).toBeTruthy();
 fireEvent.focus(within(badges).getByRole('button',{name:/^4 more statuses/}));
 const tip=screen.getByRole('tooltip');
 for(const text of ['Bleed. Lose 8 HP per stack before your action. Shields absorb it.','Bitter. Receive half as much healing and shielding.','Regen. Heal 18 HP per stack at round end and remove one Burn stack.','Warm. Take 10% less direct damage per stack. Burn ignores Warm.'])expect(tip.textContent).toContain(text);
 fireEvent.keyDown(within(badges).getByRole('button',{name:/^4 more statuses/}),{key:'Escape'});
 expect(screen.queryByRole('tooltip')).toBeNull();expect(m.battle).toEqual(before);
});
it.each([false,true])('uses saved replay V5=%s instead of current account preferences for status copy',skillsV5=>{
 const m=readyBattle();m.replay=structuredClone(m.battle!);m.replay.initial.skillsV5=skillsV5;
 m.replay.initial.gameplayA6=skillsV5;m.state.skillsV5=!skillsV5;
 const cat=m.replay.actors.find(a=>a.catalogId==='mochi')!;
 cat.statuses=[{id:'drowsy',stacks:1,remaining:1,source:cat.id,appliedRound:1}];
 const before=structuredClone(m.replay);render(<Harness m={m}/>);
 const badge=within(screen.getByLabelText('Mochi statuses')).getByRole('button');
 fireEvent.focus(badge);
 expect(screen.getByRole('tooltip').textContent).toContain(skillsV5?'Daze. Your next action becomes a half-power basic. Bosses only lose a signature.':R.STATUS_BY_ID.drowsy.description);
 expect(m.replay).toEqual(before);
});
it('keeps all A6 starter ultimates available and a fallen cat from announcing readiness',()=>{
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;
 m.state.account.cards.find(c=>c.cardId==='soot')!.stars=3;
 m.state.account.cards.find(c=>c.cardId==='clover')!.level=6;
 m.state.account.cards.forEach(c=>{m.state.skills[c.cardId]=R.defaultSkills(m.state,c.cardId)});
 m.start(1);m.enter('0-0');m.sceneReady=true;
 m.battle!.actors.filter(a=>a.side==='party').forEach(a=>a.charge=100);
 const before=structuredClone(m.battle),view=render(<Harness m={m}/>);
 expect(screen.queryByText('Ult · Lv. 6 or 3★')).toBeNull();
 expect(screen.getByLabelText('Mochi ultimate: Ready')).toBeTruthy();
 expect(screen.getAllByText('Ultimate ready')).toHaveLength(3);
 expect(m.battle).toEqual(before);
 act(()=>{m.battle!.actors.find(a=>a.catalogId==='soot')!.hp=0;m.notify(false)});
 expect(screen.getByText('Fallen')).toBeTruthy();
 expect(screen.getByLabelText('Soot ultimate: Fallen')).toBeTruthy();
 expect(view.container.querySelector('[data-fallen="true"]')!.getAttribute('data-ready')).toBe('false');
 expect(screen.getAllByText('Ultimate ready')).toHaveLength(2);
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
it.each([false,true])('opens a native battle guide and restores prior pause=%s on return',async wasPaused=>{
 const m=readyBattle();m.paused=wasPaused;
 const before=structuredClone(m.battle),account=structuredClone(m.state.account);
 const show=vi.spyOn(HTMLDialogElement.prototype,'showModal');
 render(<Harness m={m}/>);
 const trigger=screen.getByRole('button',{name:'Read battle guide'});
 fireEvent.click(trigger);
 const guide=screen.getByRole('dialog',{name:'Battle guide'}) as HTMLDialogElement;
 expect(guide.tagName).toBe('DIALOG');expect(show).toHaveBeenCalledOnce();expect(guide.open).toBe(true);
 // Wait for the real lazy import, not testing-library's one-second polling
 // deadline: a cold full-suite transform can outlast it on a busy runner.
 await act(async()=>{await vi.dynamicImportSettled();});
 const chapters=await within(guide).findByRole('navigation',{name:'Guide chapters'});
 expect(within(chapters).getByRole('combobox',{name:'Guide chapter'})).toBeTruthy();
 const at=m.playbackAt;act(()=>m.tick(1000));expect(m.playbackAt).toBe(at);expect(m.paused).toBe(true);
 if(wasPaused)fireEvent(guide,new Event('cancel',{cancelable:true}));
 else fireEvent.keyDown(within(guide).getByRole('button',{name:'Close guide'}),{key:'Escape'});
 expect(screen.queryByRole('dialog')).toBeNull();expect(m.paused).toBe(wasPaused);expect(guide.open).toBe(false);
 expect(document.activeElement).toBe(trigger);expect(m.battle).toEqual(before);expect(m.state.account).toEqual(account);
});
it.each([false,true])('keeps scrolling keys inside the log and restores prior pause=%s',wasPaused=>{
 const m=readyBattle();m.paused=wasPaused;
 m.battle!.log=[{round:1,actorId:'mochi',targetId:'foe',skillId:'mochi-1',kind:'damage',amount:20,text:'Mochi deals 20 damage.'}];
 const before=structuredClone(m.battle),account=structuredClone(m.state.account);
 render(<Harness m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'More battle options'}));fireEvent.click(screen.getByRole('button',{name:'Read battle log'}));
 const log=screen.getByRole('dialog',{name:'Battle log'}),events=within(log).getByRole('region',{name:'Battle events, newest first'});
 const shortcut=vi.fn((event:KeyboardEvent)=>{if(event.code==='Space')m.paused=!m.paused;});
 window.addEventListener('keydown',shortcut);
 try{
  events.focus();
  for(const key of [' ','PageDown','End','Home','ArrowDown']){
   const event=new KeyboardEvent('keydown',{key,code:key===' '?'Space':key,bubbles:true,cancelable:true});
   fireEvent(events,event);
   expect(event.defaultPrevented).toBe(false); // Native region scrolling still works.
   expect(shortcut).not.toHaveBeenCalled();expect(m.paused).toBe(true);
  }
  const clock=m.playbackAt;act(()=>m.tick(1000));expect(m.playbackAt).toBe(clock);
  fireEvent(log,new Event('cancel',{cancelable:true}));
  expect(m.paused).toBe(wasPaused);expect(m.battle).toEqual(before);expect(m.state.account).toEqual(account);
 }finally{window.removeEventListener('keydown',shortcut);}
});
it('returns focus from an escaped battle option to its menu trigger',()=>{
 const m=readyBattle(),before=structuredClone(m.state);m.paused=true;render(<Harness m={m}/>);
 const more=screen.getByRole('button',{name:'More battle options'});fireEvent.click(more);
 const option=screen.getByRole('button',{name:/Turn banners/});option.focus();fireEvent.keyDown(option,{key:'Escape'});
 expect(more.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(more);
 expect(m.paused).toBe(true);expect(m.state).toEqual(before);
});
it('reads exactly the last100 events newest first, including fallback text, without changing the log',()=>{
 const m=readyBattle();m.battle!.log=Array.from({length:125},(_,i)=>({round:Math.floor(i/7)+1,actorId:'',targetId:'',skillId:'',kind:'damage',amount:i,text:i===124?'':`Event ${i}`}));
 const before=structuredClone(m.battle);
 render(<Harness m={m}/>);fireEvent.click(screen.getByRole('button',{name:'More battle options'}));fireEvent.click(screen.getByRole('button',{name:'Read battle log'}));
 const log=screen.getByRole('dialog',{name:'Battle log'});
 expect(within(log).getByText('Latest 100 of 125 events · Newest first')).toBeTruthy();
 const events=[...log.querySelectorAll('[data-event-index]')];
 expect(events.map(e=>e.getAttribute('data-event-index'))).toEqual(Array.from({length:100},(_,i)=>String(124-i)));
 expect(events[0]!.textContent).toContain('124 HP damage');
 expect(within(log).queryByText('Event 24')).toBeNull();
 expect(within(log).getByRole('heading',{name:'Round 18'})).toBeTruthy();
 expect(m.battle).toEqual(before);
});

it('waits for the Spine cue and hides the portrait again before impact without changing combat',()=>{
 const m=readyBattle();m.inspect('mochi-4',0);m.ultimateBannerUntil=800;
 window.__LOOK_V2__=true;
 const cinematic={ultimateVisible:false,actorId:m.plan!.actorId,box:{x:24,y:62,width:480,height:120},phaseVisible:false,phaseText:'',phaseBox:null};
 window.__depthScene={cinematic} as unknown as NonNullable<Window['__depthScene']>;
 let paint:FrameRequestCallback=()=>{};vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{paint=callback;return 1});
 const before=structuredClone(m.battle),view=render(<Harness m={m}/>),banner=view.container.querySelector<HTMLElement>('.spine-ultimate-cutin')!;
 expect(banner.hidden).toBe(true);
 act(()=>{cinematic.ultimateVisible=true;paint(16)});expect(banner.hidden).toBe(false);
 expect(banner.dataset.unit).toBe('mochi');expect(banner.textContent).toContain(m.plan!.name);
 act(()=>{cinematic.ultimateVisible=false;paint(32)});expect(banner.hidden).toBe(true);
 expect(m.battle).toEqual(before);delete window.__depthScene;delete window.__LOOK_V2__;
});
