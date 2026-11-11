import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {AwakeningA6} from './AwakeningA6';

afterEach(cleanup);
function ready(rank=0) {
 const m=new DepthModel(true,true,true,true);
 Object.assign(m.state.account.cards.find(c=>c.cardId==='mochi')!,{level:10,stars:2});
 Object.assign(m.state.account.currencies,{fish:3000,threads:400,essence:50});
 m.state.materials=300;m.state.awakened.mochi=rank;
 return m;
}
function open(m:DepthModel) {
 const ui=render(<AwakeningA6 m={m} catId="mochi"/>);
 ui.container.querySelector('details')!.open=true;
 return ui;
}

it.each([0,1,2])('previews and spends exactly the next rank after rank %i without spending on render',rank=>{
 const m=ready(rank),before=structuredClone(m.state),stats=R.depthStats(m.state,'mochi');
 const ui=open(m),n=rank+1;
 expect(m.state).toEqual(before);
 for(const text of [`Mochi → rank ${n}/3`,`${300*n} fish points`,`${40*n} threads`,`${5*n} essence`,`${30*n} mastery materials`])expect(screen.getByText(text)).toBeTruthy();
 const receipt=screen.getByText(/Health · \+/).textContent;
 fireEvent.click(screen.getByRole('button',{name:'Awaken'}));
 expect(m.state.awakened.mochi).toBe(n);
 expect(m.state.materials).toBe(300-30*n);
 expect(m.state.account.currencies).toEqual({...before.account.currencies,fish:3000-300*n,threads:400-40*n,essence:50-5*n});
 expect(m.state.account.cards).toEqual(before.account.cards);
 expect(m.state.gear).toEqual(before.gear);expect(m.state.equipment).toEqual(before.equipment);
 const after=R.depthStats(m.state,'mochi');
 expect(receipt).toBe(`+${after.hp-stats.hp} Health · +${after.attack-stats.attack} Attack`);
 ui.rerender(<AwakeningA6 m={m} catId="mochi"/>);
 if(n===3){expect((screen.getByRole('button',{name:'Awaken'}) as HTMLButtonElement).disabled).toBe(true);expect(screen.getByText('Awakening is capped at three.')).toBeTruthy();}
});

it.each(['level','stars','materials','fish','threads','essence','cap','route'] as const)('discloses the %s restriction and leaves a rejected purchase unchanged',reason=>{
 const m=ready();
 if(reason==='level'||reason==='stars')m.state.account.cards.find(c=>c.cardId==='mochi')![reason]=1;
 else if(reason==='materials')m.state.materials=0;
 else if(reason==='cap')m.state.awakened.mochi=3;
 else if(reason==='route'){m.state.tutorial=4;m.start(1);expect(m.state.run).toBeTruthy();}
 else m.state.account.currencies[reason]=0;
 const before=structuredClone(m.state),expected=R.awakenCat(m.state,'mochi');expect(expected.ok).toBe(false);
 open(m);const button=screen.getByRole('button',{name:'Awaken'}) as HTMLButtonElement;
 expect(button.disabled).toBe(true);
 expect(document.getElementById(button.getAttribute('aria-describedby')!)!.textContent).toBe(reason==='route'?'Finish this route before training your companions.':!expected.ok?expected.error:'');
 fireEvent.click(button);expect(m.state).toEqual(before);
});

it('rechecks the current account at purchase and updates readiness when resources return',()=>{
 const m=ready(),ui=open(m);
 m.state.materials=0;const before=structuredClone(m.state);
 fireEvent.click(screen.getByRole('button',{name:'Awaken'}));expect(m.state).toEqual(before);
 ui.rerender(<AwakeningA6 m={m} catId="mochi"/>);
 expect((screen.getByRole('button',{name:'Awaken'}) as HTMLButtonElement).disabled).toBe(true);
 m.state.materials=30;ui.rerender(<AwakeningA6 m={m} catId="mochi"/>);
 expect((screen.getByRole('button',{name:'Awaken'}) as HTMLButtonElement).disabled).toBe(false);
});
