import {afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {ECONOMY_SINKS} from '@taskbar-hero/game-rules/src/cardrpg/economy-sinks-v3';
import type {EconomyState} from '@taskbar-hero/chain/src/economy-v3';
import {EconomySinksB2,CafeShowcase} from './EconomySinksB2';
beforeAll(()=>{HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};});
afterEach(cleanup);
const state=():EconomyState=>({spool:'0',stars:20,bossSeals:0,level:1,quest:false,deed:null,credits:[],gear:[{id:'owned',template:'hearthloom-weapon-epic',quality:0}],intents:[],styles:[],lastWithdraw:0,sealDay:0,sealsToday:0});
describe('visible guaranteed recipes',()=>{
 it.each([['polish','Polish'],['decor','Decor'],['display','Showcase']] as const)('%s shows price, odds and benefit before requesting a reservation', (sink,label)=>{
  const reserve=vi.fn();render(<EconomySinksB2 state={state()} busy={false} onClose={()=>{}} onReserve={reserve}/>);
  fireEvent.click(screen.getByRole('button',{name:label}));
  const quote=screen.getByLabelText('Recipe cost and odds');expect(quote.textContent).toContain('100%');
  const cost=sink==='polish'?ECONOMY_SINKS.polish.yarn[0]:ECONOMY_SINKS[sink].yarn;
  expect(quote.textContent).toContain(String(cost));expect(reserve).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Review burn'}));
  expect(reserve).toHaveBeenCalledWith({action:'sink',sink,...(sink==='polish'?{instance:'owned'}:{})});
 });
 it('prevents an unaffordable request, and shows the earned showcase benefit',()=>{
  const s=state();s.stars=0;const reserve=vi.fn();const r=render(<EconomySinksB2 state={s} busy={false} onClose={()=>{}} onReserve={reserve}/>);
  expect((screen.getByRole('button',{name:'Need Thread'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Need Thread'}));expect(reserve).not.toHaveBeenCalled();r.unmount();
  render(<CafeShowcase state={{...s,styles:['display:1','display:2']}}/>);
  expect(screen.getByLabelText('5 showcase slots').children).toHaveLength(5);
 });
});
