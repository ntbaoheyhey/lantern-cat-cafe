import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {DepthModel} from '../depth/model';
import {ResultA6} from './ResultA6';

beforeEach(()=>{localStorage.clear();vi.stubGlobal('requestAnimationFrame',()=>0);vi.stubGlobal('cancelAnimationFrame',()=>{});});
afterEach(()=>{cleanup();localStorage.clear();vi.unstubAllGlobals();});

function lostFight(){
 const m=new DepthModel(true,true,true,true,true);
 m.state.settings.reducedMotion=true;m.state.tutorial=4;m.start(1,'campaign',1);m.enter('0-0');m.fight();
 m.battle!.result='enemy';m.watching=false;return m;
}
it('offers Auto ultimates after a loss in player-timed mode, and hides it once on',()=>{
 const m=lostFight();
 render(<ResultA6 m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:/Auto ultimates/}));
 expect(localStorage.getItem('lantern-auto-ultimates')).toBe('on');
 expect(screen.queryByRole('button',{name:/Auto ultimates/})).toBeNull();
});
it('does not offer it when Auto is already on',()=>{
 localStorage.setItem('lantern-auto-ultimates','on');
 render(<ResultA6 m={lostFight()}/>);
 expect(screen.queryByRole('button',{name:/Auto ultimates/})).toBeNull();
});
