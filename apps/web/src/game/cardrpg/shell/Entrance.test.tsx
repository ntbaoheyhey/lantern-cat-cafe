import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterAll,afterEach,beforeAll,expect,it,vi} from 'vitest';
import {Gate} from './Entrance';
import {ChainApiError} from '../chain/api';
vi.mock('../../../audio/engine',()=>({audioEngine:{unlock:async()=>{},music:vi.fn()}}));
vi.mock('./LiveCounters',()=>({LiveCounters:()=>null}));
const dialogMethods=['showModal','close'] as const,original=dialogMethods.map(key=>Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,key));
beforeAll(()=>{for(const key of dialogMethods)Object.defineProperty(HTMLDialogElement.prototype,key,{configurable:true,value:function(this:HTMLDialogElement){this.open=key==='showModal';}});});
afterAll(()=>{dialogMethods.forEach((key,i)=>{if(original[i])Object.defineProperty(HTMLDialogElement.prototype,key,original[i]!);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);});});
afterEach(()=>{cleanup();localStorage.clear();});
it('waits for guest authentication before entering',async()=>{let finish!:()=>void;const guest=vi.fn(()=>new Promise<void>(r=>finish=r));render(<Gate guest={guest}><p>Café open</p></Gate>);fireEvent.click(screen.getByRole('button',{name:'Play free'}));await waitFor(()=>expect(guest).toHaveBeenCalledOnce());expect(screen.queryByText('Café open')).toBeNull();finish();await screen.findByText('Café open');});
it('keeps failed authentication recoverable without claiming success',async()=>{render(<Gate guest={async()=>{throw new Error('Offline');}}><p>Café open</p></Gate>);fireEvent.click(screen.getByRole('button',{name:'Play free'}));await screen.findByRole('alert');expect(screen.queryByText('Café open')).toBeNull();expect(localStorage.getItem('lantern.entered.v3')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Play offline'}));await screen.findByText('Café open');});
it('explains a rejected signature and permits retry',async()=>{render(<Gate connect={async()=>{throw new Error('User rejected signature');}}><p>Café open</p></Gate>);fireEvent.click(screen.getByRole('button',{name:'Connect wallet'}));fireEvent.click(screen.getByRole('button',{name:'Core / MetaMask'}));expect((await screen.findByRole('alert')).textContent).toContain('Signature declined');});
it('shows a Fuji switch action for the wrong network',async()=>{const change=vi.fn(async()=>{});render(<Gate wrongNetwork switchNetwork={change}><p>Café open</p></Gate>);fireEvent.click(screen.getByRole('button',{name:'Connect wallet'}));fireEvent.click(screen.getByRole('button',{name:'Switch to Fuji'}));await waitFor(()=>expect(change).toHaveBeenCalledOnce());expect(screen.queryByText('Café open')).toBeNull();});
it.each([
 [new Error('Fuji wallet RPC request failed'), 'Connection unavailable. Retry or play offline.'],
 [new ChainApiError('sponsor_low'), 'Café gas is low. Ask the host to refill it.'],
 [Object.assign(new Error('Provider not found'), {name:'ProviderNotFoundError'}), 'Install Core or MetaMask, or play free.'],
])('keeps sign-in recovery specific and permits offline play (%#)',async(error,message)=>{
 render(<Gate connect={async()=>{throw new Error('Wallet connection failed',{cause:error});}}><p>Café open</p></Gate>);
 fireEvent.click(screen.getByRole('button',{name:'Connect wallet'}));fireEvent.click(screen.getByRole('button',{name:'Core / MetaMask'}));
 expect((await screen.findByRole('alert')).textContent).toBe(message);expect(localStorage.getItem('lantern.entered.v3')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Play offline'}));await screen.findByText('Café open');
});
it('skips landing for an existing authenticated session',()=>{render(<Gate session><p>Café open</p></Gate>);expect(screen.getByText('Café open')).toBeTruthy();});
it.each(['Escape','Close button'])('returns focus to the sign-in opener after %s',close=>{
 render(<Gate><p>Café open</p></Gate>);
 const opener=screen.getByRole('button',{name:'Connect wallet'});opener.focus();fireEvent.click(opener);
 const dialog=screen.getByRole('dialog',{name:'Wallet sign-in'});expect(document.activeElement).toBe(dialog);
 if(close==='Escape')fireEvent.keyDown(dialog,{key:'Escape'});else fireEvent.click(screen.getByRole('button',{name:'Close sign-in'}));
 expect(screen.queryByRole('dialog',{name:'Wallet sign-in'})).toBeNull();expect(document.activeElement).toBe(opener);
});
it('keeps native cancellation and Escape blocked while wallet sign-in is pending',async()=>{
 let finish!:()=>void;const connect=vi.fn(()=>new Promise<void>(resolve=>{finish=resolve;}));
 render(<Gate connect={connect}><p>Café open</p></Gate>);
 fireEvent.click(screen.getByRole('button',{name:'Connect wallet'}));
 fireEvent.click(screen.getByRole('button',{name:'Core / MetaMask'}));await waitFor(()=>expect(connect).toHaveBeenCalledOnce());
 const dialog=screen.getByRole('dialog',{name:'Wallet sign-in'}) as HTMLDialogElement,cancel=new Event('cancel',{cancelable:true});
 fireEvent(dialog,cancel);fireEvent.keyDown(dialog,{key:'Escape'});
 expect(cancel.defaultPrevented).toBe(true);expect(dialog.open).toBe(true);expect(screen.queryByText('Café open')).toBeNull();
 finish();await screen.findByText('Café open');expect(screen.queryByRole('dialog')).toBeNull();
});
