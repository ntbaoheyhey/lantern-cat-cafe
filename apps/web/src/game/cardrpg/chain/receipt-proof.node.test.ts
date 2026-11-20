// @vitest-environment node
import {expect,it} from 'vitest';
import {publishReceiptProof,receiptProof} from './receipt-proof';

it('keeps confirmed CLI transactions successful when browser receipt UI is unavailable',()=>{
 const wallet='0x0000000000000000000000000000000000000001' as const;
 const config={chainId:43113 as const,rpcUrl:'http://127.0.0.1:8546',RelicNFT:wallet,RelicMarket:wallet};
 const proof=receiptProof(config,wallet,{
  status:'success',transactionHash:`0x${'a'.repeat(64)}`,from:wallet,
  gasUsed:21000n,effectiveGasPrice:1000000000n,blockNumber:3n,
 },{action:'Move Relics'});
 expect(()=>publishReceiptProof(config,proof)).not.toThrow();
});
