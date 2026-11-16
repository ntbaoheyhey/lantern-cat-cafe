import {beforeEach,expect,it,vi} from 'vitest';
import {journeyClient,type TrialResponse} from './journey-client';
import {shipJourneyEnabled} from './flags';
import type {ChainConfig,chainRuntime} from './runtime';
const post=vi.hoisted(()=>vi.fn());vi.mock('./api',()=>({chainPost:post}));
const address='0x0000000000000000000000000000000000000001',hash=`0x${'1'.repeat(64)}` as const;
const config:ChainConfig={chainId:43113,rpcUrl:'http://127.0.0.1:8546',RelicNFT:'0x0000000000000000000000000000000000000002',RelicMarket:'0x0000000000000000000000000000000000000003'};
const runtime={guard:vi.fn(),funding:vi.fn(),write:vi.fn()} as unknown as ReturnType<typeof chainRuntime>;
const voucher={player:address,relicId:'1',rarity:1,nonce:'5',expiry:'1999999999',signature:'0x',used:false};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(runtime.write).mockResolvedValue(hash);});
it('requires the deployment flag and existing services',()=>{
 expect(shipJourneyEnabled({VITE_CHAIN_DEMO:'1'})).toBe(false);
 expect(shipJourneyEnabled({VITE_SHIP_JOURNEY:'1'})).toBe(false);
 expect(shipJourneyEnabled({VITE_CHAIN_DEMO:'1',VITE_SHIP_JOURNEY:'1'})).toBe(true);
});
it('waits for confirmed gas before minting a wallet-bound reward',async()=>{
 post.mockResolvedValueOnce({vouchers:[voucher],battle:{won:true}}).mockResolvedValueOnce({status:'pending',txHash:hash,confirmationMs:730});
 expect(await journeyClient(config,runtime,'token',address).mintFirstReward()).toBe(hash);
 expect(runtime.funding).toHaveBeenCalledWith(hash,730);
 expect(vi.mocked(runtime.funding).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(runtime.write).mock.invocationCallOrder[0]!);
 expect(runtime.write).toHaveBeenCalledWith(expect.objectContaining({functionName:'mint',args:[{player:address,relicId:1n,rarity:1,nonce:5n,expiry:1999999999n},'0x']}));
});
it.each(['failed','unavailable'])('does not attempt a mint when gas is %s',async status=>{
 post.mockResolvedValueOnce({vouchers:[voucher],battle:{won:true}}).mockResolvedValueOnce({status,txHash:hash});
 await expect(journeyClient(config,runtime,'token',address).mintFirstReward()).rejects.toThrow('Test gas unavailable');
 expect(runtime.write).not.toHaveBeenCalled();
});
it('recovers a previously used voucher without another drip or mint',async()=>{
 post.mockResolvedValueOnce({vouchers:[{...voucher,used:true}],battle:{won:true}});
 await journeyClient(config,runtime,'token',address).mintFirstReward();
 expect(post).toHaveBeenCalledTimes(1);expect(runtime.write).not.toHaveBeenCalled();
});
it('refuses a reward for a different wallet',async()=>{
 post.mockResolvedValueOnce({vouchers:[{...voucher,player:config.RelicNFT}],battle:{won:true}} as unknown as TrialResponse);
 await expect(journeyClient(config,runtime,'token',address).mintFirstReward()).rejects.toThrow('Trial reward unavailable');
 expect(post).toHaveBeenCalledTimes(1);expect(runtime.write).not.toHaveBeenCalled();
});
