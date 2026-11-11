import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { FormationA6 } from './FormationA6';
import { suggestedTeamsA6 } from './formation-a6';

const modal=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'showModal');
const close=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'close');
beforeAll(()=>{
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value(){this.open=true;}});
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value(){this.open=false;}});
});
afterAll(()=>{
 if(modal)Object.defineProperty(HTMLDialogElement.prototype,'showModal',modal);else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
 if(close)Object.defineProperty(HTMLDialogElement.prototype,'close',close);else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
});
const openSaved=()=>fireEvent.click(screen.getByRole('button',{name:'Saved teams'}));
const openSuggested=()=>fireEvent.click(screen.getByRole('button',{name:'Suggested teams · 3 plans'}));
const closeTool=()=>fireEvent.click(screen.getByRole('button',{name:/Back to formation/}));
beforeEach(()=>vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const model=()=>new DepthModel(true,true,true,true);
it('offers three legal owned teams with a front cat and filters cats below the route band',()=>{
  const m=model();
  m.state.account.cards.push({id:'panko-owned',cardId:'panko',level:1,stars:1,shards:0,soulbound:true});
  const before=R.exportSave(m.state),suggestions=suggestedTeamsA6(m.state);
  expect(suggestions).toHaveLength(3);
  expect(new Set(suggestions.map(s=>s.team.slice().sort().join())).size).toBe(3);
  for(const suggestion of suggestions){
    expect(R.configureTeam(m.state,suggestion.team,suggestion.rows,m.state.skills).ok).toBe(true);
    expect(suggestion.power).toBe(R.teamPowerV4({...m.state,team:suggestion.team}));
  }
  expect(R.exportSave(m.state)).toBe(before);
  expect(suggestedTeamsA6(m.state,2)).toEqual([]);
});
it('moves the selected cat, keeps a front cat and stores separate mode teams',()=>{
  const m=model();render(<FormationA6 m={m}/>);
  expect((screen.getByRole('button',{name:'Place Mochi rear'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Select Soot for placement'}));
  fireEvent.click(screen.getByRole('button',{name:'Place Soot front'}));
  expect(m.state.rows.soot).toBe('front');
  openSaved();
  fireEvent.click(screen.getByRole('button',{name:'Save team'}));
  fireEvent.change(screen.getByLabelText('Team mode'),{target:{value:'tower'}});
  closeTool();openSuggested();
  fireEvent.click(screen.getByRole('button',{name:'Use suggested team 3: Boss breakers'}));
  openSaved();
  fireEvent.click(screen.getByRole('button',{name:'Save team'}));
  expect(m.state.v4!.loadouts![0]!.rows.soot).toBe('front');
  expect(m.state.v4!.loadouts![2]!.plan.focus).toBe('leader');
  expect(m.state.v4!.loadouts![1]).toBeNull();
  fireEvent.change(screen.getByLabelText('Team mode'),{target:{value:'campaign'}});
  fireEvent.click(screen.getByRole('button',{name:'Use saved campaign team'}));
  expect(m.state.rows.soot).toBe('front');
});
it('changes preparation without rerolling foes or the seed, then locks committed changes',()=>{
  const m=model();m.start(1,'campaign',1);m.enter(R.availableNodes(m.state.run!)[0]!.id);
  const seed=m.battle!.seed,foes=m.battle!.initial.enemies;
  render(<FormationA6 m={m} preparing/>);
  openSuggested();
  fireEvent.click(screen.getByRole('button',{name:'Use suggested team 2: Bonded partners'}));
  expect(m.error).toBe(false);expect(m.battle!.seed).toBe(seed);expect(m.battle!.initial.enemies).toEqual(foes);
  expect(m.battle!.v4!.plan.focus).toBe('support');
  openSaved();
  expect((screen.getByRole('button',{name:'Save team'}) as HTMLButtonElement).disabled).toBe(true);
  closeTool();act(()=>m.fight());
  openSuggested();
  expect((screen.getByRole('button',{name:'Use suggested team 2: Bonded partners'}) as HTMLButtonElement).disabled).toBe(true);
  closeTool();
  expect((screen.getByRole('button',{name:'Select Mochi for placement'}) as HTMLButtonElement).disabled).toBe(true);
});
