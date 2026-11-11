import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {RouteStory,RouteTreasure} from './RouteEvents';
afterEach(cleanup);
function model(kind:'event'|'treasure'='event',event='chipped-cup'){
 const m=new DepthModel(true,true,true,true);m.start(1,'campaign',1);const run=m.state.run!,node=run.nodes.find(n=>n.kind===kind)!;
 run.current=node.id;if(kind==='event')node.eventId=event;run.points=35;run.hp.mochi!-=43;run.hp.soot=0;run.hp.clover=1;return m;
}
for(const event of R.EVENTS)for(const choice of event.choices)it(`previews and applies ${event.id}/${choice.id} without changing the save during review`,()=>{
 const m=model('event',event.id),before=R.exportSave(m.state),expected=R.resolveNode(m.state,choice.id);render(<RouteStory m={m}/>);
 const card=screen.getByRole('article',{name:choice.label}),action=within(card).getByRole('button',{name:choice.label});
 expect(card.textContent).toContain(`Run points: 35 → ${expected.state.run!.points}`);
 if(choice.heal!==0)for(const id of m.state.team){const a=m.state.run!.hp[id]!,b=expected.state.run!.hp[id]!;expect(card.textContent).toContain(`${a} → ${b} HP (${b>=a?'+':''}${b-a})`);}
 if(choice.boon){expect(card.textContent).toContain(R.boonForMode(choice.boon,true).description);expect(card.textContent).toContain('Stack 0 → 1/2');}
 if(choice.heal>0)expect(card.textContent).toContain('Revives');if(choice.heal<0)expect(card.textContent).not.toContain('Revives');
 expect(R.exportSave(m.state)).toBe(before);expect(document.getElementById(action.getAttribute('aria-describedby')!)?.parentElement).toBe(card);
 fireEvent.click(action);expect(expected.ok).toBe(true);expect(m.state).toEqual(expected.state);
});
it.each(['short','cap'])('discloses the %s lock before choosing a charm',kind=>{
 const m=model();if(kind==='short')m.state.run!.points=7;else m.state.run!.boons['shelter-3']=2;
 const before=R.exportSave(m.state);render(<RouteStory m={m}/>);const card=screen.getByRole('article',{name:'Mend the handle'}),button=within(card).getByRole('button');
 expect((button as HTMLButtonElement).disabled).toBe(true);expect(card.textContent).toContain(kind==='short'?'Need 18 more run points (7/25).':'This charm is at its stacking cap.');
 fireEvent.click(button);expect(R.exportSave(m.state)).toBe(before);
});
it('still lets a full-health crew resolve a healing story choice',()=>{
 const m=model();for(const cat of R.battleCats(m.state))m.state.run!.hp[cat.id]=cat.stats.hp;
 const expected=R.resolveNode(m.state,'share');render(<RouteStory m={m}/>);const card=screen.getByRole('article',{name:'Share a warm drink'});
 expect(card.textContent).toContain('Crew HP unchanged.');fireEvent.click(within(card).getByRole('button'));expect(m.state).toEqual(expected.state);
});
it('revalidates an event quote against current funds at activation',()=>{
 const m=model();render(<RouteStory m={m}/>);m.state={...m.state,run:{...m.state.run!,points:0}};const before=R.exportSave(m.state);
 fireEvent.click(screen.getByRole('button',{name:'Mend the handle'}));expect(R.exportSave(m.state)).toBe(before);expect(m.error).toBe(true);
 expect((screen.getByRole('button',{name:'Mend the handle'}) as HTMLButtonElement).disabled).toBe(true);
});
it.each(['points','charm'])('describes and applies the exact treasure %s gift',kind=>{
 const m=model('treasure'),id=R.shopStock(m.state.run!)[0]!,boon=R.boonForMode(id,true),before=R.exportSave(m.state),expected=R.resolveNode(m.state,kind);
 render(<RouteTreasure m={m}/>);const card=screen.getByRole('article',{name:kind==='points'?'Take 70 run points':`Take ${boon.name}`});
 expect(card.textContent).toContain(`Run points: 35 → ${expected.state.run!.points}`);if(kind==='charm')expect(card.textContent).toContain(boon.description);
 expect(R.exportSave(m.state)).toBe(before);fireEvent.click(within(card).getByRole('button'));expect(m.state).toEqual(expected.state);
});
it('handles exhausted treasure charms without crashing or blocking the points gift',()=>{
 const m=model('treasure');for(const boon of R.BOONS)m.state.run!.boons[boon.id]=boon.cap;
 const expected=R.resolveNode(m.state,'points');render(<RouteTreasure m={m}/>);
 expect((screen.getByRole('button',{name:'No charm available'}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getByText('All charms are fully stacked.')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Take 70 run points'}));expect(m.state).toEqual(expected.state);
});
