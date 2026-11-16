import {formatEther,type Address,type Hash,type TransactionReceipt} from 'viem';
import type {ChainConfig} from './runtime';
export interface ReceiptProof {hash:Hash;wallet:Address;payer:Address;action:string;feeAvax:string;confirmationMs:number|null;confirmedAt:number;block:string;gasSource:'wallet'|'cafe';local:boolean}
export interface ProofContext {action?:string;submittedAt?:number;submittedMonotonicAt?:number;confirmationMs?:number;gasSource?:'wallet'|'cafe'}
const key=(config:ChainConfig,wallet:Address)=>`lantern.receipts.v1:${config.chainId}:${config.fixtureId??'fuji'}:${config.rpcUrl}:${config.RelicNFT.toLowerCase()}:${wallet.toLowerCase()}`;
export function receiptProof(config:ChainConfig,wallet:Address,receipt:Pick<TransactionReceipt,'status'|'transactionHash'|'from'|'gasUsed'|'effectiveGasPrice'|'blockNumber'>,context:ProofContext={},now=Date.now()):ReceiptProof {
 if(receipt.status!=='success'||typeof receipt.gasUsed!=='bigint'||typeof receipt.effectiveGasPrice!=='bigint'||!receipt.from||!receipt.transactionHash)throw Error('Incomplete transaction receipt.');
 const elapsed=context.confirmationMs??(context.submittedAt===undefined?null:now-context.submittedAt);
 return {hash:receipt.transactionHash,wallet,payer:receipt.from,action:context.action??'Transaction',feeAvax:formatEther(receipt.gasUsed*receipt.effectiveGasPrice),confirmationMs:elapsed!==null&&Number.isFinite(elapsed)&&elapsed>=0?elapsed:null,confirmedAt:now,block:String(receipt.blockNumber),gasSource:context.gasSource??'wallet',local:['127.0.0.1','localhost','[::1]'].includes(new URL(config.rpcUrl).hostname)};
}
export function savedReceiptProofs(config:ChainConfig,wallet:Address):ReceiptProof[] {
 try{const rows=JSON.parse(localStorage.getItem(key(config,wallet))??'[]');return Array.isArray(rows)?rows.filter((r):r is ReceiptProof=>!!r&&/^0x[\da-f]{64}$/i.test(r.hash)&&typeof r.wallet==='string'&&r.wallet.toLowerCase()===wallet.toLowerCase()&&typeof r.action==='string'&&typeof r.feeAvax==='string'&&typeof r.payer==='string'&&Number.isFinite(r.confirmedAt)):[];}catch{return [];}
}
export function publishReceiptProof(config:ChainConfig,proof:ReceiptProof):void {
 const rows=savedReceiptProofs(config,proof.wallet),prior=rows.find(r=>r.hash===proof.hash);
 const value=prior?{...proof,confirmationMs:prior.confirmationMs??proof.confirmationMs,confirmedAt:prior.confirmedAt,action:proof.action==='Transaction'?prior.action:proof.action,gasSource:prior.gasSource==='cafe'?'cafe':proof.gasSource}:proof;
 try{localStorage.setItem(key(config,proof.wallet),JSON.stringify([...rows.filter(r=>r.hash!==value.hash),value]));}catch{/* The current receipt remains visible when storage is unavailable. */}
 window.dispatchEvent(new CustomEvent<ReceiptProof>('chain:receipt',{detail:value}));
}
