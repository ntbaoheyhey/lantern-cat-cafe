import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {RouteComplete} from './RouteComplete';
afterEach(cleanup);
function model(modern=true){const m=new DepthModel(true,modern,modern,modern);m.start(1,'campaign',1);m.state.run!.complete=true;m.state.run!.won=true;return m;}
function add(m:DepthModel,id='mossbrew-charm-rare') {const g=R.makeGear(m.state,id,824002);m.state.gear.push(g);return g;}
it.each([true,false])('opens the newest owned matching reward without changing the account (modern=%s)',modern=>{
 const m=model(modern),older=add(m),newer=add(m);m.state.run!.earnedItems=[older.templateId,newer.templateId];m.itemId=m.state.gear[0]!.id;
 const before=R.exportSave(m.state);render(<RouteComplete m={m}/>);expect(R.exportSave(m.state)).toBe(before);
 const buttons=screen.getAllByRole('button',{name:`View ${R.GEAR_BY_ID[newer.templateId]!.name} in Bag`});expect(buttons).toHaveLength(1);
 expect(screen.getByText(/Found 2/)).toBeTruthy();fireEvent.click(buttons[0]!);
 expect(m.screen).toBe('inventory');expect(m.inventorySlot).toBe('charm');expect(m.itemId).toBe(newer.id);expect(R.exportSave(m.state)).toBe(before);
});
it.each([true,false])('keeps conversion notes and an honest general Bag action (modern=%s)',modern=>{
 const m=model(modern),note='Full shelf: Rare Mossbrew Leaf converted to 7 threads (daily reward cap applies).';m.state.run!.earnedItems=[note];const before=R.exportSave(m.state);
 render(<RouteComplete m={m}/>);expect(screen.getByText(note)).toBeTruthy();expect(screen.queryByRole('button',{name:/Equip your rewards|View .* in Bag/})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Review equipment'}));expect(m.screen).toBe('inventory');expect(m.inventorySlot).toBe('all');expect(R.exportSave(m.state)).toBe(before);
});
it('does not offer a missing template piece and leaves unknown historical notes readable',()=>{
 const m=model(),g=add(m);m.state.run!.earnedItems=[g.templateId,'An old keepsake reward.'];m.state.gear=m.state.gear.filter(p=>p.id!==g.id);
 render(<RouteComplete m={m}/>);expect(screen.getByText('No matching piece remains in your Bag.')).toBeTruthy();expect(screen.getByText('An old keepsake reward.')).toBeTruthy();
 expect(screen.queryByRole('button',{name:/View .* in Bag/})).toBeNull();
});
it('rechecks current inventory before opening a stale matching-piece link',()=>{
 const m=model(),g=add(m);m.state.run!.earnedItems=[g.templateId];render(<RouteComplete m={m}/>);
 m.state={...m.state,gear:m.state.gear.filter(p=>p.id!==g.id)};const before=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:/View .* in Bag/}));expect(m.itemId).not.toBe(g.id);expect(m.inventorySlot).toBe('all');expect(R.exportSave(m.state)).toBe(before);
});
it('shows no new gear on a loss and returns home without another settlement',()=>{
 const m=model();m.state.run!.won=false;const before=R.exportSave(m.state);render(<RouteComplete m={m}/>);
 expect(screen.getByText('No new equipment this route.')).toBeTruthy();expect(screen.getByRole('heading',{name:'Every journey leaves a lesson.'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Return to cafe'}));expect(m.screen).toBe('hub');expect(R.exportSave(m.state)).toBe(before);
});
function tower(floor:number){const m=model();m.state.cleared=[1,2,3];m.state.towerBest=floor;m.state=R.startTowerFloorA6(m.state,floor).state;m.state.run!.complete=true;m.state.run!.won=true;return m;}
it('finishes the thirtieth Tower floor without an impossible next-floor action',()=>{
 const m=tower(30),before=R.exportSave(m.state);render(<RouteComplete m={m}/>);
 expect(screen.getByRole('status').textContent).toBe('All thirty floors are complete.');expect(screen.queryByRole('button',{name:/Climb to floor/})).toBeNull();expect(R.exportSave(m.state)).toBe(before);
});
it('opens the next floor with the exact public command and never grants the previous reward twice',()=>{
 const m=tower(29),before=R.exportSave(m.state),expected=R.nextTowerFloor(m.state);render(<RouteComplete m={m}/>);expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(screen.getByRole('button',{name:'Climb to floor 30'}));expect(m.state).toEqual(expected.state);expect(m.state.run!.complete).toBe(false);expect(screen.queryByRole('button',{name:/Climb to floor/})).toBeNull();
});
it('rejects stale next-floor activation against the current run',()=>{
 const m=tower(29);render(<RouteComplete m={m}/>);m.state={...m.state,run:{...m.state.run!,won:false}};const before=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:'Climb to floor 30'}));expect(m.error).toBe(true);expect(R.exportSave(m.state)).toBe(before);
});
it('preserves the uncapped legacy Tower route transition',()=>{
 const m=model(false);m.state.run!.mode='tower';m.state.run!.floor=30;const expected=R.nextTowerFloor(m.state);render(<RouteComplete m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Climb to floor 31'}));expect(m.state).toEqual(expected.state);expect(m.state.run!.floor).toBe(31);
});
