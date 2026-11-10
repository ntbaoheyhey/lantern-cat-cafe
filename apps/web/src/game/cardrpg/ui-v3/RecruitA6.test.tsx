import {CompanionGrowthV4} from '../depth/CompanionGrowthV4';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import RecruitV3 from './RecruitV3';
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
const ready=()=>{const m=new DepthModel(true,true,true,true);m.state=R.setGameplayA6(R.createDepthAccount(11,0),true);m.state.freeInvite=true;return m;};
it('finishes ten committed draws in four batch beats under eight seconds',()=>{
 const m=ready();const {container}=render(<RecruitV3 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Recruit ×10 · 600'}));
 expect(m.state.account.daily.draws).toBe(10);expect(m.state.account.currencies.stamps).toBe(0);
 expect((screen.getByRole('button',{name:'Skip all'}) as HTMLButtonElement).disabled).toBe(true);
 expect(container.querySelector('.uv-odds')?.hasAttribute('open')).toBe(true);
 act(()=>vi.advanceTimersByTime(600));expect((screen.getByRole('button',{name:'Skip all'}) as HTMLButtonElement).disabled).toBe(false);
 act(()=>vi.advanceTimersByTime(900));
 expect(container.querySelectorAll('.a6-recruit-burst .a6-recruit-cards article')).toHaveLength(10);
 act(()=>vi.advanceTimersByTime(1400));expect(container.querySelector('.a6-recruit-highlight')).toBeTruthy();
 act(()=>vi.advanceTimersByTime(2500));expect(screen.getByRole('heading',{name:'Welcome home'})).toBeTruthy();
 expect(m.state.account.daily.draws).toBe(10);
});
it('skipping after the first beat preserves the exact committed rewards',()=>{
 const m=ready();render(<RecruitV3 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Recruit ×10 · 600'}));
 const saved=R.exportSave(m.state);act(()=>vi.advanceTimersByTime(600));fireEvent.click(screen.getByRole('button',{name:'Skip all'}));
 expect(R.exportSave(m.state)).toBe(saved);expect(screen.getByRole('heading',{name:'Welcome home'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Meet your cats'}));expect(m.screen).toBe('collection');
});

it('shows duplicate shard ownership beside the real star-up requirement',()=>{
 const m=ready();const card=m.state.account.cards.find(c=>c.cardId==='clover')!;card.shards=8;
 const view=render(<CompanionGrowthV4 m={m} catId="clover" kind="ascend"/>);
 expect(screen.getByText('8 matching shards owned')).toBeTruthy();
 expect((screen.getByRole('button',{name:'Add a star'}) as HTMLButtonElement).disabled).toBe(true);
 card.shards=10;view.rerender(<CompanionGrowthV4 m={m} catId="clover" kind="ascend"/>);
 fireEvent.click(screen.getByRole('button',{name:'Add a star'}));
 expect(m.state.account.cards.find(c=>c.cardId==='clover')).toMatchObject({stars:2,shards:0});
});
