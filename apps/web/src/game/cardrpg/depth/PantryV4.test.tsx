import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {PantryV4} from './EquipmentV4';

afterEach(cleanup);
function model(){const m=new DepthModel(true,true,true,true);m.start(1,'campaign',1);for(const id of R.SUPPLY_IDS_V4)m.state.account.inventory.stacks[id]=1;return m;}
const choose=(id:R.SupplyIdV4)=>fireEvent.change(screen.getByLabelText('Pantry supply'),{target:{value:id}});
const pack=()=>screen.getByRole('button',{name:'Confirm packed supply'}) as HTMLButtonElement;
const milk=()=>screen.getByRole('button',{name:'Use milk tonic'}) as HTMLButtonElement;
it('explains empty stock before packing and keeps an existing reservation unchanged',()=>{
 const m=model();m.state=R.packSupplyV4(m.state,'cleanse-tea','mochi').state;m.state.account.inventory.stacks['shield-biscuit']=0;const before=R.exportSave(m.state);
 render(<PantryV4 m={m}/>);expect(pack().disabled).toBe(true);expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain('No supply remains. The previous preparation is unchanged.');fireEvent.click(pack());expect(R.exportSave(m.state)).toBe(before);
});
it('quotes capped missing HP, spends one milk immediately, and then explains full HP',()=>{
 const m=model(),max=R.battleCats(m.state).find(c=>c.id==='mochi')!.stats.hp;m.state.run!.hp.mochi=max-43;
 const expected=R.packSupplyV4(m.state,'milk-tonic','mochi');render(<PantryV4 m={m}/>);choose('milk-tonic');
 expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain(`${max-43} → ${max} HP (+43)`);expect(milk().disabled).toBe(false);fireEvent.click(milk());
 expect(m.state).toEqual(expected.state);expect(milk().disabled).toBe(true);expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain('This companion has no missing HP.');
});
it('blocks a fallen recipient while allowing a living recipient to receive the supply',()=>{
 const m=model();m.state.run!.hp.mochi=0;render(<PantryV4 m={m}/>);expect(pack().disabled).toBe(true);expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain('Choose a living member of this crew.');
 fireEvent.change(screen.getByLabelText('Supply recipient'),{target:{value:'soot'}});expect(pack().disabled).toBe(false);const expected=R.packSupplyV4(m.state,'shield-biscuit','soot');fireEvent.click(pack());expect(m.state).toEqual(expected.state);
});
it('reassigns the same reserved item with zero left in the pantry and returns it once',()=>{
 const m=model();m.state=R.packSupplyV4(m.state,'shield-biscuit','mochi').state;const before=R.exportSave(m.state);render(<PantryV4 m={m}/>);
 fireEvent.change(screen.getByLabelText('Supply recipient'),{target:{value:'soot'}});expect(pack().disabled).toBe(false);expect(R.exportSave(m.state)).toBe(before);
 expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain('Shield Biscuit for Soot');
 const expected=R.packSupplyV4(m.state,'shield-biscuit','soot');fireEvent.click(pack());expect(m.state).toEqual(expected.state);expect(m.state.account.inventory.stacks['shield-biscuit']).toBe(0);
 const returned=R.packSupplyV4(m.state,null,'soot');fireEvent.click(screen.getByRole('button',{name:'Return packed supply'}));expect(m.state).toEqual(returned.state);expect(m.state.account.inventory.stacks['shield-biscuit']).toBe(1);expect((screen.getByRole('button',{name:'Return packed supply'}) as HTMLButtonElement).disabled).toBe(true);
});
it('keeps the packed supply while using milk immediately',()=>{
 const m=model();m.state=R.packSupplyV4(m.state,'quicken-yarn','soot').state;m.state.run!.hp.mochi!-=150;
 render(<PantryV4 m={m}/>);choose('milk-tonic');const expected=R.packSupplyV4(m.state,'milk-tonic','mochi');fireEvent.click(milk());expect(m.state).toEqual(expected.state);expect(m.state.run!.packedSupply).toEqual({id:'quicken-yarn',catId:'soot'});
});
it('explains when to pack and locks both actions once Prepare opens',()=>{
 const m=model();m.state.run=null;render(<PantryV4 m={m}/>);expect(pack().disabled).toBe(true);expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain('Start a patrol');
 act(()=>m.start(1,'campaign',1));fireEvent.click(pack());act(()=>m.enter(R.availableNodes(m.state.run!)[0]!.id));
 expect(pack().disabled).toBe(true);expect((screen.getByRole('button',{name:'Return packed supply'}) as HTMLButtonElement).disabled).toBe(true);expect(screen.getByRole('region',{name:'Supply preview'}).textContent).toContain('Supplies are locked for this encounter');
});
it.each(['shield-biscuit','quicken-yarn','cleanse-tea','ultimate-treat'] as const)('reserves %s only after the confirmed command',id=>{
 const m=model(),before=R.exportSave(m.state);render(<PantryV4 m={m}/>);choose(id);expect(R.exportSave(m.state)).toBe(before);const expected=R.packSupplyV4(m.state,id,'mochi');fireEvent.click(pack());expect(m.state).toEqual(expected.state);
});
