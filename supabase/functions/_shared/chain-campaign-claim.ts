import {isAddress, type Address, type Hex, type PublicClient} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {seasonRewardsAbi,yarnTokenAbi} from '../../../packages/chain/src/abi.ts';
import {type CampaignRewardKind,type CampaignRewardQuote} from '../../../packages/chain/src/rewards.ts';
import {createCampaignRewardAuthority,type CampaignRewardEvidence} from './chain-campaign-rewards.ts';
import {createRoutinePreparation,routineNonce,type RoutineReservation} from './chain-routine.ts';
import {CAMPAIGN_SOURCE} from './chain-campaign.ts';
import {CLAIM_TYPES,claimDomain} from './chain-rewards.ts';

/** An opt-in signer for earned campaign facts. Quotes never reserve or sign.
 * All policy, balance and nonce reads refer to one fresh, hash-checked block.
 * Neither the HTTP caller nor the browser can choose an amount or a period. */
export function createCampaignClaim({enabled=false,contract,token,key,rulesHash,client,read,reserve,renew,stored,now=()=>Date.now()}:{
  enabled?:boolean;contract:Address;token:Address;key:Hex;rulesHash:string;client:PublicClient;
  read(player:string,wallet:string,contract:string,kind:CampaignRewardKind,period:number):Promise<CampaignRewardEvidence>;
  reserve(request:RoutineReservation):Promise<RoutineReservation>;
  renew(request:RoutineReservation):Promise<RoutineReservation>;
  stored(source:string,receipt:string):Promise<RoutineReservation|null>;
  now?:()=>number;
}) {
  return async(player:string,wallet:Address,action:'quote'|'claim',kind:CampaignRewardKind)=>{
    if(!enabled)throw new Error('routine_disabled');
    if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(player)||!isAddress(wallet)||!isAddress(contract)||!isAddress(token)||
      !['quote','claim'].includes(action)||!['weekly-boss','season-rank'].includes(kind))throw new Error('routine_identity');
    if(await client.getChainId()!==43113)throw new Error('wrong_chain');
    const block=await client.getBlock({blockTag:'latest'}),stamp=Number(block.timestamp),clock=Math.floor(now()/1000);
    if(!Number.isSafeInteger(clock)||!Number.isSafeInteger(stamp)||stamp<clock-30||stamp>clock+5)throw new Error('routine_snapshot');
    const readContract=(functionName:'seasonEpoch'|'currentRoutineBudget'|'weeklyCap'|'yarn'|'signer')=>
      client.readContract({address:contract,abi:seasonRewardsAbi,functionName,blockNumber:block.number});
    const [epochValue,capValue,totalCapValue,actualToken,actualSigner]=await Promise.all([
      readContract('seasonEpoch'),readContract('currentRoutineBudget'),readContract('weeklyCap'),readContract('yarn'),readContract('signer')]);
    const epoch=Number(epochValue),season=Math.floor((stamp-epoch)/7862400),week=Math.floor((stamp-345600)/604800);
    if(String(actualToken).toLowerCase()!==token.toLowerCase())throw new Error('routine_token');
    const signer=privateKeyToAccount(key);
    if(String(actualSigner).toLowerCase()!==signer.address.toLowerCase())throw new Error('routine_signer');
    const period=kind==='weekly-boss'?week:season-1;
    if(period<0)throw new Error('routine_unfinalized');
    const receiptId=player+':'+kind+':'+period,nonce=routineNonce({sourceId:CAMPAIGN_SOURCE,receiptId});
    const [used,balance,weekPaid,routinePaid]=await Promise.all([
      client.readContract({address:contract,abi:seasonRewardsAbi,functionName:'usedNonces',args:[nonce],blockNumber:block.number}),
      client.readContract({address:token,abi:yarnTokenAbi,functionName:'balanceOf',args:[contract],blockNumber:block.number}),
      client.readContract({address:contract,abi:seasonRewardsAbi,functionName:'claimedInWeek',args:[wallet,BigInt(week)],blockNumber:block.number}),
      client.readContract({address:contract,abi:seasonRewardsAbi,functionName:'routineClaimedInWeek',args:[wallet,BigInt(week)],blockNumber:block.number})]);
    const verifyBlock=async()=>{if((await client.getBlock({blockNumber:block.number})).hash!==block.hash)throw new Error('routine_snapshot');};
    const quote=(amount:string):CampaignRewardQuote=>({chainId:43113,contract,wallet,kind,period,season,nonce:nonce.toString(),amount,used});
    if(used){
      // Response-loss recovery also works after voucher expiry; never resign.
      const prior=await stored(CAMPAIGN_SOURCE,receiptId);
      if(!prior||prior.player_id!==player||prior.wallet!==wallet.toLowerCase()||prior.contract!==contract.toLowerCase()||
        prior.source_id!==CAMPAIGN_SOURCE||prior.receipt_id!==receiptId||prior.kind!==kind||prior.earning_period!==period||
        prior.nonce!==nonce.toString()||prior.season!==season)throw new Error('routine_store_conflict');
      await verifyBlock();return {quote:quote(prior.amount)};
    }
    const authority=createCampaignRewardAuthority({enabled:true,contract,epoch,rulesHash,read});
    const prepare=createRoutinePreparation({enabled:true,contract,authority,
      snapshot:async()=>({chainId:43113,contract,block:Number(block.number),blockHash:block.hash,timestamp:stamp,
        epoch,season,week,routineCap:String(capValue)}),reserve:async r=>{
        if(r.expiry<stamp+15)throw new Error('routine_expired');
        const amount=BigInt(r.amount);
        if(balance<amount)throw new Error('routine_pool');
        if(routinePaid+amount>BigInt(capValue)||weekPaid+amount>BigInt(totalCapValue))throw new Error('routine_cap');
        await verifyBlock();
        if(action==='quote')return r;
        const reservation=await reserve(r);
        // Expiry changes authorization, not entitlement. SQL retains the
        // original promise and appends a same-nonce validity window.
        return reservation.expiry<stamp+15?renew(r):reservation;
      }});
    const prepared=await prepare(player,wallet,receiptId),claim=prepared.claim;
    if(balance<claim.amount)throw new Error('routine_pool');
    if(routinePaid+claim.amount>BigInt(capValue)||weekPaid+claim.amount>BigInt(totalCapValue))throw new Error('routine_cap');
    await verifyBlock();
    if(action==='quote')return {quote:quote(claim.amount.toString())};
    return {quote:quote(claim.amount.toString()),claim,signature:await signer.signTypedData({
      domain:claimDomain(contract),types:CLAIM_TYPES,primaryType:'Claim',message:claim})};
  };
}
