import {expect,it} from 'vitest';
import {encodeAbiParameters,encodeEventTopics,pad,toHex,type Hex} from 'viem';
import {relicNftAbi,yarnTokenAbi} from '@taskbar-hero/chain';
import {countFusionReceipts,type CounterLog} from './fusion-counter';
const nft='0x0000000000000000000000000000000000000001',yarn='0x0000000000000000000000000000000000000002',wallet='0x0000000000000000000000000000000000000003';
const hash=pad('0x01'),topics=(v:ReturnType<typeof encodeEventTopics>)=>v.filter((t):t is Hex=>typeof t==='string');
const payment=(nonce:bigint,cost:bigint):CounterLog=>({address:yarn,transactionHash:hash,topics:topics(encodeEventTopics({abi:yarnTokenAbi,eventName:'SealPaid',args:{player:wallet,intent:pad(toHex(nonce))}})),data:encodeAbiParameters([{type:'uint256'}],[cost*10n**18n])});
const mint=(nonce:bigint,token:bigint):CounterLog=>({address:nft,transactionHash:hash,topics:topics(encodeEventTopics({abi:relicNftAbi,eventName:'RelicForged',args:{player:wallet,relicId:token}})),data:encodeAbiParameters([{type:'uint8'},{type:'uint256'}],[3,nonce])});
it('requires both a matching fusion payment and Legendary equipment output, deduplicating replayed logs',()=>{
 const logs=[payment(1n,18n),mint(1n,20030n),payment(2n,39n),mint(2n,20030n),payment(3n,18n),mint(4n,20030n),payment(5n,18n),mint(5n,30001n)];
 expect(countFusionReceipts([...logs,...logs],nft,yarn)).toBe(1);
 expect(countFusionReceipts([mint(1n,20030n)],nft,yarn)).toBe(0);
 expect(()=>countFusionReceipts([{...logs[0]!,removed:true}],nft,yarn)).toThrow('Removed');
});
