import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {DepthModel} from './model';
import {SaveSettings} from './Utility';
import {Codex} from './Pages';

afterEach(()=>{cleanup();window.history.replaceState(null,'','/');});
function Settings({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 return <SaveSettings m={m}/>;
}
it('selects A6 triple speed and carries it with earned progress through save export/import',()=>{
 const m=new DepthModel(true,true,true,true);
 m.state.account.currencies.stamps=444;
 render(<Settings m={m}/>);
 const speed=screen.getByRole('combobox',{name:'Playback speed'});
 expect(within(speed).queryByRole('option',{name:'4×'})).toBeNull();
 fireEvent.change(speed,{target:{value:'3'}});
 expect(m.state.settings.speed).toBe(3);
 fireEvent.click(screen.getByRole('button',{name:'Export save code'}));
 const code=(screen.getByRole('textbox',{name:'Save code'}) as HTMLTextAreaElement).value;
 expect(code.length).toBeGreaterThan(50);
 act(()=>{m.state.account.currencies.stamps=1;m.state.settings.speed=1;m.notify();});
 fireEvent.click(screen.getByRole('button',{name:'Import save code'}));
 expect(m.error).toBe(false);
 expect(m.state.account.currencies.stamps).toBe(444);
 expect(m.state.settings.speed).toBe(3);
 expect((screen.getByRole('combobox',{name:'Playback speed'}) as HTMLSelectElement).value).toBe('3');
});
it('preserves quadruple speed for legacy playback',()=>{
 const m=new DepthModel(true,true,true,false);
 render(<Settings m={m}/>);
 const speed=screen.getByRole('combobox',{name:'Playback speed'});
 expect(within(speed).queryByRole('option',{name:'3×'})).toBeNull();
 fireEvent.change(speed,{target:{value:'4'}});
 expect(m.state.settings.speed).toBe(4);
});
it('explains the A6 rage trigger while leaving the earlier ultimate rule in legacy mode',()=>{
 const view=render(<Codex v4 skillsV5 a6/>);
 expect(screen.getByText(/automatically at 100 rage/)).toBeTruthy();
 expect(screen.queryByText(/after two own turns/)).toBeNull();
 view.rerender(<Codex v4 skillsV5/>);
 expect(screen.getByText(/after two own turns/)).toBeTruthy();
 expect(screen.queryByText(/automatically at 100 rage/)).toBeNull();
});

it('uses current enemy mechanics and phase advice only in the A6 field guide',()=>{
 const view=render(<Codex v4 skillsV5 a6/>);
 fireEvent.click(screen.getByRole('button',{name:'enemies'}));
 fireEvent.click(screen.getByRole('button',{name:'Teacup Healer'}));
 expect(screen.getByText('Heals its weakest ally every two rounds.')).toBeTruthy();
 expect(screen.queryByText('Every third round restores 65 HP to the most injured foe.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Yarn Giant'}));
 expect(screen.getByText(/66% HP: woolguard shield/)).toBeTruthy();
 view.rerender(<Codex v4 skillsV5/>);
 fireEvent.click(screen.getByRole('button',{name:'enemies'}));
 expect(screen.getByText('Every third round restores 65 HP to the most injured foe.')).toBeTruthy();
 expect(screen.queryByText(/66% HP: woolguard shield/)).toBeNull();
});
