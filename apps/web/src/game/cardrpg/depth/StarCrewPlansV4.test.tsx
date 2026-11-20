import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {RunMap} from './RunMap';
import {StarCrewPlansV4} from './StarCrewPlansV4';
import {starCrewPlansV4,dailySuppliesFullV4} from './star-plans-v4';
afterEach(cleanup);
const goal:R.NodeStarsV4={key:'1/1/1-0/event',chapter:1,band:1,nodeId:'1-0',kind:'event',conditions:[true,true,false]};
const state=()=>{
 const s=R.setGameplayV4(R.createDepthAccount(11),true);s.tutorial=4;s.freeInvite=true;s.cleared=[1,2,3];
 s.account.cards.push({id:'mallow',cardId:'mallow',level:1,stars:1,shards:0,soulbound:true});
 R.recordNodeStarsV4(s,goal);return s;
};
it('offers a real same-band swap without spending, moving gear or mutating the preview',()=>{
 const s=state(),before=R.exportSave(s),plans=starCrewPlansV4(s,goal,1);
 const p=plans.find(p=>p.incoming==='mallow'&&p.outgoing==='soot')!;
 expect(p).toBeTruthy();expect(R.exportSave(s)).toBe(before);
 const result=R.configureTeam(s,p.team,p.rows,s.skills);expect(result.ok).toBe(true);
 expect(result.state.account.currencies).toEqual(s.account.currencies);
 expect(result.state.equipment).toEqual(s.equipment);
 expect(result.state.rows.mallow).toBe(s.rows.soot);
 expect(R.crewThresholds(result.state.team).find(c=>c.id==='door')!.threshold).toBe(4);
 expect(result.state.v4!.journey!.found.some(d=>d.id==='crew:door:4')).toBe(true);
});
it('does not suggest under-level reserves or remove the only front slot',()=>{
 const s=state();s.account.cards.filter(c=>s.team.includes(c.cardId)).forEach(c=>c.level=3);
 expect(starCrewPlansV4(s,{...goal,band:3},3)).toEqual([]);
 for(const p of starCrewPlansV4(s,goal,1))expect(p.team.some(id=>p.rows[id]==='front')).toBe(true);
});
it('does not prescribe a job change for a different, complete or combat star',()=>{
 const s=state();
 expect(starCrewPlansV4(s,{...goal,conditions:[true,false,false]},1)).toEqual([]);
 expect(starCrewPlansV4(s,{...goal,conditions:[true,true,true]},1)).toEqual([]);
 expect(starCrewPlansV4(s,{...goal,kind:'battle'},1)).toEqual([]);
 expect(starCrewPlansV4(s,goal,2)).toEqual([]);
});
it('keeps an active route and OFF account out of the suggestion flow',()=>{
 const s=state(),run=R.startRun(s,1,123,'campaign','2026-11-06',1);expect(run.ok).toBe(true);
 expect(starCrewPlansV4(run.state,goal,1)).toEqual([]);
 expect(starCrewPlansV4(R.setGameplayV4(s,false),goal,1)).toEqual([]);
});
it('stops suggesting swaps once the crew already meets the star condition',()=>{
 const s=state(),p=starCrewPlansV4(s,goal,1)[0]!;
 const ready=R.configureTeam(s,p.team,p.rows,s.skills);expect(ready.ok).toBe(true);
 expect(starCrewPlansV4(ready.state,goal,1)).toEqual([]);
});
it('labels gathered supplies only when every actual currency allowance is full',()=>{
 const s=state();expect(dailySuppliesFullV4(s)).toBe(false);
 s.account.daily.earned={...R.depthCaps(s)};expect(dailySuppliesFullV4(s)).toBe(true);
 s.account.daily.earned.threads--;expect(dailySuppliesFullV4(s)).toBe(false);
 expect(dailySuppliesFullV4(R.setGameplayV4(s,false))).toBe(false);
});
it('requires a named button click and rechecks a stale offer before changing the crew',()=>{
 const m=new DepthModel(true,true);m.state=state();const before=R.exportSave(m.state);m.notify=vi.fn();
 const view=render(<StarCrewPlansV4 m={m} goal={goal} band={1}/>);
 expect(R.exportSave(m.state)).toBe(before);
 fireEvent.click(screen.getByText('Prepare for this star'));
 fireEvent.click(screen.getByRole('button',{name:'Use Mallow instead of Soot'}));
 expect(m.state.team).toEqual(['mochi','mallow','clover']);
 view.unmount();m.state=state();render(<StarCrewPlansV4 m={m} goal={goal} band={1}/>);
 fireEvent.click(screen.getByText('Prepare for this star'));
 m.state=R.startRun(m.state,1,123,'campaign','2026-11-06',1).state;
 const active=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:'Use Mallow instead of Soot'}));expect(R.exportSave(m.state)).toBe(active);
});

it('preserves legacy completion copy when switching off after a V4 route',()=>{
 const m=new DepthModel(true,false);let s=state();s=R.startRun(s,1,123,'campaign','2026-11-06',1).state;
 s.run!.complete=true;s.run!.won=true;s.run!.earnedItems=[];m.state=R.setGameplayV4(s,false);
 expect(m.state.run!.gameplayV4).toBe(true);
 render(<RunMap m={m}/>);
 expect(screen.getByText('Chapter rewards and equipment are already in your account.')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Review equipment'})).toBeTruthy();
 expect(screen.queryByText('Your earned supplies, stars and collected equipment are saved.')).toBeNull();
});
