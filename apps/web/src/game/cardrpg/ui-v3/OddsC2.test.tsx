import {expect,it,beforeAll,afterAll,afterEach} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {TextDietContext} from './TextDietC2';
import {DropOddsC2,RecruitOddsC2,CraftOddsC2} from './OddsC2';
const fresh=()=>R.setFormationC2(R.setGameplayA6(R.setGameplayV4(R.createDepthAccount(81,0),true),true));
afterEach(cleanup);
// jsdom has no top-layer dialog implementation. Browser E2E covers native focus.
const original={showModal:Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'showModal'),close:Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'close')};
beforeAll(()=>{
 Object.defineProperties(HTMLDialogElement.prototype,{
  showModal:{configurable:true,value:function(this:HTMLDialogElement){this.open=true;}},
  close:{configurable:true,value:function(this:HTMLDialogElement){this.open=false;}},
 });
});
afterAll(()=>{for(const key of ['showModal','close'] as const){if(original[key])Object.defineProperty(HTMLDialogElement.prototype,key,original[key]!);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);}});
it('updates displayed drop probabilities when the shared daily allowance is exhausted',()=>{
 const state=fresh(),ui=render(<TextDietContext value={true}><DropOddsC2 state={state} kind="boss" chapter={1}/></TextDietContext>);
 fireEvent.click(screen.getByRole('button',{name:'Encounter drops odds'}));
 const rows=screen.getAllByRole('row');expect(rows.at(-1)!.textContent).toContain('0.15%0.15%');
 expect(screen.getByLabelText('6 of 6 drops remain today')).toBeTruthy();
 state.account.inventory.stacks[`depth-drops-${state.account.day}`]=6;
 ui.rerender(<TextDietContext value={true}><DropOddsC2 state={state} kind="boss" chapter={1}/></TextDietContext>);
 expect(screen.getAllByRole('row').at(-1)!.textContent).toContain('0.15%0%');
});
it('shows the actual gear price and remaining hard pity without prose',()=>{
 const state=fresh(),b=R.invitationBannerV4('equipment',state);
 state.account.pity[b.pityGroup]={sinceLegendary:23,totalPulls:23,featuredGuaranteed:false};
 render(<TextDietContext value={true}><RecruitOddsC2 state={state} bannerId="equipment"/></TextDietContext>);
 fireEvent.click(screen.getByRole('button',{name:'Invitation odds'}));
 const dialog=screen.getByRole('dialog');expect(dialog.textContent).toContain('1 / 24');expect(dialog.textContent).toContain('300');
 expect(screen.getAllByRole('row').at(-1)!.textContent).toContain('100%');
 expect(dialog.textContent).not.toContain('Missing gear');
});
it('discloses the Legendary tailoring proof cost and actual affix roll intervals',()=>{
 render(<TextDietContext value={true}><CraftOddsC2 state={fresh()} id="hearthloom-weapon-legendary"/></TextDietContext>);
 fireEvent.click(screen.getByRole('button',{name:'Tailoring odds'}));
 expect(screen.getByLabelText('seals').nextElementSibling!.textContent).toBe('10');
 expect(screen.getByLabelText('materials').nextElementSibling!.textContent).toBe('200');
 expect(screen.getByLabelText('Chosen template probability').textContent).toBe('100%');
});

it('discloses each exact v3 tailoring value before payment, with no hidden affix draw',()=>{
 const state=fresh();state.economyV3=true;const id='hearthloom-weapon-legendary',quote=R.tailoredGearPreview(state,id);
 render(<TextDietContext value={true}><CraftOddsC2 state={state} id={id}/></TextDietContext>);
 fireEvent.click(screen.getByRole('button',{name:'Tailoring odds'}));
 for(const affix of quote.affixes){
  const value=screen.getByLabelText(R.AFFIX_BY_ID[affix]!.name+' fixed value').nextElementSibling!;
  expect(value.textContent).toBe(quote.rolls[affix]+' · 100%');
 }
 expect(screen.queryByLabelText(/uniform integer roll/)).toBeNull();
});
