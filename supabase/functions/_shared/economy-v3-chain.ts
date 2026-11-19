import {decodeFunctionData,getAddress,type Address,type Hex,type PublicClient} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {relicNftAbi,yarnTokenAbi,seasonRewardsAbi} from '../../../packages/chain/src/abi.ts';
import {voucherSigner} from './relic.ts';
import {CLAIM_TYPES,claimDomain} from './chain-rewards.ts';
import {ECONOMY_DEAD,economyIntentHash,EconomyError,type EconomyChain} from './economy-v3.ts';
import {emissionHeadroomWei} from '../../../packages/game-rules/src/cardrpg/economy-v3.ts';
export function economyChain({client,nft,token,rewards,key}:{client:PublicClient;nft:Address;token:Address;rewards:Address;key:Hex}):EconomyChain{
 const signer=privateKeyToAccount(key),mint=voucherSigner(key,nft);
 const checked=async()=>{if(await client.getChainId()!==43113)throw new Error('wrong_chain');};
 return {
  nftUsed:nonce=>client.readContract({address:nft,abi:relicNftAbi,functionName:'usedNonces',args:[nonce]}),
  rewardUsed:nonce=>client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'usedNonces',args:[nonce]}),
  owns:async(wallet,id,amount=1)=>await client.readContract({address:nft,abi:relicNftAbi,functionName:'balanceOf',args:[wallet,BigInt(id)]})>=BigInt(amount),
  paid:(wallet,hash)=>client.readContract({address:token,abi:yarnTokenAbi,functionName:'sealPayments',args:[wallet,hash]}),
  async burn(wallet,intent,hash){
   await checked();const [tx,receipt]=await Promise.all([client.getTransaction({hash}),client.getTransactionReceipt({hash})]);
   if(receipt.status!=='success'||tx.to?.toLowerCase()!==nft.toLowerCase()||tx.from.toLowerCase()!==wallet.toLowerCase())throw new EconomyError('Invalid sealed input receipt.');
   const block=await client.getBlock({blockNumber:receipt.blockNumber});if(block.hash!==receipt.blockHash)throw new EconomyError('Receipt changed. Retry.');
   const decoded=decodeFunctionData({abi:relicNftAbi,data:tx.input});
   if(decoded.functionName!=='safeBatchTransferFrom')throw new EconomyError('Batch burn required.');
   const [from,to,ids,amounts,data]=decoded.args;
   if(getAddress(from)!==getAddress(wallet)||getAddress(to)!==getAddress(ECONOMY_DEAD)||data!==economyIntentHash(intent.id)||ids.length!==intent.burnIds.length||amounts.length!==ids.length||ids.some((v,i)=>v!==BigInt(intent.burnIds[i]!))||amounts.some((v,i)=>v!==BigInt(intent.burnAmounts[i]!)))throw new EconomyError('Burn inputs do not match the reserved recipe.');
  },
  async capacity(wallet,net){
   await checked();const blockNumber=await client.getBlockNumber({cacheTime:0});
   const [actualToken,week,cap,balance]=await Promise.all([
    client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'yarn',blockNumber}),
    client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'currentWeek',blockNumber}),
    client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'currentRoutineBudget',blockNumber}),
    client.readContract({address:token,abi:yarnTokenAbi,functionName:'balanceOf',args:[rewards],blockNumber})]);
   if(actualToken.toLowerCase()!==token.toLowerCase())throw new Error('reward_token');
   const used=await client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'routineClaimedInWeek',args:[wallet,week],blockNumber});
   if(net>cap-used)throw new EconomyError('Controller weekly allowance is too low.');if(balance<net)throw new EconomyError('Reward pool needs funding.');
   // Burn-backed guard: season emission may not outrun public burns (EMISSION_GUARD).
   const season=await client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'currentSeason',blockNumber});
   const [emitted,burned]=await Promise.all([
    client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'emittedInSeason',args:[season],blockNumber}),
    client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'burnedInSeason',args:[season],blockNumber})]);
   if(net>emissionHeadroomWei(emitted,burned))throw new EconomyError('Season rewards are paced to YARN burns. Your Spool stays safe; try after more burns or next season.');
  },
  season:()=>client.readContract({address:rewards,abi:seasonRewardsAbi,functionName:'currentSeason'}),
  mint:async fields=>{await checked();return mint.sign(fields);},
  claim:async message=>{await checked();return signer.signTypedData({domain:claimDomain(rewards),types:CLAIM_TYPES,primaryType:'Claim',message});},
  certify:message=>signer.signMessage({message}),
 };
}
