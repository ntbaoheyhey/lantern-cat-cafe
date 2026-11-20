import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {DepthModel} from '../depth/model';
import BattleHudV3 from './BattleHudV3';
function Harness({m}:{m:DepthModel}){useSyncExternalStore(m.subscribe,m.snapshot);return <BattleHudV3 m={m}/>;}
afterEach(()=>{cleanup();vi.restoreAllMocks();});

it.each(['ultimate','phase'] as const)('temporarily yields an overlapping %s card to More and restores it without changing playback',kind=>{
 const previousURL=location.href,previousScene=window.__depthScene;
 history.replaceState({},'', '/?lookSpine=1');
 const canvas=document.createElement('div');canvas.className='dp-canvas';document.body.append(canvas);
 let paint:FrameRequestCallback=()=>{};
 vi.spyOn(window,'requestAnimationFrame').mockImplementation(fn=>{paint=fn;return 1;});
 vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});
 const original=HTMLElement.prototype.getBoundingClientRect;
 let menuX=20;
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){
  if(this===canvas)return new DOMRect(0,80,1280,494);
  if(this.classList.contains('uv-battle-menu'))return new DOMRect(menuX,136,720,82);
  return original.call(this);
 });
 const m=new DepthModel(true,true,true,true);m.inspect('mochi-4',.2);m.ultimateBannerUntil=1000;
 const cinematic={ultimateVisible:kind==='ultimate',phaseVisible:kind==='phase',actorId:m.plan!.actorId,box:{x:24,y:62,width:510,height:134},phaseBox:{x:24,y:62,width:380,height:68},phaseText:'Yarn Giant · Phase 2'};
 window.__depthScene={cinematic} as unknown as NonNullable<Window['__depthScene']>;
 try{
  const before=JSON.stringify({state:m.state,battle:m.battle,plan:m.plan,paused:m.paused,at:m.animationAt});
  const view=render(<Harness m={m}/>),selector=kind==='ultimate'?'.spine-ultimate-cutin':'.spine-phase-cue';
  const card=view.container.querySelector<HTMLElement>(selector)!;expect(card).toBeTruthy();expect(card.hidden).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'More battle options'}));act(()=>paint(16));expect(card.hidden).toBe(true);
  // A menu on the other side may coexist with the same card.
  menuX=560;act(()=>paint(32));expect(card.hidden).toBe(false);
  menuX=20;act(()=>paint(48));expect(card.hidden).toBe(true);
  fireEvent.keyDown(window,{key:'Escape'});act(()=>paint(64));expect(card.hidden).toBe(false);
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'More battle options'}));
  expect(JSON.stringify({state:m.state,battle:m.battle,plan:m.plan,paused:m.paused,at:m.animationAt})).toBe(before);
  // Closing a panel never resurrects a cue whose presentation window ended.
  cinematic.ultimateVisible=false;cinematic.phaseVisible=false;act(()=>paint(80));expect(card.hidden).toBe(true);
 }finally{cleanup();canvas.remove();history.replaceState({},'',previousURL);window.__depthScene=previousScene;}
});
