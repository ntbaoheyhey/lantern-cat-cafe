import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {BagA6} from './BagA6';

afterEach(cleanup);
function model() {
 const m=new DepthModel(true,true,true,true);m.state=R.setGameplayA6(R.createDepthAccount(24,0),true);
 Object.defineProperty(m,'cafeNow',{get:()=>0});m.state.tutorial=4;m.state.account.currencies.fish=2000;m.state.account.currencies.threads=100;
 const item=R.makeGear(m.state,'hearthloom-weapon-epic',24);m.state.gear.push(item);m.state=R.equipGear(m.state,'mochi',item.id).state;
 m.cardId='mochi';m.itemId=item.id;return {m,id:item.id};
}
it('transfers the selected piece once, keeps its comparison honest and spends the public enhancement cost',()=>{
 const {m,id}=model();render(<BagA6 m={m}/>);
 expect((screen.getByRole('button',{name:'Equipped'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.change(screen.getByRole('combobox',{name:'Equip for'}),{target:{value:'soot'}});
 const expected=R.comparisonV4(m.state,'soot',id)!,detail=screen.getByRole('complementary',{name:'Selected gear'});
 expect(within(detail).getByText(/Transfers from Mochi/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Equip'}));
 expect(m.state.equipment.soot?.weapon).toBe(id);expect(m.state.equipment.mochi?.weapon).toBeUndefined();
 expect(R.powerV4(m.state,'soot').total).toBe(expected.after.total);
 const before=structuredClone(m.state.account.currencies),preview=R.enhancementPreview(m.state.gear.find(g=>g.id===id)!);
 fireEvent.click(screen.getByRole('button',{name:'Enhance +1'}));
 expect(m.state.gear.find(g=>g.id===id)!.enhancement).toBe(1);
 expect(m.state.account.currencies.fish).toBe(before.fish-preview.cost.fish);
 expect(m.state.account.currencies.threads).toBe(before.threads-preview.cost.threads);
 expect(screen.getByRole('button',{name:'Enhance +2'})).toBeTruthy();
 expect(detail.getAttribute('data-selected-gear')).toBe(id);
});
it('filters slots without changing ownership and restores the selected piece after an empty shelf',()=>{
 const {m,id}=model();m.state.gear=m.state.gear.filter(g=>R.GEAR_BY_ID[g.templateId]!.slot!=='charm');
 const before=R.exportSave(m.state);render(<BagA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Charms'}));
 expect(screen.getByText('This shelf is waiting')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Show all gear'}));
 expect(screen.getByRole('complementary',{name:'Selected gear'}).getAttribute('data-selected-gear')).toBe(id);
 fireEvent.click(screen.getByRole('button',{name:'Set & affixes'}));
 expect(screen.getByRole('region',{name:'Item affixes'})).toBeTruthy();
 expect(R.exportSave(m.state)).toBe(before);
});
it('keeps unaffordable, capped and active-route actions inert without altering progression',()=>{
 const {m,id}=model();m.state.account.currencies.fish=0;render(<BagA6 m={m}/>);
 const before=R.exportSave(m.state),poor=screen.getByRole('button',{name:'Need materials'});
 expect((poor as HTMLButtonElement).disabled).toBe(true);fireEvent.click(poor);expect(R.exportSave(m.state)).toBe(before);
 act(()=>{m.state.gear.find(g=>g.id===id)!.enhancement=12;m.notify(false);});
 expect((screen.getByRole('button',{name:'Max +12'}) as HTMLButtonElement).disabled).toBe(true);
 act(()=>{m.state.gear.find(g=>g.id===id)!.enhancement=0;m.state.account.currencies.fish=2000;m.state=R.startRun(m.state,1,24).state;m.notify(false);});
 fireEvent.change(screen.getByRole('combobox',{name:'Equip for'}),{target:{value:'soot'}});
 const locked=R.exportSave(m.state);
 for(const name of ['Equip','Enhance +1']) {const button=screen.getByRole('button',{name});expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button);}
 expect(screen.getByText('Finish this route to change gear.')).toBeTruthy();expect(R.exportSave(m.state)).toBe(locked);
});
