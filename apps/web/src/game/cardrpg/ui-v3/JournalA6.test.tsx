import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {JournalA6} from './JournalA6';

afterEach(cleanup);
function readyJournal() {
 const m=new DepthModel(true,true,true,true);
 m.state=R.setGameplayA6(R.createDepthAccount(17,0),true);
 m.state.v4!.journal={cats:[],gear:[],sets:[],rewardedRoutes:10,claims:[]};
 return m;
}
it('discloses the capped milestone amount and settles only once through its visible button',()=>{
 const m=readyJournal();m.state.account.daily.earned.stamps=R.depthCaps(m.state).stamps-10;
 const before=m.state.account.currencies.stamps;
 render(<JournalA6 m={m}/>);
 const button=screen.getByRole('button',{name:'Claim Ten evenings of effort'});
 const ticket=button.closest('article')!;
 expect(within(ticket).getByText('10 stamps')).toBeTruthy();
 fireEvent.click(button);
 expect(m.state.account.currencies.stamps-before).toBe(10);
 expect(R.journalV4(m.state).claims.filter(id=>id==='ten-routes')).toHaveLength(1);
 expect((screen.getByRole('button',{name:'Claim Ten evenings of effort'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(button);
 expect(m.state.account.currencies.stamps-before).toBe(10);
});
it('keeps a full-cap gift pending, then makes the same gift collectible on the next local day',()=>{
 const m=readyJournal();m.state.account.daily.earned={...R.depthCaps(m.state)};
 render(<JournalA6 m={m}/>);
 const button=screen.getByRole('button',{name:'Claim Ten evenings of effort'});
 expect((button as HTMLButtonElement).disabled).toBe(true);
 expect(within(button.closest('article')!).getByText(/Daily reward space is full/)).toBeTruthy();
 fireEvent.click(button);
 expect(R.journalV4(m.state).claims).not.toContain('ten-routes');
 act(()=>m.apply(R.metaCommand(m.state,{type:'advanceLocalDay'}),'Next day.'));
 expect((screen.getByRole('button',{name:'Claim Ten evenings of effort'}) as HTMLButtonElement).disabled).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Claim Ten evenings of effort'}));
 expect(R.journalV4(m.state).claims).toContain('ten-routes');
});
it('retains the route lock for completed milestones without consuming the gift',()=>{
 const m=readyJournal();m.state.tutorial=4;m.state=R.startRun(m.state,1,17).state;
 expect(m.state.run?.complete).toBe(false);
 const before=R.exportSave(m.state);
 render(<JournalA6 m={m}/>);
 const button=screen.getByRole('button',{name:'Claim Ten evenings of effort'});
 expect((button as HTMLButtonElement).disabled).toBe(true);
 expect(within(button.closest('article')!).getByText('Finish your route first.')).toBeTruthy();
 fireEvent.click(button);
 expect(R.exportSave(m.state)).toBe(before);
});
