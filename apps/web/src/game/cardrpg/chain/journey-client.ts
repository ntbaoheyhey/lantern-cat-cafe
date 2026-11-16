import type {Address,Hex} from 'viem';
import type {BattleSetup,Choice} from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import {relicNftAbi} from '@taskbar-hero/chain';
import {chainPost} from './api';
import type {ChainConfig,chainRuntime} from './runtime';

export interface TrialVoucher {player:Address;relicId:string;rarity:number;nonce:string;expiry:string;signature:Hex;used:boolean;source:string}
export interface TrialResponse {vouchers:TrialVoucher[];battle:{won:boolean;replay:{setup:BattleSetup;choices:Choice[]}}}
export function journeyClient(config:ChainConfig,runtime:ReturnType<typeof chainRuntime>,token:string,address:Address) {
  const trial=(action:'intro'|'finale')=>chainPost<TrialResponse>('chain-judge',token,{action});
  return {
    trial,
    async mintFirstReward(){
      await runtime.guard();
      // A fresh server response renews expiry and detects a previously mined mint.
      const current=await trial('intro'),voucher=current.vouchers[0];
      if(!current.battle.won||!voucher||voucher.player.toLowerCase()!==address.toLowerCase())throw Error('Trial reward unavailable.');
      if(voucher.used)return undefined;
      const gas=await chainPost<{status:string;txHash?:Hex;confirmationMs?:number}>('guest-drip',token);
      if(!gas.txHash||!['pending','confirmed'].includes(gas.status))throw Error('Test gas unavailable. Retry.');
      await runtime.funding(gas.txHash,gas.confirmationMs);
      return runtime.write({address:config.RelicNFT,abi:relicNftAbi,functionName:'mint',args:[{
        player:address,relicId:BigInt(voucher.relicId),rarity:voucher.rarity,nonce:BigInt(voucher.nonce),expiry:BigInt(voucher.expiry),
      },voucher.signature]});
    },
  };
}
