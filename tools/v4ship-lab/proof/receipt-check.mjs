/** Independent RPC comparison while the disposable ledger still exists. */
const rpc='http://127.0.0.1:8546';
const address=/^0x[\da-f]{40}$/i,hash=/^0x[\da-f]{64}$/i;
const wei=value=>{
 if(typeof value!=='string'||!/^\d+(?:\.\d{1,18})?$/.test(value))return null;
 const [whole,fraction='']=value.split('.');return BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
};
export async function verifyJourneyReceipts(proofs,history,wallet){
 if(!Array.isArray(proofs)||!Array.isArray(history)||!address.test(wallet))throw Error('Incomplete wallet proof');
 const rows=[];
 for(const proof of proofs){
  if(!hash.test(proof.hash)||!address.test(proof.payer)||!address.test(proof.wallet))throw Error('Invalid receipt identity');
  const response=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getTransactionReceipt',params:[proof.hash]})});
  const body=await response.json(),receipt=body.result;
  if(!response.ok||body.error||!receipt)throw Error('Missing local RPC receipt');
  const checks={success:receipt.status==='0x1',hash:receipt.transactionHash?.toLowerCase()===proof.hash.toLowerCase(),
   payer:receipt.from?.toLowerCase()===proof.payer.toLowerCase(),fee:wei(proof.feeAvax)===BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice),
   block:/^\d+$/.test(proof.block)&&BigInt(proof.block)===BigInt(receipt.blockNumber),
   timing:Number.isFinite(proof.confirmationMs)&&proof.confirmationMs>=0&&Number.isFinite(proof.confirmedAt)&&proof.confirmedAt>0,
   localLabel:proof.local===true,action:typeof proof.action==='string'&&proof.action.length>0};
  rows.push({hash:proof.hash,wallet:proof.wallet,action:proof.action,checks,pass:Object.values(checks).every(Boolean)});
 }
 const owned=proofs.filter(p=>p.wallet.toLowerCase()===wallet.toLowerCase()),seen=new Set(history.map(r=>r.hash.toLowerCase()));
 const missing=owned.filter(p=>!seen.has(p.hash.toLowerCase())).map(p=>p.hash);
 const links=history.every(row=>hash.test(row.hash)&&row.href===`https://testnet.snowtrace.io/tx/${row.hash}`);
 return {scope:'Disposable Anvil receipt values and wallet history; no public latency claim',rows,receiptCount:rows.length,
  actionTypes:new Set(proofs.map(p=>p.action)).size,walletReceiptCount:owned.length,historyCount:history.length,missingWalletReceipts:missing,explorerLinks:links,
  pass:rows.length>0&&rows.every(r=>r.pass)&&new Set(proofs.map(p=>p.action)).size>=5&&owned.length>0&&!missing.length&&history.length>0&&links};
}
