import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {PantryV4} from './EquipmentV4';

afterEach(cleanup);
const choose=(recipe:string)=>fireEvent.change(screen.getByLabelText('Pantry recipe'),{target:{value:recipe}});
const craft=()=>screen.getByRole('button',{name:'Craft pantry item'}) as HTMLButtonElement;
const quote=()=>screen.getByRole('region',{name:'Recipe preview'});
function model(){const m=new DepthModel(true,true,true,true);m.state.account.currencies.threads=100;m.state.account.currencies.essence=20;m.state.account.inventory.stacks['pantry-key']=1;return m;}
it('shows all missing recipe resources without spending or trying a rejected purchase',()=>{
 const m=model();m.state.account.currencies.threads=3;m.state.account.inventory.stacks['pantry-key']=0;const before=R.exportSave(m.state);
 render(<PantryV4 m={m}/>);choose('pantry-shield-biscuit');expect(craft().disabled).toBe(true);expect(quote().textContent).toContain('7 more threads');expect(quote().textContent).toContain('1 more Pantry Key');expect(quote().textContent).toContain('Mend a Pantry Key');
 fireEvent.click(craft());expect(R.exportSave(m.state)).toBe(before);expect(m.error).toBe(false);
});
it('discloses both currencies for the ribbon even when the first cost is unaffordable',()=>{
 const m=model();m.state.account.currencies.threads=3;m.state.account.currencies.essence=1;render(<PantryV4 m={m}/>);choose('cafe-ribbon');expect(craft().disabled).toBe(true);expect(quote().textContent).toContain('17 more threads');expect(quote().textContent).toContain('9 more essence');
});
it('describes the crafted milk as immediate recovery between encounters',()=>{
 const m=model();render(<PantryV4 m={m}/>);choose('pantry-tonic');expect(quote().textContent).toContain('Restore up to 100 missing HP to one living companion between encounters.');expect(quote().textContent).not.toContain('Pack it');
});
it.each([['mend-pantry-key','pantry-key',99],['pantry-shield-biscuit','shield-biscuit',20],['cafe-ribbon','cafe-ribbon',1]] as const)('blocks a full %s stack without losing resources', (recipe,id,cap)=>{
 const m=model();m.state.account.inventory.stacks[id]=cap;const before=R.exportSave(m.state);render(<PantryV4 m={m}/>);choose(recipe);expect(craft().disabled).toBe(true);expect(quote().textContent).toContain(id==='cafe-ribbon'?'Already in your collection.':`Full: ${cap}/${cap}`);fireEvent.click(craft());expect(R.exportSave(m.state)).toBe(before);
});
it('previews the last supply slot, spends exactly one key and ten threads, then blocks the full stack',()=>{
 const m=model();m.state.account.currencies.threads=10;m.state.account.inventory.stacks['shield-biscuit']=19;const before=R.exportSave(m.state),expected=R.metaCommand(m.state,{type:'forge',recipeId:'pantry-shield-biscuit'});
 render(<PantryV4 m={m}/>);choose('pantry-shield-biscuit');expect(craft().disabled).toBe(false);expect(quote().textContent).toContain('19 → 20/20');expect(R.exportSave(m.state)).toBe(before);fireEvent.click(craft());expect(m.state).toEqual(expected.state);expect(m.state.account.currencies.threads).toBe(0);expect(m.state.account.inventory.stacks['pantry-key']).toBe(0);expect(m.state.account.inventory.stacks['shield-biscuit']).toBe(20);expect(craft().disabled).toBe(true);expect(quote().textContent).toContain('Full: 20/20');
});
it('keeps crafting locked during a patrol and refreshes after the patrol completes',()=>{
 const m=model();m.start(1,'campaign',1);render(<PantryV4 m={m}/>);expect(craft().disabled).toBe(true);expect(quote().textContent).toContain('Finish this patrol before crafting.');
 act(()=>m.apply({ok:true,state:{...m.state,run:{...m.state.run!,complete:true}}}));expect(craft().disabled).toBe(false);
});
it('uses the latest account at purchase time if resources change after the displayed quote',()=>{
 const m=model();render(<PantryV4 m={m}/>);choose('pantry-shield-biscuit');expect(craft().disabled).toBe(false);m.state={...m.state,account:{...m.state.account,currencies:{...m.state.account.currencies,threads:0}}};const before=R.exportSave(m.state);fireEvent.click(craft());expect(m.error).toBe(true);expect(R.exportSave(m.state)).toBe(before);expect(craft().disabled).toBe(true);
});
