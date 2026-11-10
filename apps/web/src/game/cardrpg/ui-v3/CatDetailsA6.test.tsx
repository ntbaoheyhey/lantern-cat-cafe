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
 expect(screen.getByText('Opens at level 6 or 3 stars')).toBeTruthy();
 expect(screen.queryByText('Automatic at 100 rage')).toBeNull();
 expect(JSON.stringify(m.state)).toBe(before);
 fireEvent.click(screen.getByRole('button',{name:'Watch skill previews'}));expect(preview).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Growth'}));expect(screen.getByRole('button',{name:'Level up'})).toBeTruthy();
});
it('uses either level or stars to disclose automatic ultimates, and keeps unowned cats recruitable',()=>{
 const m=new DepthModel(true,true,true,true),card=m.state.account.cards.find(c=>c.cardId==='mochi')!;
 const {rerender}=render(<CatDetailsA6 m={m} catId="mochi" onPreview={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));fireEvent.click(screen.getByRole('button',{name:/Last light shelter/}));
 for(const [level,stars] of [[6,1],[1,3]]){
  card.level=level!;card.stars=stars!;rerender(<CatDetailsA6 m={m} catId="mochi" onPreview={()=>{}}/>);
  expect(screen.getByText('Automatic at 100 rage')).toBeTruthy();expect(screen.queryByText('Not yet unlocked')).toBeNull();
 }
 rerender(<CatDetailsA6 key="velvet" m={m} catId="velvet" onPreview={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Skills'}));
 expect(screen.getByText('Recruit this cat to unlock their skills.')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Growth'}));fireEvent.click(screen.getByRole('button',{name:'Recruit'}));expect(m.screen).toBe('gacha');
});
