import {ChainRequestError} from './chain-http.ts';
import { keccak256, toBytes, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
export const CLAIM_TYPES={Claim:[{name:'player',type:'address'},{name:'amount',type:'uint256'},{name:'season',type:'uint256'},{name:'nonce',type:'uint256'},{name:'expiry',type:'uint256'}]} as const;
export const TESTER_CLAIM_TYPES={TesterClaim:CLAIM_TYPES.Claim} as const;
export const claimDomain=(contract:Address)=>({name:'TaskbarHeroSeasonRewards',version:'1',chainId:43113,verifyingContract:contract});
export interface TesterReservationRequest {player:string;wallet:Address;contract:Address;nonce:bigint;amount:bigint}
// Both issuers draw from one pool. Turning on campaign rewards must also put
// every new judge grant through the shared ledger, even if its own flag was
// omitted. Legacy behavior is retained only while both optional flags are off.
export function testerBudgetRequired(testerBudgetFlag:string|undefined,campaignRewardFlag:string|undefined):boolean {
  return testerBudgetFlag==='1'||campaignRewardFlag==='1';
}
export function createTesterReward({key,contract,eligible,season,nonceUsed,reserve,reservationRequired=false,now=()=>Date.now()}:{
  key:Hex;contract:Address;eligible(player:string,wallet:string):Promise<boolean>;season():Promise<bigint>;
  nonceUsed(nonce:bigint):Promise<boolean>;reserve?(request:TesterReservationRequest):Promise<void>;reservationRequired?:boolean;now?:()=>number;
}) {
  if(reservationRequired&&!reserve)throw new ChainRequestError('tester_budget_unavailable');
  const signer=privateKeyToAccount(key);
  return async(player:string,wallet:Address)=>{
    if(!await eligible(player,wallet.toLowerCase()))throw new ChainRequestError('no_judge_pass');
    const fields={player:wallet,amount:20n*10n**18n,season:await season(),
      nonce:BigInt(keccak256(toBytes(`taskbar-hero:tester-yarn:v1:${player}`))),expiry:BigInt(Math.floor(now()/1000)+600)};
    const used=await nonceUsed(fields.nonce);
    // A failed/ambiguous reservation never reaches signing. Retries retain the
    // original lifetime allocation, even across seasons or voucher expiry.
    if(!used&&reserve)await reserve({player,wallet,contract,nonce:fields.nonce,amount:fields.amount});
    return {claim:fields,signature:used?'0x':await signer.signTypedData({domain:claimDomain(contract),types:TESTER_CLAIM_TYPES,primaryType:'TesterClaim',message:fields}),used};
  };
}
