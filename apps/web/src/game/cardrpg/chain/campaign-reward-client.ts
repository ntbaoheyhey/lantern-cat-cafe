import {isAddress,type Address,type Hex} from 'viem';
import {seasonRewardsAbi,type CampaignRewardQuote,type CampaignRewardKind} from '@taskbar-hero/chain';
import type {chainRuntime} from './runtime';
const uint=(value:unknown)=>typeof value==='string'&&/^(0|[1-9][0-9]{0,77})$/.test(value)&&BigInt(value)<2n**256n;
export function validateCampaignQuote(value:unknown,expected:{contract:string;wallet:string;kind:CampaignRewardKind}):CampaignRewardQuote {
 const q=(value as {quote?:CampaignRewardQuote}|null)?.quote;
 if(!q||q.chainId!==43113||!isAddress(q.contract)||!isAddress(q.wallet)||
   q.contract.toLowerCase()!==expected.contract.toLowerCase()||q.wallet.toLowerCase()!==expected.wallet.toLowerCase()||q.kind!==expected.kind||
   !Number.isSafeInteger(q.period)||q.period<0||!Number.isSafeInteger(q.season)||q.season<0||
   !uint(q.nonce)||!uint(q.amount)||BigInt(q.amount)<=0n||BigInt(q.amount)>12n*10n**18n||typeof q.used!=='boolean')
   throw new Error('Reward changed. Retry.');
 return q;
}
export async function claimCampaignReward(runtime:ReturnType<typeof chainRuntime>,expected:CampaignRewardQuote,post:()=>Promise<unknown>,now=()=>Date.now()) {
 await runtime.guard();
 const response=await post(),q=validateCampaignQuote(response,expected);
 for(const k of ['period','season','nonce','amount'] as const)if(q[k]!==expected[k])throw new Error('Reward changed. Retry.');
 if(q.used)return;
 const r=response as {claim?:{player:Address;amount:string;season:string;nonce:string;expiry:string};signature?:Hex},c=r.claim;
 if(!c||!isAddress(c.player)||c.player.toLowerCase()!==expected.wallet.toLowerCase()||c.amount!==q.amount||c.season!==String(q.season)||c.nonce!==q.nonce||
   !uint(c.expiry)||BigInt(c.expiry)<BigInt(Math.floor(now()/1000)+15)||BigInt(c.expiry)>BigInt(Math.floor(now()/1000)+605)||
   typeof r.signature!=='string'||!/^0x[0-9a-fA-F]{130}$/.test(r.signature))throw new Error('Reward changed. Retry.');
 return runtime.write({address:q.contract as Address,abi:seasonRewardsAbi,functionName:'claim',args:[{
  player:c.player,amount:BigInt(c.amount),season:BigInt(c.season),nonce:BigInt(c.nonce),expiry:BigInt(c.expiry)},r.signature]});
}
