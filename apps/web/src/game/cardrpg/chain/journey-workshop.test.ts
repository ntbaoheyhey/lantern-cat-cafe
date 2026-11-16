import {beforeEach,expect,it,vi} from 'vitest';
import {encodeFunctionData,parseEther,type Address} from 'viem';
import {relicNftAbi} from '@taskbar-hero/chain';
import {sameJourneyCall,scopedStorage,workshopClient} from './journey-workshop';
import {erc20Abi,type ChainConfig,type chainRuntime} from './runtime';
import type {AuthApi} from '../../../wallet/authApi';
const mocks=vi.hoisted(()=>({post:vi.fn(),buyerRuntime:{} as ReturnType<typeof chainRuntime>}));
vi.mock('./api',()=>({chainPost:mocks.post}));
vi.mock('./runtime',async original=>({...await original<typeof import('./runtime')>(),chainRuntime:()=>mocks.buyerRuntime}));
vi.mock('./guest',()=>({guestSignIn:async(_api:unknown,store:{set:(s:unknown)=>void})=>store.set({wallet:'0x0000000000000000000000000000000000000002',token:'buyer-session',playerId:'buyer',expiresAt:Date.now()+600000}),guestClient:()=>({account:{address:'0x0000000000000000000000000000000000000002'}})}));
const seller='0x0000000000000000000000000000000000000001',buyer='0x0000000000000000000000000000000000000002',hash=`0x${'1'.repeat(64)}` as const;
const config:ChainConfig={chainId:43113,rpcUrl:'http://127.0.0.1:8546',RelicNFT:seller,RelicMarket:seller,RelicMarketV2:seller,YarnToken:seller,SeasonRewards:seller};
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();});
it('isolates buyer keys and sessions from the main wallet',()=>{
 localStorage.setItem('key','main');const scoped=scopedStorage('buyer:',localStorage);scoped.setItem('key','second');
 expect(scoped.getItem('key')).toBe('second');expect(localStorage.getItem('key')).toBe('main');
 expect(scoped.length).toBe(1);expect(scoped.key(0)).toBe('key');scoped.clear();expect(localStorage.getItem('key')).toBe('main');
});
it('accepts renewed voucher expiry/signature but rejects changed ownership, asset or nonce',()=>{
 const fields={player:seller as Address,relicId:1n,rarity:1,nonce:5n,expiry:1000n};
 const request={address:seller,abi:relicNftAbi,functionName:'mint',args:[fields,'0x']} as const;
 const input=(f:typeof fields)=>encodeFunctionData({abi:relicNftAbi,functionName:'mint',args:[f,'0x1234']});
 expect(sameJourneyCall(request,input({...fields,expiry:2000n}))).toBe(true);
 const changes:Partial<typeof fields>[]=[{player:buyer},{relicId:2n},{nonce:6n},{rarity:2}];
 for(const changed of changes)expect(sameJourneyCall(request,input({...fields,...changed}))).toBe(false);
});
it('resumes a submitted gift after a receipt timeout without spending twice',async()=>{
 const input=encodeFunctionData({abi:erc20Abi,functionName:'transfer',args:[seller,parseEther('12')]});
 const second={guard:vi.fn(),receipt:vi.fn(),client:{getTransaction:vi.fn().mockResolvedValue({from:buyer,to:seller,input,value:0n})},
  write:vi.fn(async(_request:unknown,submitted?:(h:typeof hash)=>void)=>{submitted?.(hash);throw Error('receipt timeout');}),silenceSounds:vi.fn()};
 mocks.buyerRuntime=second as unknown as ReturnType<typeof chainRuntime>;
 mocks.post.mockImplementation(async(endpoint:string,token:string)=>{
  if(endpoint==='chain-items')return {used:true,claim:{player:token==='buyer-session'?buyer:seller,amount:parseEther('20').toString()}};
  if(endpoint==='guest-drip')return {status:'confirmed',txHash:hash};
  return {};
 });
 const runtime={guard:vi.fn()} as unknown as ReturnType<typeof chainRuntime>;
 const options={config,runtime,address:seller as Address,token:'seller-session',auth:{} as AuthApi};
 const first=workshopClient(options);await expect(first.advance()).rejects.toThrow('receipt timeout');expect(first.step()).toBe('fund');
 const resumed=workshopClient(options);await resumed.advance();
 expect(resumed.step()).toBe('seal');expect(second.write).toHaveBeenCalledTimes(1);expect(second.client.getTransaction).toHaveBeenCalledWith({hash});
});
