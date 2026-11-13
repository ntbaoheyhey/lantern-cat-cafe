import {afterEach,describe,it,expect,vi} from 'vitest';
import {installUiFeedback} from './feedback';
let dispose:undefined|(()=>void);
afterEach(()=>{dispose?.();document.body.innerHTML='';vi.useRealTimers();});
describe('semantic menu sounds',()=>{
 it('keeps keyboard clicks, tab changes and details separate from generic clicks',()=>{
  const play=vi.fn();dispose=installUiFeedback({play});
  document.body.innerHTML='<nav><button><span>Gear</span></button></nav><button id="plain">Use</button><details><summary>Mixer</summary></details>';
  document.querySelector('span')!.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  document.querySelector<HTMLButtonElement>('#plain')!.click();
  document.querySelector<HTMLElement>('summary')!.click();
  expect(play.mock.calls.map(c=>c[0])).toEqual(['ui.tab','ui.click','ui.open']);
  document.querySelector<HTMLElement>('summary')!.click();expect(play).toHaveBeenLastCalledWith('ui.close');
 });
 it('rate limits continuous controls and never clicks disabled controls',()=>{
  vi.spyOn(performance,'now').mockReturnValue(100);const play=vi.fn();dispose=installUiFeedback({play});
  document.body.innerHTML='<input type="range"><input type="checkbox"><select><option>One</option></select><button disabled>Wait</button>';
  for(let n=0;n<30;n++)document.querySelector('input')!.dispatchEvent(new Event('input',{bubbles:true}));
  document.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('input',{bubbles:true}));
  document.querySelector('select')!.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('button')!.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  expect(play.mock.calls.map(c=>c[0])).toEqual(['ui.slider','ui.toggle','ui.tab']);vi.restoreAllMocks();
 });
 it('removes listeners cleanly without adding duplicate feedback',()=>{
  const play=vi.fn();dispose=installUiFeedback({play});document.body.innerHTML='<button>Use</button>';dispose();
  document.querySelector('button')!.click();expect(play).not.toHaveBeenCalled();
 });
});
