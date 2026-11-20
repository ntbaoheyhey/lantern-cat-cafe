import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {DepthModel} from '../depth/model';
import {SettingsA6} from './SettingsA6';
import BattleHudV3 from './BattleHudV3';

afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
function Harness({m,battle}:{m:DepthModel;battle:boolean}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 return battle?<BattleHudV3 m={m}/>:<SettingsA6 m={m}/>;
}
it.each([false,true])('shows pending and blocked startup, then permits a retry on battle=%s',async battle=>{
 // Exercise the real CafeAudio toggle; only the browser device is unavailable.
 let reject!: (reason:Error)=>void;
 vi.stubGlobal('Audio',vi.fn(function(){return {play:()=>new Promise((_,no)=>{reject=no;}),pause(){},removeAttribute(){},load(){},currentTime:0};}));
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:audio-test');vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
 vi.stubGlobal('AudioContext',undefined);
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;
 if(battle){m.start(1);m.enter('0-0');m.paused=true;}
 const before=JSON.stringify(m.state),audio=vi.spyOn(m.audio,'toggle');
 render(<Harness m={m} battle={battle}/>);
 if(battle)fireEvent.click(screen.getByRole('button',{name:'More battle options'}));
 fireEvent.click(screen.getByRole('button',{name:battle?'Turn sound on':'Sound off'}));
 const pending=screen.getByRole('button',{name:'Starting sound…'});
 expect((pending as HTMLButtonElement).disabled).toBe(true);
 expect(pending.getAttribute('aria-pressed')).toBe('false');
 fireEvent.click(pending);expect(audio).toHaveBeenCalledOnce();expect(JSON.stringify(m.state)).toBe(before);
 await act(async()=>{reject(new Error('Device denied private diagnostic'));});
 const retry=screen.getByRole('button',{name:'Try sound again'});
 expect(retry.getAttribute('aria-pressed')).toBe('false');
 expect(document.getElementById(retry.getAttribute('aria-describedby')!)?.textContent).toBe('Sound could not start. Try again.');
 expect(screen.queryByText(/private diagnostic/)).toBeNull();expect(m.state.settings.sound).toBe(false);
 fireEvent.click(retry);expect(screen.getByRole('button',{name:'Starting sound…'})).toBeTruthy();
 await act(async()=>{reject(new Error('Denied'));});
 expect(audio).toHaveBeenCalledTimes(2);expect(JSON.stringify(m.state)).toBe(before);
 m.audio.dispose();
});
