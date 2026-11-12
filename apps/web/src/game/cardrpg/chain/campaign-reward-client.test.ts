import {expect,it,vi} from 'vitest';
import type {CampaignRewardQuote} from '@taskbar-hero/chain';
import {validateCampaignQuote,claimCampaignReward} from './campaign-reward-client';
import type {chainRuntime} from './runtime';
const q:CampaignRewardQuote={chainId:43113,contract:'0x1111111111111111111111111111111111111111',wallet:'0x2222222222222222222222222222222222222222',
 kind:'weekly-boss',period:2956,season:0,nonce:'123',amount:'1500000000000000000',used:false};
const now=1794480000000;
const response=()=>({quote:{...q},claim:{player:q.wallet,amount:q.amount,season:'0',nonce:q.nonce,expiry:String(now/1000+600)},signature:'0x'+'a'.repeat(130)});
const fixture=()=>{const write=vi.fn(async()=>`0x${'b'.repeat(64)}` as `0x${string}`),guard=vi.fn(async()=>{});
 return {write,guard,runtime:{write,guard} as unknown as ReturnType<typeof chainRuntime>};};
it('validates the displayed beneficiary, contract, exact integer amount and closed period',()=>{
 expect(validateCampaignQuote({quote:q},q)).toEqual(q);
 for(const change of [{chainId:43114},{amount:'1.5'},{amount:'0'},{amount:'12000000000000000001'},{nonce:'01'},
  {period:-1},{season:NaN},{kind:'tester'},{wallet:q.contract},{contract:q.wallet},{used:'false'}])
  expect(()=>validateCampaignQuote({quote:{...q,...change}},q)).toThrow('Reward changed');
});
it('changed signed amounts, nonce, expiry or beneficiary cannot trigger a wallet transaction',async()=>{
 for(const change of [{amount:'1'},{player:q.contract},{nonce:'456'},{season:'1'},{expiry:String(now/1000-1)},{expiry:String(now/1000+3600)}]){
  const f=fixture(),r=response();Object.assign(r.claim,change);
  await expect(claimCampaignReward(f.runtime,q,async()=>r,()=>now)).rejects.toThrow('Reward changed');expect(f.write).not.toHaveBeenCalled();
 }
 const f=fixture(),r=response();r.quote.amount='1';r.claim.amount='1';
 await expect(claimCampaignReward(f.runtime,q,async()=>r,()=>now)).rejects.toThrow('Reward changed');expect(f.write).not.toHaveBeenCalled();
});
it('recovers used nonces without signing and otherwise claims exactly the reviewed quote',async()=>{
 const f=fixture();expect(await claimCampaignReward(f.runtime,q,async()=>({quote:{...q,used:true}}),()=>now)).toBeUndefined();expect(f.write).not.toHaveBeenCalled();
 await claimCampaignReward(f.runtime,q,async()=>response(),()=>now);
 expect(f.write).toHaveBeenCalledWith(expect.objectContaining({address:q.contract,functionName:'claim',args:[{
  player:q.wallet,amount:1500000000000000000n,season:0n,nonce:123n,expiry:1794480600n},'0x'+'a'.repeat(130)]}));
});
it('refuses an unsupported wallet chain before calling the reward endpoint',async()=>{
 const f=fixture(),post=vi.fn();f.guard.mockRejectedValue(new Error('Fuji only'));
 await expect(claimCampaignReward(f.runtime,q,post,()=>now)).rejects.toThrow('Fuji');expect(post).not.toHaveBeenCalled();expect(f.write).not.toHaveBeenCalled();
});
