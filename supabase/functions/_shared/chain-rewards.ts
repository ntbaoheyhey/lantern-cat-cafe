import { keccak256, toBytes, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
export const CLAIM_TYPES={Claim:[{name:'player',type:'address'},{name:'amount',type:'uint256'},{name:'season',type:'uint256'},{name:'nonce',type:'uint256'},{name:'expiry',type:'uint256'}]} as const;
export const TESTER_CLAIM_TYPES={TesterClaim:CLAIM_TYPES.Claim} as const;
export const claimDomain=(contract:Address)=>({name:'TaskbarHeroSeasonRewards',version:'1',chainId:43113,verifyingContract:contract});
export function createTesterReward({key,contract,eligible,season,nonceUsed,now=()=>Date.now()}:{
  key:Hex;contract:Address;eligible(player:string,wallet:string):Promise<boolean>;season():Promise<bigint>;
  nonceUsed(nonce:bigint):Promise<boolean>;now?:()=>number;
}) {
  const signer=privateKeyToAccount(key);
  return async(player:string,wallet:Address)=>{
    if(!await eligible(player,wallet.toLowerCase()))throw new Error('no_judge_pass');
    const fields={player:wallet,amount:20n*10n**18n,season:await season(),
      nonce:BigInt(keccak256(toBytes(`taskbar-hero:tester-yarn:v1:${player}`))),expiry:BigInt(Math.floor(now()/1000)+600)};
    const used=await nonceUsed(fields.nonce);
    return {claim:fields,signature:used?'0x':await signer.signTypedData({domain:claimDomain(contract),types:TESTER_CLAIM_TYPES,primaryType:'TesterClaim',message:fields}),used};
  };
}
