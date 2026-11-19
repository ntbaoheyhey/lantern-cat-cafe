import {useEffect,useState} from 'react';
import type {ReceiptProof} from './receipt-proof';
import {txLink} from './runtime';
import './receipt-toast.css';
import {RECEIPT_FIXTURE} from './receipt-fixture';
const actions:Record<string,string>={mint:'Relic minted',seal:'YARN burned',safeBatchTransferFrom:'Fusion inputs sent',setApprovalForAll:'Market approved',claimTester:'Test YARN claimed',transfer:'YARN transferred',approve:'YARN approved',list:'Relic listed',buy:'Relic purchased',withdraw:'Sale proceeds claimed',claim:'Spool claimed'};
export function ReceiptToast({fixture=false}:{fixture?:boolean}={}){
 const [proof,setProof]=useState<ReceiptProof|undefined>(fixture?RECEIPT_FIXTURE:undefined);
 useEffect(()=>{if(fixture)return;const receive=(event:Event)=>setProof((event as CustomEvent<ReceiptProof>).detail);window.addEventListener('chain:receipt',receive);return()=>window.removeEventListener('chain:receipt',receive);},[fixture]);
 if(!proof)return null;
 return <aside className="ship-receipt-toast" role="status" aria-label={fixture?'Fixture receipt — no transaction':proof.local?'Local transaction receipt':'Avalanche Fuji receipt'} data-receipt-fixture={fixture||undefined} data-receipt-hash={proof.hash} data-receipt-fee={proof.feeAvax} data-receipt-payer={proof.payer} data-receipt-ms={proof.confirmationMs??undefined} data-receipt-action={proof.action}>
  <button aria-label="Dismiss receipt" onClick={()=>setProof(undefined)}>×</button>
  <strong>{fixture?'Fixture — Relic mint preview':actions[proof.action]??proof.action}</strong>
  <small>{fixture?'Avalanche Fuji · fixture, not submitted':proof.local?'Local test receipt':'Avalanche Fuji testnet'}</small>
  <dl><div><dt>Transaction</dt><dd><code>{proof.hash}</code></dd></div>
   <div><dt>Fee payer</dt><dd><code>{proof.payer}</code></dd></div>
   <div><dt>Confirmed{proof.local?' locally':''}</dt><dd>{proof.confirmationMs===null?'Timing unavailable':`${(proof.confirmationMs/1000).toFixed(2)} s`}</dd></div>
   <div><dt>Fee</dt><dd>{proof.feeAvax} AVAX</dd></div></dl>
  <small>{proof.gasSource==='cafe'?'Gas funding: Café':'Gas funding: wallet'}</small>
  {fixture?<small>Example data only. No transaction or ownership is claimed.</small>:proof.local?<small>Local chain · no public explorer</small>:<a href={txLink(proof.hash)} target="_blank" rel="noreferrer">View on Fuji explorer · Snowtrace</a>}
 </aside>;
}
