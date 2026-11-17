import {cleanup,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {getAddresses} from '@taskbar-hero/chain';
import {DepthModel} from '../depth/model';
import {ResultA6} from './ResultA6';

beforeEach(()=>{
 localStorage.clear();
 vi.stubGlobal('requestAnimationFrame',()=>0);
 vi.stubGlobal('cancelAnimationFrame',()=>{});
});
afterEach(()=>{cleanup();localStorage.clear();vi.unstubAllGlobals();});

it.each([false,true])('shows truthful deployment evidence for the normal guest result, formationC2=%s',c2=>{
 // The real guest entry uses the default persistent local account, not offline fixture mode.
 const m=new DepthModel(false,true,true,true,c2);
 m.state.settings.reducedMotion=true;m.tutorial();m.battle!.result='party';m.watching=false;
 render(<ResultA6 m={m}/>);
 const evidence=screen.getByRole('complementary',{name:'Avalanche deployment'});
 expect(evidence.textContent).toContain('Avalanche Fuji testnet');
 expect(evidence.textContent).toContain('Local battle · no transaction sent');
 expect(within(evidence).getByRole('link').getAttribute('href')).toBe(`https://testnet.snowtrace.io/address/${getAddresses(43113).RelicNFT}`);
 expect(m.state.run).toBeNull();
});
