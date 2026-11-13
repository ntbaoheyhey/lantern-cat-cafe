import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeAll,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {TextDietContext} from '../ui-v3/TextDietC2';
import {FormationB2} from './FormationB2';
import {BagB2} from './BagB2';
import {BoundFusion} from './BoundFusion';
import {supplyBatchB2} from './SuppliesB2';
beforeAll(()=>{HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};});
afterEach(cleanup);
function model(){const m=new DepthModel(true,true,true,true,true);m.state.economyV3=true;m.state.tutorial=5;m.state.account.currencies={...m.state.account.currencies,fish:20000,threads:5000,stamps:6000};return m;}
it('swaps menu seats by tap and drag and round-trips a saved crew through the live rules',()=>{
 const m=model();render(<FormationB2 m={m}/>);const seats=R.formationSeatsC2(m.state.team,m.state.rows),front=seats[0]!,rear=seats[2]!;
 const button=(id:string)=>screen.getByRole('button',{name:new RegExp(`^${R.CAT_BY_ID[id]!.name},`)});
 fireEvent.click(button(rear));fireEvent.click(button(front));expect(m.state.rows[rear]).toBe('front');expect(R.validRowsC2(m.state.team,m.state.rows)).toBe(true);
 fireEvent.drop(button(rear),{dataTransfer:{getData:()=>front}});expect(m.state.rows[front]).toBe('front');
 fireEvent.click(screen.getByRole('button',{name:'Saved'}));fireEvent.click(screen.getByRole('button',{name:'Save'}));const saved=structuredClone(m.state.team);
 fireEvent.click(screen.getByRole('button',{name:'Close dialog'}));fireEvent.click(button(rear));fireEvent.click(button(front));expect(m.state.team).not.toEqual(saved);
 fireEvent.click(screen.getByRole('button',{name:'Saved'}));fireEvent.click(screen.getByRole('button',{name:'Use'}));expect(m.state.team).toEqual(saved);expect(m.error).toBe(false);
});
it('shows the wearer quote, spends only on confirmation and blocks a live patrol',()=>{
 const m=model(),item=m.state.gear[0]!;m.itemId=item.id;m.cardId='soot';const owner=Object.entries(m.state.equipment).find(([,s])=>Object.values(s).includes(item.id))?.[0]??'soot';
 render(<TextDietContext value={true}><BagB2 m={m}/></TextDietContext>);const before=R.exportSave(m.state),quote=R.enhancementPreview(item,m.state,owner);
 fireEvent.click(screen.getByRole('button',{name:'Enhance +1'}));expect(R.exportSave(m.state)).toBe(before);const panel=screen.getByLabelText('Enhancement quote');expect(panel.textContent).toContain(String(quote.before));
 const expected=R.enhanceGear(m.state,item.id);fireEvent.click(screen.getByRole('button',{name:'Confirm enhance +1'}));expect(m.state.gear).toEqual(expected.state.gear);expect(m.state.account.currencies).toEqual(expected.state.account.currencies);
 act(()=>{m.state=R.startRun(m.state,1,24).state;m.notify(false);});const during=R.exportSave(m.state);expect((screen.getByRole('button',{name:'Confirm enhance +2'}) as HTMLButtonElement).disabled).toBe(true);expect(R.exportSave(m.state)).toBe(during);
});
it('fuses exactly the selected same-set inputs and disables incomplete recipes',()=>{
 const m=model();m.state.gear=Array.from({length:4},(_,i)=>R.makeGear(m.state,'hearthloom-weapon-common',80+i));m.state.equipment={};
 render(<BoundFusion m={m}/>);expect((screen.getByRole('button',{name:'Fuse 0/4'}) as HTMLButtonElement).disabled).toBe(true);
 for(const b of screen.getAllByRole('button',{name:'Common Hearthloom Pan, +0'}))fireEvent.click(b);
 const expected=R.fuseBoundV3(m.state,m.state.gear.map(g=>g.id));fireEvent.click(screen.getByRole('button',{name:'Fuse 4/4'}));expect(m.state.gear).toEqual(expected.state.gear);expect(m.state.gear).toHaveLength(1);
});
it('crafts a batch atomically and refuses over-cap or unaffordable batches without consuming inputs',()=>{
 const m=model(),action={kind:'craft' as const,recipe:'mend-pantry-key'},before=R.exportSave(m.state),owned=m.state.account.inventory.stacks['pantry-key']??0;
 const result=supplyBatchB2(m.state,action,10);expect(result.ok).toBe(true);expect(result.state.account.inventory.stacks['pantry-key']).toBe(owned+10);expect(R.exportSave(m.state)).toBe(before);
 m.state.account.inventory.stacks['pantry-key']=98;const failed=supplyBatchB2(m.state,action,2);expect(failed.ok).toBe(false);expect(failed.state).toBe(m.state);expect(failed.completed).toBe(1);
 m.state.account.inventory.stacks['pantry-key']=0;m.state.account.currencies.threads=0;expect(supplyBatchB2(m.state,action,1).ok).toBe(false);
 for(const n of [0,-1,1.5,100])expect(supplyBatchB2(m.state,action,n).ok).toBe(false);
});
it('uses only enough milk to restore missing HP and refuses an oversized batch atomically',()=>{
 const m=model();m.state=R.startRun(m.state,1,27).state;const cat=m.state.team[0]!,max=m.state.run!.hp[cat]!;m.state.run!.hp[cat]=max-150;m.state.account.inventory.stacks['milk-tonic']=10;
 const action={kind:'use' as const,supply:'milk-tonic' as const,cat},before=R.exportSave(m.state),result=supplyBatchB2(m.state,action,2);
 expect(result.ok).toBe(true);expect(result.state.run!.hp[cat]).toBe(max);expect(result.state.account.inventory.stacks['milk-tonic']).toBe(8);expect(R.exportSave(m.state)).toBe(before);
 const failed=supplyBatchB2(m.state,action,3);expect(failed.ok).toBe(false);expect(failed.state).toBe(m.state);
 expect(supplyBatchB2(m.state,{...action,supply:'shield-biscuit'},2).ok).toBe(false);
});
