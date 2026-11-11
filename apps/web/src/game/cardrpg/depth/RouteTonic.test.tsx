import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {RouteTonic} from './RouteTonic';
afterEach(cleanup);
function model(){const m=new DepthModel(true,true,true,true);m.start(1,'campaign',1);m.state.run!.supplies=2;return m;}
const button=()=>screen.getByRole('button',{name:'Use route tonic'}) as HTMLButtonElement;
const preview=()=>screen.getByRole('region',{name:'Route tonic recovery'});
it('shows exact capped crew recovery, reviving and unaffected cats before spending',()=>{
 const m=model(),cats=R.battleCats(m.state);m.state.run!.hp.mochi=cats[0]!.stats.hp-43;m.state.run!.hp.soot=0;
 const before=R.exportSave(m.state),expected=R.useTonic(m.state);render(<RouteTonic m={m}/>);
 expect(preview().textContent).toContain(`${cats[0]!.stats.hp-43} → ${cats[0]!.stats.hp} HP (+43)`);
 expect(preview().textContent).toContain('0 → 100 HP (+100)');expect(preview().textContent).toContain('Revives');expect(preview().textContent).toContain('Already full');
 expect(preview().textContent).toContain('2 → 1 remaining');expect(R.exportSave(m.state)).toBe(before);expect(button().getAttribute('aria-describedby')).toBe(preview().id);
 fireEvent.click(button());expect(m.state).toEqual(expected.state);expect(preview().textContent).toContain('1 → 0 remaining');
});
it('stops a second use once the last missing HP is restored',()=>{
 const m=model();m.state.run!.hp.mochi!-=43;render(<RouteTonic m={m}/>);fireEvent.click(button());expect(button().disabled).toBe(true);expect(preview().textContent).toContain('Every companion is already at full HP.');const before=R.exportSave(m.state);fireEvent.click(button());expect(R.exportSave(m.state)).toBe(before);expect(m.state.run!.supplies).toBe(1);
});
it.each(['home','complete','prepare','committed','empty'] as const)('explains the %s lock before a rejected click',kind=>{
 const m=model();m.state.run!.hp.mochi!-=43;
 if(kind==='home')m.state.run=null;else if(kind==='complete')m.state.run!.complete=true;else if(kind==='empty')m.state.run!.supplies=0;
 else{m.enter(R.availableNodes(m.state.run!)[0]!.id);if(kind==='committed')m.state=R.commitPreparation(m.state).state;}
 const expected=R.useTonic(m.state),before=R.exportSave(m.state);render(<RouteTonic m={m}/>);expect(button().disabled).toBe(true);expect(preview().textContent).toContain(expected.error);fireEvent.click(button());expect(R.exportSave(m.state)).toBe(before);
});
it('compact review is read-only and keeps its eligibility current',()=>{
 const m=model();m.state.run!.hp.mochi!-=43;const before=R.exportSave(m.state);render(<RouteTonic m={m} compact/>);
 fireEvent.click(screen.getByText('Review tonic recovery'));expect(button().disabled).toBe(false);expect(R.exportSave(m.state)).toBe(before);
 act(()=>m.apply(R.useTonic(m.state)));expect(button().disabled).toBe(true);
});
it('recomputes the command at activation rather than spending a stale preview',()=>{
 const m=model();m.state.run!.hp.mochi!-=43;render(<RouteTonic m={m}/>);m.state={...m.state,run:{...m.state.run!,supplies:0}};
 const before=R.exportSave(m.state);fireEvent.click(button());expect(R.exportSave(m.state)).toBe(before);expect(m.error).toBe(true);expect(button().disabled).toBe(true);
});
