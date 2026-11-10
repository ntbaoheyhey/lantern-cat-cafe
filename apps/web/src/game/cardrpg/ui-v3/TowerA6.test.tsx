import {cleanup,fireEvent,render,screen} from '@testing-library/react';
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
 fireEvent.click(screen.getByRole('button',{name:'Floor 5 Collect'}));
 expect(m.state.challengeClaims).toContain('a6-tower-chest-5');
 rerender(<TowerA6 m={m}/>);
 expect((screen.getByRole('button',{name:'Floor 5 Collected'}) as HTMLButtonElement).disabled).toBe(true);
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
