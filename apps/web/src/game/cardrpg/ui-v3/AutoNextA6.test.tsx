import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterAll,afterEach,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {ResultA6} from './ResultA6';

const methods=['showModal','close'] as const,original=methods.map(key=>Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,key));
beforeAll(()=>{for(const key of methods)Object.defineProperty(HTMLDialogElement.prototype,key,{configurable:true,value:function(this:HTMLDialogElement){this.open=key==='showModal';}});});
afterAll(()=>{methods.forEach((key,i)=>{if(original[i])Object.defineProperty(HTMLDialogElement.prototype,key,original[i]!);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);});});
beforeEach(()=>{vi.useFakeTimers({toFake:['setInterval','clearInterval','setTimeout','clearTimeout']});vi.stubGlobal('requestAnimationFrame',()=>0);vi.stubGlobal('cancelAnimationFrame',()=>{});Element.prototype.scrollTo=()=>{};});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
function Surface({m}:{m:DepthModel}){useSyncExternalStore(m.subscribe,m.snapshot);return m.screen==='result'&&m.battle?<ResultA6 m={m}/>:<p>Returned to {m.screen}</p>;}
function setup(){
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;m.state.settings.reducedMotion=true;
 m.start(1);m.enter('0-0');m.battle!.result='party';m.watching=false;m.screen='result';m.autoContinue=true;
 R.observeDiscoveriesV4(m.state);m.state.v4!.journey!.pending=[];return m;
}
const advance=(ms:number)=>act(()=>vi.advanceTimersByTime(ms));
it('shows a countdown and cancels it without settling the encounter',()=>{
 const m=setup(),before=structuredClone(m.state),next=vi.spyOn(m,'continueBattle');render(<Surface m={m}/>);
 expect(screen.getByLabelText('Auto-next status').textContent).toContain('Continue in 5s');advance(2000);
 expect(screen.getByLabelText('Auto-next status').textContent).toContain('Continue in 3s');
 fireEvent.click(screen.getByRole('button',{name:'Stop Auto-next'}));advance(10000);
 expect(m.autoContinue).toBe(false);expect(m.state).toEqual(before);expect(next).not.toHaveBeenCalled();
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'Next'}));
});
it.each(['button','escape','cancel'] as const)('holds the entire report and starts a fresh countdown after %s',close=>{
 const m=setup(),before=structuredClone(m.state),next=vi.spyOn(m,'continueBattle');render(<Surface m={m}/>);advance(2000);
 const trigger=screen.getByRole('button',{name:'Read details'});trigger.focus();fireEvent.click(trigger);const dialog=screen.getByRole('dialog',{name:'Battle details'});
 expect(dialog.textContent).toContain('Auto-next is paused');advance(12000);expect(next).not.toHaveBeenCalled();expect(m.state).toEqual(before);
 if(close==='button')fireEvent.click(within(dialog).getByRole('button',{name:'Back to result'}));
 else if(close==='escape')fireEvent.keyDown(dialog,{key:'Escape'});else fireEvent(dialog,new Event('cancel',{cancelable:true}));
 expect(document.activeElement).toBe(trigger);advance(4999);expect(next).not.toHaveBeenCalled();advance(1);expect(next).toHaveBeenCalledOnce();
 expect(m.state).toEqual(R.finishEncounter(before).state);advance(10000);expect(next).toHaveBeenCalledOnce();
});
it('waits while hidden and gives a fresh five seconds when visible again',()=>{
 let visible=true;vi.spyOn(document,'visibilityState','get').mockImplementation(()=>visible?'visible':'hidden');
 const m=setup(),next=vi.spyOn(m,'continueBattle');render(<Surface m={m}/>);advance(2000);
 act(()=>{visible=false;document.dispatchEvent(new Event('visibilitychange'));});advance(20000);expect(next).not.toHaveBeenCalled();
 act(()=>{visible=true;document.dispatchEvent(new Event('visibilitychange'));});advance(4999);expect(next).not.toHaveBeenCalled();advance(1);expect(next).toHaveBeenCalledOnce();
});
it('holds for a discovery but does not reset after unrelated account notifications',()=>{
 const m=setup();m.state.v4!.journey!.found=[];R.observeDiscoveriesV4(m.state);expect(m.state.v4!.journey!.pending.length).toBeGreaterThan(0);
 const next=vi.spyOn(m,'continueBattle');render(<Surface m={m}/>);advance(10000);expect(next).not.toHaveBeenCalled();
 act(()=>{m.state.v4!.journey!.pending=[];m.notify(false);});advance(2000);
 act(()=>{m.state=structuredClone(m.state);m.notify(false);});advance(2999);expect(next).not.toHaveBeenCalled();advance(1);expect(next).toHaveBeenCalledOnce();
});
it('clears the timer when manually continuing before the countdown finishes',()=>{
 const m=setup(),finish=vi.spyOn(m,'finish'),next=vi.spyOn(m,'continueBattle');render(<Surface m={m}/>);advance(2000);
 fireEvent.click(screen.getByRole('button',{name:'Next'}));advance(10000);expect(finish).toHaveBeenCalledOnce();expect(next).not.toHaveBeenCalled();
});
it('clears the timer when navigating to a different screen',()=>{
 const m=setup(),before=structuredClone(m.state),next=vi.spyOn(m,'continueBattle');render(<Surface m={m}/>);advance(2000);
 act(()=>m.go('team'));advance(10000);expect(m.state).toEqual(before);expect(next).not.toHaveBeenCalled();
});
