import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {useState} from 'react';
import {MenuDialogB2} from './MenuDialogB2';
import {countTickB2} from './motion-b2';
import {RewardFly} from '../ui-v3/RewardFly';
import {playCue} from '../contracts/audio-cues';

vi.mock('../contracts/audio-cues',()=>({playCue:vi.fn()}));
let finish:()=>void,cancel:ReturnType<typeof vi.fn>;
beforeEach(()=>{
 vi.clearAllMocks();
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 cancel=vi.fn();
 if(!HTMLElement.prototype.animate)HTMLElement.prototype.animate=vi.fn();
 vi.spyOn(HTMLElement.prototype,'animate').mockImplementation(()=>({finished:new Promise<void>(resolve=>{finish=resolve;}),cancel}) as unknown as Animation);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});

function Workspace({closed=()=>{}}:{closed?:()=>void}){
 const [open,setOpen]=useState(false);
 return <><button onClick={()=>setOpen(true)}>Open</button>{open&&<MenuDialogB2 title="Workshop" onClose={()=>{setOpen(false);closed();}}>Gear</MenuDialogB2>}</>;
}
it('keeps the modal and its focus trap until the exit finishes, then restores focus',async()=>{
 render(<Workspace/>);const trigger=screen.getByRole('button',{name:'Open'});trigger.focus();fireEvent.click(trigger);
 fireEvent.click(screen.getByRole('button',{name:'Close dialog'}));
 expect(screen.getByRole('dialog',{name:'Workshop'})).toBeTruthy();
 expect(HTMLElement.prototype.animate).toHaveBeenLastCalledWith(expect.any(Array),expect.objectContaining({duration:180}));
 await act(async()=>finish());
 expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(trigger);
});
it('ignores a repeated close and cancels an exit when the screen unmounts',async()=>{
 const closed=vi.fn(),view=render(<Workspace closed={closed}/>);fireEvent.click(screen.getByRole('button',{name:'Open'}));
 const button=screen.getByRole('button',{name:'Close dialog'});fireEvent.click(button);fireEvent.click(button);
 expect(HTMLElement.prototype.animate).toHaveBeenCalledTimes(1);view.unmount();expect(cancel).toHaveBeenCalledOnce();
 await act(async()=>finish());expect(closed).not.toHaveBeenCalled();
});
it.each(['system','saved'])('closes immediately for the %s reduced-motion setting',kind=>{
 if(kind==='system')vi.stubGlobal('matchMedia',()=>({matches:true}));
 render(<><div className={kind==='saved'?'uv-app dp-reduced-motion':''}/><Workspace/></>);
 fireEvent.click(screen.getByRole('button',{name:'Open'}));fireEvent.click(screen.getByRole('button',{name:'Close dialog'}));
 expect(screen.queryByRole('dialog')).toBeNull();expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
});
it('shares a maximum of twenty rising count ticks per second across simultaneous counters',()=>{
 for(let t=0;t<1000;t+=10){countTickB2(t/1000,10000+t);countTickB2(t/1000,10000+t);}
 const calls=vi.mocked(playCue).mock.calls.filter(c=>c[0]==='count.tick');expect(calls).toHaveLength(20);
 expect(calls[0]![1]!.pitch).toBeLessThan(calls.at(-1)![1]!.pitch!);
});
it('lands each reward on its currency cue at the arc endpoint and cancels stale landings',()=>{
 vi.useFakeTimers();const view=(fish:number,threads:number)=><><span data-currency="fish"/><span data-currency="threads"/><RewardFly values={{fish,threads}}/></>;
 const {rerender}=render(view(10,10));rerender(view(20,30));
 expect(playCue).toHaveBeenCalledWith('ui.reward-fly');
 act(()=>vi.advanceTimersByTime(899));expect(playCue).not.toHaveBeenCalledWith('currency.fish.gain');
 act(()=>vi.advanceTimersByTime(1));expect(playCue).toHaveBeenCalledWith('currency.fish.gain');expect(playCue).toHaveBeenCalledWith('currency.thread.gain');
 vi.mocked(playCue).mockClear();rerender(view(40,30));rerender(view(35,30));act(()=>vi.advanceTimersByTime(1000));
 expect(playCue).not.toHaveBeenCalledWith('currency.fish.gain');
});
