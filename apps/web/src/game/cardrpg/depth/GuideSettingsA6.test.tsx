import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
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
 expect(m.state.account.currencies.stamps).toBe(1);
 expect(screen.getByRole('region',{name:'Review saved progress'}).textContent).toContain('444');
 fireEvent.click(screen.getByRole('button',{name:'Restore saved evening'}));
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
 fireEvent.change(screen.getByRole('combobox',{name:'Guide chapter'}),{target:{value:'3'}});
 expect(screen.getByText(/automatically at 100 rage/)).toBeTruthy();
 expect(screen.queryByText(/after two own turns/)).toBeNull();
 view.rerender(<Codex v4 skillsV5/>);
 expect(screen.getByText(/after two own turns/)).toBeTruthy();
 expect(screen.queryByText(/automatically at 100 rage/)).toBeNull();
});

it('uses current enemy mechanics and phase advice only in the A6 field guide',()=>{
 const view=render(<Codex v4 skillsV5 a6/>);
 fireEvent.click(screen.getByRole('button',{name:'Battle notes'}));
 fireEvent.click(screen.getByRole('button',{name:'enemies'}));
 fireEvent.click(screen.getByRole('button',{name:'Teacup Healer'}));
 expect(screen.getByText(/Heals its weakest ally on even rounds or at full rage/)).toBeTruthy();
 expect(screen.queryByText('Every third round restores 65 HP to the most injured foe.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Yarn Giant'}));
 expect(screen.getByText(/66% HP: woolguard shield/)).toBeTruthy();
 view.rerender(<Codex v4 skillsV5/>);
 fireEvent.click(screen.getByRole('button',{name:'enemies'}));
 expect(screen.getByText('Every third round restores 65 HP to the most injured foe.')).toBeTruthy();
 expect(screen.queryByText(/66% HP: woolguard shield/)).toBeNull();
});

it('selects the exported account and preserves progress after a bad import or cancelled reset',()=>{
 const m=new DepthModel(true,true,true,true);m.state.account.currencies.stamps=777;
 const before=JSON.stringify(m.state);render(<Settings m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Export save code'}));
 const box=screen.getByRole('textbox',{name:'Save code'}) as HTMLTextAreaElement;
 const exported=box.value;fireEvent.click(screen.getByRole('button',{name:'Select save code'}));
 expect(document.activeElement).toBe(box);expect(box.selectionStart).toBe(0);expect(box.selectionEnd).toBe(exported.length);
 expect(JSON.stringify(m.state)).toBe(before);
 fireEvent.change(box,{target:{value:'broken cafe code'}});fireEvent.click(screen.getByRole('button',{name:'Import save code'}));
 expect(JSON.stringify(m.state)).toBe(before);expect(screen.getByRole('status').textContent).toContain('Paste the complete code');
 expect(screen.queryByRole('region',{name:'Review saved progress'})).toBeNull();
 fireEvent.change(box,{target:{value:exported}});fireEvent.click(screen.getByRole('button',{name:'Start again'}));
 expect(JSON.stringify(m.state)).toBe(before);fireEvent.click(screen.getByRole('button',{name:'Reset account'}));
 expect(JSON.stringify(m.state)).toBe(before);expect(screen.getByRole('button',{name:'Confirm reset account'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Keep this account'}));
 expect(JSON.stringify(m.state)).toBe(before);expect((screen.getByRole('textbox',{name:'Save code'}) as HTMLTextAreaElement).value).toBe(exported);
});

it('previews the exact saved crew and supplies without importing until the restore action',()=>{
 const m=new DepthModel(true,true,true,true);m.state.account.currencies.stamps=777;
 const source=new DepthModel(true,true,true,true);source.shortcut('unlock');source.state.team=['panko','mallow','sorrel'];
 const code=R.exportSave(source.state),before=R.exportSave(m.state),importer=vi.spyOn(m,'import');
 render(<Settings m={m}/>);fireEvent.change(screen.getByRole('textbox',{name:'Save code'}),{target:{value:code}});
 fireEvent.click(screen.getByRole('button',{name:'Import save code'}));
 const preview=screen.getByRole('region',{name:'Review saved progress'});
 expect(preview.textContent).toContain('Panko · Mallow · Sorrel');expect(preview.textContent).toContain('At the cafe');
 expect(within(preview).getByRole('row',{name:'Cats 3 / 12 12 / 12'})).toBeTruthy();
 expect(within(preview).getByRole('row',{name:'Stamps 777 600'})).toBeTruthy();
 expect(document.activeElement).toBe(screen.getByRole('heading',{name:'Restore this evening?'}));
 expect(importer).not.toHaveBeenCalled();expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(screen.getByRole('button',{name:'Keep this account'}));
 expect(R.exportSave(m.state)).toBe(before);expect((screen.getByRole('textbox',{name:'Save code'})as HTMLTextAreaElement).value).toBe(code);
 fireEvent.click(screen.getByRole('button',{name:'Import save code'}));fireEvent.click(screen.getByRole('button',{name:'Restore saved evening'}));
 expect(importer).toHaveBeenCalledExactlyOnceWith(code);expect(m.state.team).toEqual(source.state.team);expect(m.state.account.currencies).toEqual(source.state.account.currencies);
});

it('shows an active saved route and rejects a newly edited invalid code after cancelling a valid preview',()=>{
 const m=new DepthModel(true,true,true,true),source=new DepthModel(true,true,true,true);source.state.tutorial=4;
 source.state=R.startRun(source.state,1,826131).state;const code=R.exportSave(source.state),before=R.exportSave(m.state);
 render(<Settings m={m}/>);fireEvent.change(screen.getByRole('textbox',{name:'Save code'}),{target:{value:code}});
 fireEvent.click(screen.getByRole('button',{name:'Import save code'}));expect(screen.getByText('Chapter 1 route')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Keep this account'}));
 fireEvent.change(screen.getByRole('textbox',{name:'Save code'}),{target:{value:code.slice(0,-10)}});fireEvent.click(screen.getByRole('button',{name:'Import save code'}));
 expect(screen.queryByRole('button',{name:'Restore saved evening'})).toBeNull();expect(R.exportSave(m.state)).toBe(before);
});
