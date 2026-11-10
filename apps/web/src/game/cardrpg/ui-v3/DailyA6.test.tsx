import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {DailyA6} from './DailyA6';
import {badgesA6} from './badges-a6';
afterEach(cleanup);
it('shows five activities, seven gifts and three weekly chests; claims the visible login reward once',()=>{
 const m=new DepthModel(true,true,true,true);m.state=R.setGameplayA6(R.createDepthAccount(11,0),true);Object.defineProperty(m,'cafeNow',{get:()=>0});
 render(<DailyA6 m={m}/>);
 expect(screen.getAllByRole('progressbar')).toHaveLength(1);
 expect(screen.getAllByText('In progress')).toHaveLength(5);
 expect(screen.getAllByText(/^Day [1-7]$/)).toHaveLength(7);
 expect(badgesA6(m.state,0).login).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Collect login gift'}));
 expect(m.state.dailyA6?.loginGifts).toBe(1);
 expect(badgesA6(m.state,0).login).toBe(false);
 expect((screen.getByRole('button',{name:'Next gift tomorrow'}) as HTMLButtonElement).disabled).toBe(true);
});
it('all available reward badges lead to successful public claims and previews never mutate state',()=>{
 let s=R.setGameplayA6(R.createDepthAccount(11,0),true);
 s=R.metaCommand(s,{type:'level',cardId:'mochi'}).state;
 const before=R.exportSave(s),b=badgesA6(s,0);
 expect(b.tasks.map(t=>t.id)).toContain('train');
 for(const t of b.tasks)expect(R.claimDailyA6(s,0,'task',t.id).ok).toBe(true);
 for(const w of b.weekly)expect(R.claimDailyA6(s,0,'weekly',w.points).ok).toBe(true);
 for(const c of b.stars)expect(R.claimStarRewardV4(s,c.id).ok).toBe(true);
 for(const floor of b.tower)expect(R.claimTowerChestA6(s,floor).ok).toBe(true);
 for(const c of b.journal)expect(R.claimMilestoneV4(s,c.id).ok).toBe(true);
 if(b.cat)expect(R.applyUpgradeA6(s,b.cat.change).ok).toBe(true);
 if(b.gearUpgrade)expect(R.applyUpgradeA6(s,b.gearUpgrade.change).ok).toBe(true);
 if(b.autoEquip)expect(R.autoEquipA6(s).ok).toBe(true);
 expect(R.exportSave(s)).toBe(before);
 s=R.startRun(s,1,11).state;
 const active=badgesA6(s,0);expect(active.events).toBe(0);expect(active.cats||active.gear||active.recruit||active.idle).toBe(false);
});

it('hides reward dots when all supplies are capped and login was already collected',()=>{
 let s=R.setGameplayA6(R.createDepthAccount(11,0),true);
 s=R.claimDailyA6(s,0,'login').state;s.account.daily.earned={...R.DEPTH_CAPS_V4};
 const b=badgesA6(s,600000);expect(b.events).toBe(0);expect(b.idle).toBe(false);
 expect(badgesA6(R.createDepthAccount(11,0),0).events).toBe(0);
});
