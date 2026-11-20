import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {FujiCollection} from './FujiCollection';
const read=vi.hoisted(()=>vi.fn());
vi.mock('./fuji-collection',()=>({readFujiCollection:read}));
vi.mock('./runtime',()=>({loadChainConfig:async()=>({RelicNFT:'0x0000000000000000000000000000000000000002'})}));
const wallet='0x0000000000000000000000000000000000000001';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('labels only completed RPC reads and clears old ownership on a failed refresh',async()=>{
 read.mockResolvedValueOnce([{id:3n,amount:1n,name:'Moon Collar'}]).mockRejectedValueOnce(Error('offline'));
 render(<FujiCollection initialAddress={wallet}/>);
 expect(screen.queryByText('Owned on Avalanche Fuji')).toBeNull();
 expect(await screen.findByText('Owned on Avalanche Fuji')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Moon Collar'})).toBeTruthy();
 act(()=>window.dispatchEvent(new Event('chain:changed')));
 await screen.findByRole('alert');
 expect(screen.queryByText('Owned on Avalanche Fuji')).toBeNull();expect(screen.queryByRole('link')).toBeNull();
});
it('does not claim ownership or call RPC for an invalid address',async()=>{
 render(<FujiCollection/>);fireEvent.change(screen.getByLabelText('Wallet address'),{target:{value:'not a wallet'}});
 fireEvent.click(screen.getByRole('button',{name:'Read Fuji Relics'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('valid wallet'));
 expect(read).not.toHaveBeenCalled();expect(screen.queryByText('Owned on Avalanche Fuji')).toBeNull();
});
