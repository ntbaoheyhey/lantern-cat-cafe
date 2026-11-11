import {act,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
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
it('quotes enhancement on the wearer while comparing equipment for a different cat',()=>{
 const {m,id}=model();m.state.account.cards.find(c=>c.cardId==='mochi')!.level=20;m.cardId='soot';
 const item=m.state.gear.find(g=>g.id===id)!;item.enhancement=11;
 Object.assign(m.state.account.currencies,{fish:6000,threads:100});
 const expected=R.enhancementPreview(item,m.state,'mochi'),selected=R.enhancementPreview(item,m.state,'soot'),before=R.exportSave(m.state);
 expect(expected.before).not.toBe(selected.before);render(<BagA6 m={m}/>);
 const quote=screen.getByLabelText('Enhancement quote');
 expect(quote.textContent).toContain('Worn by Mochi');expect(quote.textContent).toContain(`Attack ${expected.before} → ${expected.after}`);
 expect(screen.getByText('Move from Mochi to Soot')).toBeTruthy();expect(R.exportSave(m.state)).toBe(before);
 const result=R.enhanceGear(m.state,id);expect(result.ok).toBe(true);fireEvent.click(screen.getByRole('button',{name:'Enhance +12'}));
 expect(m.state.gear).toEqual(result.state.gear);expect(m.state.equipment).toEqual(result.state.equipment);expect(m.state.account.currencies).toEqual(result.state.account.currencies);
 expect(within(quote).getByText('Maximum enhancement')).toBeTruthy();expect(quote.textContent).not.toContain('5070');
});
it('names every shortage and explains bag-only and zero-gain enhancements without spending',()=>{
 const {m,id}=model();m.state.equipment={};Object.assign(m.state.gear.find(g=>g.id===id)!,R.makeGear(m.state,'mossbrew-charm-common',25),{id});m.cardId='soot';
 Object.assign(m.state.account.currencies,{fish:5,threads:1});const before=R.exportSave(m.state);render(<BagA6 m={m}/>);
 const quote=screen.getByLabelText('Enhancement quote'),button=screen.getByRole('button',{name:'Need materials'});
 expect(quote.textContent).toContain('For Soot · Equip to use');expect(quote.textContent).toContain('No main-stat gain at +1.');
 expect(quote.textContent).toContain('30 fish points');expect(quote.textContent).toContain('3 threads');
 expect(quote.textContent).toContain('25 more fish · 2 more threads');expect(quote.textContent).toContain('Patrol gives fish and threads.');
 expect(button.getAttribute('aria-describedby')).toBe(quote.id);fireEvent.click(button);expect(R.exportSave(m.state)).toBe(before);
});
it('discloses a crew loss beside Equip even when the receiving cat gains Power',()=>{
 const {m,id}=model();m.state.account.cards.find(c=>c.cardId==='mochi')!.level=20;m.cardId='soot';
 const comparison=R.comparisonV4(m.state,'soot',id)!,before=R.exportSave(m.state);
 expect(comparison.after.total).toBeGreaterThan(comparison.before.total);expect(comparison.teamAfter).toBeLessThan(comparison.teamBefore);
 render(<BagA6 m={m}/>);const button=screen.getByRole('button',{name:'Equip'});
 const quote=document.getElementById(button.getAttribute('aria-describedby')!)!;
 const delta=Math.round(comparison.teamAfter)-Math.round(comparison.teamBefore);
 expect(quote.textContent).toContain('Move from Mochi to Soot');expect(quote.textContent).toContain('Crew Power');expect(quote.textContent).toContain('−'+Math.abs(delta));
 expect(R.exportSave(m.state)).toBe(before);fireEvent.click(button);expect(Math.round(R.teamPowerV4(m.state))).toBe(Math.round(comparison.teamAfter));
 expect(screen.queryByText('Crew Power')).toBeNull();expect(m.state.equipment.mochi?.weapon).toBeUndefined();expect(m.state.equipment.soot?.weapon).toBe(id);
});
it('reviews donor losses and recipient gains before equipping without changing the account',async()=>{
 const {m,id}=model();
 for(const cat of ['mochi','soot']){
  const outfit=R.makeGear(m.state,'hearthloom-outfit-epic',26);m.state.gear.push(outfit);m.state=R.equipGear(m.state,cat,outfit.id).state;
 }
 m.cardId='soot';const before=R.exportSave(m.state);render(<BagA6 m={m}/>);
 const review=screen.getByRole('button',{name:'1 bonus lost · Review'});expect(review.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(review);const panel=screen.getByRole('region',{name:'Equip bonus changes'});
 expect(panel.textContent).toContain('Mochi loses Hearthloom · 2 pieces');expect(panel.textContent).toContain('Soot gains Hearthloom · 2 pieces');
 expect(panel.textContent).toContain('Defend adds 12 shield.');await waitFor(()=>expect(document.activeElement).toBe(panel));
 expect(review.getAttribute('aria-expanded')).toBe('true');expect(R.exportSave(m.state)).toBe(before);
 const command=R.equipGear(m.state,'soot',id);fireEvent.click(screen.getByRole('button',{name:'Equip'}));
 expect(m.state.equipment).toEqual(command.state.equipment);expect(m.state.account.currencies).toEqual(command.state.account.currencies);
 expect(screen.queryByRole('region',{name:'Equip bonus changes'})).toBeNull();expect(screen.queryByRole('button',{name:/bonus.*Review/})).toBeNull();
});
