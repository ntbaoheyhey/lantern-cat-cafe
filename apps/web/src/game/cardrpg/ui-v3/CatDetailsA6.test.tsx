import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {CatDetailsA6} from './CatDetailsA6';

afterEach(cleanup);
it('browses all four exact current effects without changing the account or losing preview navigation',()=>{
 const m=new DepthModel(true,true,true,true),before=JSON.stringify(m.state),preview=vi.fn();
 render(<CatDetailsA6 m={m} catId="mochi" onPreview={preview}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));
 for(const skill of R.CAT_BY_ID.mochi!.skills){
  fireEvent.click(within(screen.getByRole('navigation',{name:'Mochi skills'})).getByRole('button',{name:new RegExp(skill.name)}));
  expect(screen.getByRole('region',{name:skill.name}).textContent).toContain(R.kitSkillV5(skill).description);
 }
 expect(screen.queryByText('Opens at level 6 or 3 stars')).toBeNull();
 expect(screen.getByText('Automatic at 100 rage')).toBeTruthy();
 expect(JSON.stringify(m.state)).toBe(before);
 fireEvent.click(screen.getByRole('button',{name:'Watch skill previews'}));expect(preview).toHaveBeenCalledExactlyOnceWith(R.CAT_BY_ID.mochi!.skills.at(-1)!.id);
 fireEvent.click(screen.getByRole('button',{name:'Growth'}));expect(screen.getByRole('button',{name:'Level up'})).toBeTruthy();
});
it('discloses automatic ultimates from recruitment through growth, and keeps unowned cats recruitable',()=>{
 const m=new DepthModel(true,true,true,true),card=m.state.account.cards.find(c=>c.cardId==='mochi')!;
 const {rerender}=render(<CatDetailsA6 m={m} catId="mochi" onPreview={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));fireEvent.click(screen.getByRole('button',{name:/Last light shelter/}));
 for(const [level,stars] of [[1,1],[6,1],[1,3]]){
  card.level=level!;card.stars=stars!;rerender(<CatDetailsA6 m={m} catId="mochi" onPreview={()=>{}}/>);
  expect(screen.getByText('Automatic at 100 rage')).toBeTruthy();expect(screen.queryByText('Not yet unlocked')).toBeNull();
 }
 rerender(<CatDetailsA6 key="velvet" m={m} catId="velvet" onPreview={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));
 expect(screen.getByText('Recruit this cat to unlock their skills.')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Growth'}));fireEvent.click(screen.getByRole('button',{name:'Recruit'}));expect(m.screen).toBe('gacha');
});

it('explains the current kit cooldowns without using their historical values',()=>{
 const m=new DepthModel(true,true,true,true),before=JSON.stringify(m.state);
 const {rerender}=render(<CatDetailsA6 m={m} catId="soot" onPreview={()=>{}}/>);
 for(const [catId,skillName,wait] of [['soot','Black cup',2],['inkcap','Ink thread',1],['cinnamon','Second serving',4],['mochi','Door knock',0]] as const){
  rerender(<CatDetailsA6 key={catId} m={m} catId={catId} onPreview={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Skills'}));
  fireEvent.click(screen.getByRole('button',{name:new RegExp(skillName)}));
  const note=screen.getByRole('region',{name:skillName});
  expect(note.textContent).toContain(wait?`Wait ${wait} round${wait===1?'':'s'} after use.`:'Can be used every round.');
  expect(note.textContent).toContain('Base effects shown.');
  expect(note.tabIndex).toBe(0);
 }
 expect(JSON.stringify(m.state)).toBe(before);
});

it('separates base effects from the active patrol bonus and clears completed-route bonuses',()=>{
 const m=new DepthModel(true,true,true,true),started=R.startRun(m.state,1,826116);
 expect(started.ok).toBe(true);m.state=started.state;m.state.run!.upgrades['soot-2']=2;
 const before=JSON.stringify(m.state);
 const {rerender}=render(<CatDetailsA6 m={m} catId="soot" onPreview={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));fireEvent.click(screen.getByRole('button',{name:/Black cup/}));
 const note=screen.getByRole('region',{name:'Black cup'});
 expect(note.textContent).toContain('Base effects shown. Your patrol rank 2 adds 40% effect power.');
 expect(note.textContent).toContain(R.kitSkillV5(R.CAT_BY_ID.soot!.skills[1]!).description);
 expect(JSON.stringify(m.state)).toBe(before);
 m.state.run!.complete=true;rerender(<CatDetailsA6 m={m} catId="soot" onPreview={()=>{}}/>);
 expect(screen.queryByText(/Your patrol rank/)).toBeNull();
});
