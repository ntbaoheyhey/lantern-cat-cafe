import {useEffect,useState} from 'react';
import {formatEther,type Address,type Hash} from 'viem';
import {CHAIN_ITEM_IDS} from '@taskbar-hero/game-rules/cardrpg';
import {CHAIN_V3_ITEM_IDS,tradeRuleV3} from '@taskbar-hero/game-rules/src/cardrpg/trade';
import type {HistoryRow} from './history';
import {readWalletHistory} from './chain-index';
import {savedReceiptProofs} from './receipt-proof';
import {erc20Abi,txLink,type ChainConfig,type chainRuntime} from './runtime';
export function WalletProof({config,runtime,address}:{config:ChainConfig;runtime:ReturnType<typeof chainRuntime>;address:Address}) {
 const [history,setHistory]=useState<HistoryRow[]>([]),[items,setItems]=useState<{id:bigint;amount:bigint}[]>([]),[yarn,setYarn]=useState<string>(),[error,setError]=useState(''),[ready,setReady]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setReady(false);setError('');
  void (async()=>{
   await runtime.guard();
   const ids=[...new Set([...CHAIN_ITEM_IDS,...CHAIN_V3_ITEM_IDS,1n,2n,3n,4n])];
   const [rows,owned,balance]=await Promise.all([readWalletHistory(runtime.client,config,address),runtime.holdings(ids),config.YarnToken?runtime.client.readContract({address:config.YarnToken,abi:erc20Abi,functionName:'balanceOf',args:[address]}):0n]);
   const merged=new Map<Hash,HistoryRow>(rows.map(row=>[row.hash,row]));
   // Native sponsorship emits no contract event; verify the recorded funding
   // receipt and destination rather than treating local storage as authority.
   for(const proof of savedReceiptProofs(config,address).filter(p=>p.action==='Guest funding')){
    const [tx,r]=await Promise.all([runtime.client.getTransaction({hash:proof.hash}),runtime.client.getTransactionReceipt({hash:proof.hash})]);
    if(r.status==='success'&&tx.to?.toLowerCase()===address.toLowerCase())merged.set(r.transactionHash,{hash:r.transactionHash,block:r.blockNumber,index:r.transactionIndex,kind:'Funding'});
   }
   if(active){setHistory([...merged.values()].sort((a,b)=>a.block===b.block?b.index-a.index:a.block>b.block?-1:1));setItems(owned);setYarn(formatEther(balance));setReady(true);}
  })().catch(()=>{if(active)setError('Wallet proof unavailable. Retry.');});
  return()=>{active=false;};
 },[config,runtime,address,revision]);
 return <section className="ship-wallet-proof ship-trial-card" data-wallet-proof-complete={ready}>
  <h1>My café on Avalanche</h1><p>Your owned items and transactions, verified for this wallet.</p>
  <a href={`https://testnet.snowtrace.io/address/${address}`} target="_blank" rel="noreferrer" title={address}>Wallet {address.slice(0,6)}…{address.slice(-4)}</a>
  {!ready&&!error&&<p role="status">Reading Avalanche…</p>}{error&&<p role="alert">{error}</p>}
  {ready&&<><strong>{yarn} YARN</strong><div className="ship-proof-columns"><section aria-label="On-chain items"><h2>Owned items</h2><ul>{items.map(item=><li key={String(item.id)}><a href={`https://testnet.snowtrace.io/token/${config.RelicNFT}?a=${item.id}`} target="_blank" rel="noreferrer">{tradeRuleV3(Number(item.id))?.name??`Relic ${item.id}`} × {String(item.amount)}</a></li>)}</ul>{!items.length&&<p>No on-chain items.</p>}</section><section aria-label="Wallet transactions"><h2>Transactions · {history.length}</h2><ol>{history.map(row=><li key={row.hash} data-history-kind={row.kind}><a href={txLink(row.hash)} target="_blank" rel="noreferrer" title={row.hash}>{row.kind} · Block {String(row.block)}</a></li>)}</ol></section></div></>}
  <button onClick={()=>setRevision(n=>n+1)}>Refresh wallet proof</button>
  <small><a href="https://routescan.io" target="_blank" rel="noreferrer">Powered by Routescan.io APIs</a></small>
 </section>;
}
