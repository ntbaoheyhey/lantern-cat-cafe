import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
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

function milestoneGifts() {
 const m=new DepthModel(true,true,true,true);
 m.state=R.setGameplayA6(R.createDepthAccount(11,0),true);
 Object.defineProperty(m,'cafeNow',{get:()=>0});
 m.state.v4!.journey!.stars={'1/0/0-0/battle':{key:'1/0/0-0/battle',chapter:1,band:0,nodeId:'0-0',kind:'battle',conditions:[true,true,true]}};
 m.state.towerBest=5;
 m.state.v4!.journal={cats:[],gear:[],sets:[],rewardedRoutes:10,claims:[]};
 return m;
}
it('opens all three ready milestone sources directly and settles each once with the live count',()=>{
 const m=milestoneGifts(),before=structuredClone(m.state.account.currencies);
 render(<DailyA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Ready gifts 3'}));
 for(const label of ['3-star chest','Floor 5 chest','Ten evenings of effort']) {
  const button=screen.getByRole('button',{name:`Collect ${label}`});
  expect((button as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(button);
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button);
 }
 expect(screen.getByRole('button',{name:'Ready gifts 0'}).getAttribute('aria-pressed')).toBe('true');
 expect(m.state.account.currencies.stamps-before.stamps).toBe(150);
 expect(m.state.account.currencies.threads-before.threads).toBe(15);
 expect(m.state.v4!.journey!.claims).toEqual(['stars-3']);
 expect(m.state.challengeClaims).toContain('a6-tower-chest-5');
 expect(R.journalV4(m.state).claims).toContain('ten-routes');
 fireEvent.click(screen.getByRole('button',{name:/Daily board/}));
 expect(screen.getByRole('button',{name:'Collect login gift'})).toBeTruthy();
});
it('shows the actual capped gift, keeps blocked milestones pending, and restores their count next day',()=>{
 const m=milestoneGifts();m.state.account.daily.earned={...R.depthCaps(m.state),stamps:R.depthCaps(m.state).stamps-10};
 render(<DailyA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Ready gifts 3'}));
 const star=screen.getByRole('button',{name:'Collect 3-star chest'}),before=m.state.account.currencies.stamps;
 expect(within(star.closest('article')!).getByRole('img',{name:'10 stamps'})).toBeTruthy();
 fireEvent.click(star);
 expect(m.state.account.currencies.stamps-before).toBe(10);
 expect(screen.getByRole('button',{name:'Ready gifts 0'})).toBeTruthy();
 expect(screen.getByText('Your gifts are safely waiting')).toBeTruthy();
 expect(R.journalV4(m.state).claims).not.toContain('ten-routes');
 act(()=>m.apply(R.metaCommand(m.state,{type:'advanceLocalDay'}),'Next day.'));
 expect(screen.getByRole('button',{name:'Ready gifts 2'})).toBeTruthy();
});
it('retains zero-ready and collected states without advertising a claim during a route',()=>{
 const m=milestoneGifts();m.state.tutorial=4;m.state=R.startRun(m.state,1,11).state;
 render(<DailyA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Ready gifts 0'}));
 const before=R.exportSave(m.state),panel=screen.getByRole('region',{name:'Adventure milestone gifts'});
 for(const button of within(panel).getAllByRole('button')) {
  expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button);
 }
 expect(R.exportSave(m.state)).toBe(before);
 act(()=>{m.state.run=null;m.state.v4!.journey!.claims=R.STAR_REWARDS_V4.map(c=>c.id);m.state.challengeClaims=R.TOWER_CHESTS_A6.map(f=>`a6-tower-chest-${f}`);m.state.v4!.journal!.claims=R.MILESTONES_V4.map(c=>c.id);m.notify(false);});
 expect(screen.getByText('Every keepsake collected')).toBeTruthy();
 expect(within(panel).getAllByText('Collected')).toHaveLength(14);
});
it('keeps the cafe ribbon collectible when every currency is capped',()=>{
 const m=milestoneGifts();m.state.cleared=[1,2,3];m.state.account.daily.earned={...R.depthCaps(m.state)};
 render(<DailyA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Ready gifts 1'}));
 const button=screen.getByRole('button',{name:'Collect Every evening explored'});
 expect(within(button.closest('article')!).getByText('Cafe ribbon')).toBeTruthy();
 const before={...m.state.account.currencies};fireEvent.click(button);
 expect(m.state.account.inventory.stacks['cafe-ribbon']).toBe(1);
 expect(m.state.account.currencies).toEqual(before);
 expect(screen.getByRole('button',{name:'Ready gifts 0'})).toBeTruthy();
});
