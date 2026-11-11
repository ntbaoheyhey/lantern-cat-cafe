import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {FieldGuideA6} from './FieldGuideA6';

afterEach(cleanup);
it('includes skill-specific statuses alongside the eight core statuses without duplicate aliases',()=>{
 render(<FieldGuideA6 v4 skillsV5/>);
 const index=screen.getByRole('navigation',{name:'keywords index'});
 expect(within(index).getAllByRole('button')).toHaveLength(19);
 for(const name of ['Crumb trail','Glaze','Shelter','Saucer riposte','Apron link','Second sprout','Yarn decoy']){
  fireEvent.click(within(index).getByRole('button',{name}));
  expect(screen.getByRole('region',{name:name+' field note'})).toBeTruthy();
 }
 expect(within(index).queryByRole('button',{name:'Tangle'})).toBeNull();
 expect(within(index).queryByRole('button',{name:'Hush'})).toBeNull();
 expect(within(index).queryByRole('button',{name:'Rattled'})).toBeNull();
 expect(screen.getByText(/Burn passes through/)).toBeTruthy();
 fireEvent.click(within(index).getByRole('button',{name:'Second sprout'}));
 expect(screen.getByRole('region',{name:'Second sprout field note'}).textContent).toContain('Protected from dispel');
 expect(screen.getByText(/25% HP, once per battle/)).toBeTruthy();
});

it('finds current effects by historical names and recovers an empty search with keyboard focus',()=>{
 render(<FieldGuideA6 v4 skillsV5/>);
 const search=screen.getByRole('searchbox',{name:'Find a field note'});
 for(const [term,current] of [['Tangle','Shred'],['Hush','Daze'],['Rattled','Daze'],['Scald','Burn']]){
  fireEvent.change(search,{target:{value:term}});
  expect(screen.getByRole('heading',{name:current})).toBeTruthy();
 }
 fireEvent.change(search,{target:{value:'nothing in this notebook'}});
 expect(screen.getByRole('heading',{name:'No notes found.'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Clear search'}));
 expect(document.activeElement).toBe(search);expect((search as HTMLInputElement).value).toBe('');
 expect(within(screen.getByRole('navigation',{name:'keywords index'})).getAllByRole('button')).toHaveLength(19);
});

it('explains actual reaction triggers, stack consumption and limits without requiring a named crew',()=>{
 render(<FieldGuideA6 v4 skillsV5/>);
 for(const [name,parts] of [
  ['Crumb Burst',['detonation skill','living foe carrying Crumb','Crumb and Burn stacks','through shields']],
  ['Wildfire',['at least 3 Burn','Splash, Row or All','1 Burn to each adjacent foe','Rupture takes priority']],
  ['Rupture',['leave the foe alive','both Bleed and Shred','12 HP damage per consumed stack','Shred remains']],
  ['Spread',['Defeat a foe carrying Mark','rounded up','nearest adjacent foe','can be resisted']],
 ] as const){
  fireEvent.click(within(screen.getByRole('navigation',{name:'keywords index'})).getByRole('button',{name}));
  const note=screen.getByRole('region',{name:name+' field note'}).textContent!;
  for(const part of parts)expect(note).toContain(part);
  expect(note).toContain('one per foe each round');expect(note).toContain('Reactions do not trigger other reactions');expect(note).toContain('Any crew');
 }
});

it('keeps the historical catalogue when the current skills mode is disabled',()=>{
 render(<FieldGuideA6 v4 skillsV5={false}/>);
 const index=screen.getByRole('navigation',{name:'keywords index'});
 expect(within(index).getAllByRole('button')).toHaveLength(16);
 fireEvent.click(within(index).getByRole('button',{name:'Tangle'}));
 expect(screen.getByText('Direct attack falls by 4% per stack.')).toBeTruthy();
 expect(within(index).queryByRole('button',{name:'Wildfire'})).toBeNull();
});
