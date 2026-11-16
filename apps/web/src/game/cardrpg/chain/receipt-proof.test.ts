import {beforeEach,expect,it} from 'vitest';
import {receiptProof,publishReceiptProof,savedReceiptProofs} from './receipt-proof';
const wallet='0x0000000000000000000000000000000000000001' as const,other='0x0000000000000000000000000000000000000002' as const;
const config={chainId:43113 as const,rpcUrl:'http://127.0.0.1:8546',RelicNFT:wallet,RelicMarket:wallet};
const receipt={status:'success',transactionHash:`0x${'a'.repeat(64)}`,from:other,gasUsed:21000n,effectiveGasPrice:1000000000n,blockNumber:3n} as Parameters<typeof receiptProof>[2];
beforeEach(()=>localStorage.clear());
it('uses executed gas and actual payer, keeping missing timing distinct from zero',()=>{
 const proof=receiptProof(config,wallet,receipt,{submittedAt:1000,gasSource:'cafe'},1750);
 expect(proof).toMatchObject({confirmationMs:750,feeAvax:'0.000021',payer:other,gasSource:'cafe',local:true});
 expect(receiptProof(config,wallet,receipt).confirmationMs).toBeNull();
 expect(receiptProof(config,wallet,receipt,{submittedAt:2000},1750).confirmationMs).toBeNull();
 expect(()=>receiptProof(config,wallet,{...receipt,status:'reverted'})).toThrow();
});
it('retains the original measurement on recovery and scopes wallets and local deployments',()=>{
 publishReceiptProof(config,receiptProof(config,wallet,receipt,{action:'mint',submittedAt:1000,gasSource:'cafe'},1750));
 publishReceiptProof(config,receiptProof(config,wallet,receipt,{},9000));
 expect(savedReceiptProofs(config,wallet)).toHaveLength(1);
 expect(savedReceiptProofs(config,wallet)[0]).toMatchObject({action:'mint',confirmationMs:750,confirmedAt:1750,gasSource:'cafe'});
 expect(savedReceiptProofs(config,other)).toEqual([]);
 expect(savedReceiptProofs({...config,RelicNFT:other},wallet)).toEqual([]);
});
