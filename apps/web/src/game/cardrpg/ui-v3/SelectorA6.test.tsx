import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { SelectorA6 } from './SelectorA6';

afterEach(cleanup);
function model(){const m=new DepthModel(true,true,true,true);m.state=R.setGameplayA6(R.createDepthAccount(826051,0),true);m.state.v4!.selectorMarks=48;return m;}
function select(kind:'cat'|'gear',id:string){fireEvent.change(screen.getByLabelText('Reward type'),{target:{value:kind}});fireEvent.change(screen.getByLabelText('Chosen reward'),{target:{value:id}});}
const choose=()=>screen.getByRole('button',{name:'Choose reward · 24 marks'});

it('previews a new companion without spending, settles the exact command and opens that cat',()=>{
 const m=model(),before=R.exportSave(m.state),expected=R.chooseSelectorV4(m.state,'cat','sorrel');render(<SelectorA6 m={m}/>);select('cat','sorrel');
 const preview=screen.getByRole('region',{name:'Chosen reward preview'});expect(preview.textContent).toContain('Level 1 · 1 star');expect(preview.textContent).toContain('Marks after choosing: 48 → 24.');expect(choose().getAttribute('aria-describedby')).toBe(preview.id);expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(choose());expect(m.state).toEqual(expected.state);expect(screen.getByRole('status').textContent).toContain('Sorrel joined at level 1. 24 marks spent; 24 left. Banner pity unchanged.');
 fireEvent.click(screen.getByRole('button',{name:'View this cat'}));expect(m.cardId).toBe('sorrel');expect(m.screen).toBe('collection');
});

it('quotes actual duplicate shards, preserves level and stars, and rejects a full shard balance',()=>{
 const m=model();m.shortcut('unlock');m.state.v4!.selectorMarks=48;const cat=m.state.account.cards.find(c=>c.cardId==='mochi')!,before={...cat};
 const ui=render(<SelectorA6 m={m}/>);select('cat','mochi');expect(screen.getByText('120 → 122 matching shards (+2)')).toBeTruthy();fireEvent.click(choose());expect(m.state.account.cards.find(c=>c.cardId==='mochi')).toEqual({...before,shards:122});expect(screen.getByRole('status').textContent).toContain('Mochi: +2 matching shards.');
 m.state.account.cards.find(c=>c.cardId==='mochi')!.shards=Number.MAX_SAFE_INTEGER;m.state={...m.state};ui.rerender(<SelectorA6 m={m}/>);
 expect((choose()as HTMLButtonElement).disabled).toBe(true);expect(screen.getByText('This saved balance is full.')).toBeTruthy();const full=R.exportSave(m.state);fireEvent.click(choose());expect(R.exportSave(m.state)).toBe(full);
});

it('lists every missing gear requirement before enough marks are earned',()=>{
 const m=model(),gear=R.GEAR.find(g=>g.chapter===3&&g.rarity==='legendary')!;m.state.v4!.selectorMarks=3;
 while(m.state.gear.length<R.GEAR_CAP_V4)m.state.gear.push(R.makeGear(m.state,R.GEAR[0]!.id,826051));
 const before=R.exportSave(m.state);render(<SelectorA6 m={m}/>);select('gear',gear.id);
 for(const text of ['Earn 21 more selector marks.','The equipment shelf is full (240).','Reach chapter 3.','Complete chapter 3 mastery for this legendary template.'])expect(screen.getByText(text)).toBeTruthy();
 expect((choose()as HTMLButtonElement).disabled).toBe(true);expect(R.exportSave(m.state)).toBe(before);
});

it('reveals the full shard balance even when missing marks and collection also block the choice',()=>{
 const m=model();m.state.v4!.selectorMarks=3;m.state.account.cards.find(c=>c.cardId==='mochi')!.shards=Number.MAX_SAFE_INTEGER;
 const before=R.exportSave(m.state);render(<SelectorA6 m={m}/>);select('cat','mochi');
 for(const text of ['Earn 21 more selector marks.','Choose an uncollected companion first.','This saved balance is full.'])expect(screen.getByText(text)).toBeTruthy();
 expect((choose()as HTMLButtonElement).disabled).toBe(true);expect(R.exportSave(m.state)).toBe(before);
});

it('adds another owned gear template as a separate piece and opens its exact instance',()=>{
 const m=model(),gear=R.GEAR[0]!;m.state.gear.push(R.makeGear(m.state,gear.id,826051));const count=m.state.gear.filter(g=>g.templateId===gear.id).length,expected=R.chooseSelectorV4(m.state,'gear',gear.id),pity=structuredClone(m.state.account.pity),stamps=m.state.account.currencies.stamps;
 render(<SelectorA6 m={m}/>);select('gear',gear.id);expect(screen.getByText(`${count} → ${count+1} owned · one new piece in your bag`)).toBeTruthy();fireEvent.click(choose());expect(m.state).toEqual(expected.state);expect(m.state.account.pity).toEqual(pity);expect(m.state.account.currencies.stamps).toBe(stamps);
 fireEvent.click(screen.getByRole('button',{name:'View this gear'}));expect(m.itemId).toBe(expected.state.gear.at(-1)!.id);expect(m.screen).toBe('inventory');
});

it('does not spend on a stale eligible view after a route starts and retains the chosen reward',()=>{
 const m=model();render(<SelectorA6 m={m}/>);select('cat','sorrel');expect((choose()as HTMLButtonElement).disabled).toBe(false);
 m.state=R.startRun(m.state,1,826051).state;const locked=R.exportSave(m.state);fireEvent.click(choose());expect(R.exportSave(m.state)).toBe(locked);expect((screen.getByLabelText('Chosen reward')as HTMLSelectElement).value).toBe('sorrel');expect(screen.queryByRole('button',{name:'View this cat'})).toBeNull();expect(screen.getByText('Finish the current route.')).toBeTruthy();expect((choose()as HTMLButtonElement).disabled).toBe(true);
});

it('blocks duplicates until all companions are collected and clears the previous quote on type change',()=>{
 const m=model();render(<SelectorA6 m={m}/>);select('cat','mochi');expect((choose()as HTMLButtonElement).disabled).toBe(true);expect(screen.getByText('Choose an uncollected companion first.')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Reward type'),{target:{value:'gear'}});const preview=screen.getByRole('region',{name:'Chosen reward preview'});expect(within(preview).queryByRole('heading')).toBeNull();expect((screen.getByLabelText('Chosen reward')as HTMLSelectElement).value).toBe('');expect((choose()as HTMLButtonElement).disabled).toBe(true);
});
