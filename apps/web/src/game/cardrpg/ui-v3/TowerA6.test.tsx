import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {DepthModel} from '../depth/model';
import {TowerA6} from './TowerA6';
import {RouteV3} from './EncounterV3';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
afterEach(cleanup);
it('shows thirty fixed floors, the next chest and a clear chapter unlock',()=>{
 const m=new DepthModel(true,true,true,true);render(<TowerA6 m={m}/>);
 expect(screen.getByText('0/30 floors cleared · Next chest: floor 5')).toBeTruthy();
 expect(screen.getAllByRole('button',{name:/^Floor \d+(?: locked| cleared)?$/})).toHaveLength(30);
 expect((screen.getByRole('button',{name:/Climb floor 1/}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getByText(/Clear Tangled Cafe to open the tower/)).toBeTruthy();
});
it('starts the selected unlocked floor with the existing preparation and claims one milestone',()=>{
 const m=new DepthModel(true,true,true,true);m.state.cleared=[1,2,3];m.state.towerBest=5;
 const {rerender}=render(<TowerA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 1'}));
 fireEvent.click(screen.getByRole('button',{name:'Floor 5 Collect'}));
 expect(m.state.challengeClaims).toContain('a6-tower-chest-5');
 rerender(<TowerA6 m={m}/>);
 expect((screen.getByRole('button',{name:'Floor 5 Collected'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Climb'}));
 fireEvent.click(screen.getByRole('button',{name:/Climb floor 6/}));
 expect(m.screen).toBe('prepare');expect(m.state.run?.floor).toBe(6);
 expect(m.battle?.initial.gameplayA6).toBe(true);
 expect(m.state.run?.nodes).toHaveLength(1);
});

it('keeps an active Tower replay on its own floor in the preparation route tab',()=>{
 const m=new DepthModel(true,true,true,true);m.state.cleared=[1,2,3];m.state.towerBest=5;
 m.state=R.enterNode(R.startTowerFloorA6(m.state,1).state,'0-0').state;
 const back=vi.fn(()=>m.go('prepare'));render(<RouteV3 m={m} onReturn={back}/>);
 expect(screen.getByRole('heading',{name:'Yarn Tower'})).toBeTruthy();
 expect(screen.queryByText('Lantern streets')).toBeNull();
 expect(screen.getByRole('button',{name:'Floor 1 cleared'}).getAttribute('aria-pressed')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:'Return to formation'}));
 expect(back).toHaveBeenCalledOnce();expect(m.screen).toBe('prepare');
});

function earnedTower() {
 const m=new DepthModel(true,true,true,true);
 m.state=R.setGameplayA6(R.createDepthAccount(25,0),true);
 Object.defineProperty(m,'cafeNow',{get:()=>0});
 m.state.cleared=[1,2,3];m.state.towerBest=30;
 return m;
}
it('keeps the chosen floor across gift sections and presents the current counter advice',()=>{
 const m=earnedTower();render(<TowerA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Floor 1 cleared'}));
 expect(screen.getByRole('button',{name:'Climb floor 1'})).toBeTruthy();
 expect(screen.queryByText(/Hush prevents the brace/)).toBeNull();
 expect(screen.getByText('Use Shred and direct hits to strip shields, or Burn to bypass them.')).toBeTruthy();
 const before=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:/Milestone gifts/}));
 expect(screen.getAllByRole('article')).toHaveLength(6);
 fireEvent.click(screen.getByRole('button',{name:'Climb'}));
 expect(screen.getByRole('button',{name:'Floor 1 cleared'}).getAttribute('aria-pressed')).toBe('true');
 expect(R.exportSave(m.state)).toBe(before);
});
it('shows and grants only the available cap remainder, then leaves unclaimed gifts for later',()=>{
 const m=earnedTower();m.state.account.daily.earned={...R.DEPTH_CAPS_V4,stamps:R.DEPTH_CAPS_V4.stamps-3,threads:R.DEPTH_CAPS_V4.threads-2};
 const before=structuredClone(m.state.account.currencies);render(<TowerA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 6'}));
 const gift=screen.getByRole('article',{name:'Floor 5 gift'});
 expect(within(gift).getByText('3 stamps')).toBeTruthy();expect(within(gift).getByText('2 threads')).toBeTruthy();
 fireEvent.click(within(gift).getByRole('button',{name:'Floor 5 Collect'}));
 expect(m.state.account.currencies.stamps).toBe(before.stamps+3);expect(m.state.account.currencies.threads).toBe(before.threads+2);
 expect(m.state.challengeClaims).toEqual(['a6-tower-chest-5']);
 expect(screen.getByRole('button',{name:'Milestone gifts 0'})).toBeTruthy();
 const saved=R.exportSave(m.state);
 for(const button of screen.getAllByRole('button',{name:/^Floor .* (?:Collect|Collected)$/})) {
  expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(button);
 }
 expect(R.exportSave(m.state)).toBe(saved);
 expect(screen.getByText('Today’s supplies are full. Your gifts can wait.')).toBeTruthy();
});
it('keeps every gift disabled during a route and exposes the correct return action',()=>{
 const m=earnedTower();m.state=R.startTowerFloorA6(m.state,5).state;
 const back=vi.fn();render(<TowerA6 m={m} onReturn={back}/>);
 fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 0'}));
 for(const button of screen.getAllByRole('button',{name:/^Floor .* Collect$/})) expect((button as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getByText('Finish your route to collect your gifts.')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Return to formation'}));expect(back).toHaveBeenCalledOnce();
 act(()=>{m.state.run=null;m.state.challengeClaims=R.TOWER_CHESTS_A6.map(f=>'a6-tower-chest-'+f);m.notify(false);});
 expect(screen.getByText('All six gifts are safely with your crew.')).toBeTruthy();
 expect(screen.getAllByRole('button',{name:/^Floor .* Collected$/})).toHaveLength(6);
});

it('discloses the full gift and the one-time cost of collecting a reduced amount',()=>{
 const m=earnedTower();m.state.account.daily.earned={...R.depthCaps(m.state),threads:R.depthCaps(m.state).threads-12};
 const expected=R.claimTowerChestA6(m.state,5),before=R.exportSave(m.state);
 render(<TowerA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 6'}));
 const gift=screen.getByRole('article',{name:'Floor 5 gift'}),button=within(gift).getByRole('button',{name:'Floor 5 Collect'});
 expect(within(gift).getByText('60 stamps')).toBeTruthy();expect(within(gift).getByText('15 threads')).toBeTruthy();
 expect(within(gift).getByText('0 stamps')).toBeTruthy();expect(within(gift).getByText('12 threads')).toBeTruthy();
 expect(button.textContent).toBe('Collect reduced gift');
 const description=button.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)!.textContent).join(' ');
 expect(description).toContain('Collecting today uses the whole gift');expect(description).toContain('12 threads');
 expect(R.exportSave(m.state)).toBe(before);fireEvent.click(button);
 expect(m.state).toEqual(expected.state);
});

it('keeps capped rewards visible and restores full collection when a new day has room',()=>{
 const m=earnedTower();m.state.account.daily.earned={...R.depthCaps(m.state)};
 render(<TowerA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 0'}));
 const gift=screen.getByRole('article',{name:'Floor 30 gift'});
 expect(within(gift).getByText('110 stamps')).toBeTruthy();expect(within(gift).getByText('40 threads')).toBeTruthy();
 expect(within(gift).getByText('0 stamps')).toBeTruthy();expect(within(gift).getByText('0 threads')).toBeTruthy();
 const before=R.exportSave(m.state);fireEvent.click(within(gift).getByRole('button'));expect(R.exportSave(m.state)).toBe(before);
 act(()=>m.apply(R.metaCommand(m.state,{type:'advanceLocalDay'})));
 expect(screen.getByRole('button',{name:'Milestone gifts 6'})).toBeTruthy();expect(within(gift).queryByText('Today:')).toBeNull();
 const expected=R.claimTowerChestA6(m.state,30);fireEvent.click(within(gift).getByRole('button'));expect(m.state).toEqual(expected.state);
});

it('plans only the next playable floor from a future gift, transfers focus and leaves the save alone',()=>{
 const m=earnedTower();m.state.towerBest=5;render(<TowerA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'Floor 1 cleared'}));
 fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 1'}));const before=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:'Plan floor 6 toward floor 30 gift'}));
 const climb=screen.getByRole('button',{name:'Climb floor 6'});
 expect(document.activeElement).toBe(climb);expect(R.exportSave(m.state)).toBe(before);
 expect(screen.getByRole('button',{name:'Floor 6'}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByRole('button',{name:'Floor 30 locked'}).getAttribute('aria-pressed')).toBe('false');
 const expected=R.enterNode(R.startTowerFloorA6(m.state,6).state,'0-0');fireEvent.click(climb);expect(m.state).toEqual(expected.state);
});

it('describes an active patrol accurately and does not offer future-floor planning',()=>{
 const m=earnedTower();m.state.tutorial=4;m.state.towerBest=5;m.state=R.startRun(m.state,1,826015).state;
 render(<TowerA6 m={m}/>);fireEvent.click(screen.getByRole('button',{name:'Milestone gifts 0'}));
 expect(within(screen.getByRole('article',{name:'Floor 5 gift'})).getByText('Finish your route first.')).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Plan floor/})).toBeNull();
 const before=R.exportSave(m.state);fireEvent.click(screen.getByRole('button',{name:'Return to your patrol'}));
 expect(m.screen).toBe('map');expect(R.exportSave(m.state)).toBe(before);
});
