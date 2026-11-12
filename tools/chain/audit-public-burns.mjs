// Public receipt audit only. No wallet client, env secrets, signing or writes to chain.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {summarizeBurnEvidence,reconcileTokenHistory} from './burn-evidence.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const req=createRequire(resolve(root,'apps/web/package.json'));
const {parseAbi,decodeEventLog,formatEther,encodeFunctionData,decodeFunctionResult}=await import(pathToFileURL(req.resolve('viem').replace('/_cjs/','/_esm/')));
const cfg=JSON.parse(readFileSync(resolve(root,'packages/chain/deployments/43113.json'),'utf8'));
const secondary=process.argv.includes('--publicnode');
const provider=secondary?'https://avalanche-fuji-c-chain-rpc.publicnode.com':'https://api.avax-test.network/ext/bc/C/rpc';
const zero='0x'+'0'.repeat(40), token=cfg.YarnToken.toLowerCase(),market=cfg.RelicMarketV2.toLowerCase();
const abi=parseAbi([
 'event Transfer(address indexed from,address indexed to,uint256 value)',
 'event SealPaid(address indexed player,bytes32 indexed intent,uint256 amount)',
 'event Bought(uint256 indexed listingId,address indexed buyer,address indexed seller,uint256 relicId,uint256 amount,uint256 price,uint8 currency,uint256 fee,uint256 burned)',
 'event Claimed(address indexed player,uint256 indexed season,uint256 indexed nonce,uint256 amount,uint256 week)',
 'function totalSupply() view returns (uint256)',
 'function balanceOf(address) view returns (uint256)',
]);
let nextReadAt=0;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rpc=async(method,params=[])=>{
 assert(['eth_chainId','eth_blockNumber','eth_getTransactionReceipt','eth_getBlockByNumber','eth_getLogs','eth_call'].includes(method),'Read-only RPC methods only');
 for(let attempt=0;attempt<5;attempt++){
  const scheduled=Math.max(Date.now(),nextReadAt);nextReadAt=scheduled+750;
  await wait(Math.max(0,scheduled-Date.now()));
  const r=await fetch(provider,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000)});
  if((r.status===429||r.status>=500)&&attempt<4){
   const retryAfter=Number(r.headers.get('retry-after'))||0;
   console.log(`Public RPC HTTP${r.status}; retrying the same ${method} read`);
   await r.text();await wait(Math.min(20000,Math.max(retryAfter*1000,1000*2**attempt)));continue;
  }
  assert(r.ok,`RPC HTTP ${r.status}`);const result=await r.json();
  if(result.error)throw new Error(`${method} RPC ${result.error.code}: ${String(result.error.message).slice(0,240)}`);
  return result.result;
 }
 throw new Error('RPC retry limit reached');
};
if(process.argv.includes('--read-only')){
 assert.equal(Number(BigInt(await rpc('eth_chainId'))),43113,'Wrong network');
 const latest=Number(BigInt(await rpc('eth_blockNumber')));
 const pinned=process.argv.find(a=>a.startsWith('--snapshot='))?.slice(11);
 const snapshot=pinned?Number(pinned):latest-12;
 assert(Number.isSafeInteger(snapshot)&&snapshot>0&&snapshot<=latest-12,'Snapshot must be confirmed and valid');
 const snapshotBlock=await rpc('eth_getBlockByNumber',['0x'+snapshot.toString(16),false]);
 const text=readFileSync(resolve(root,'reports/chain/FUJI-SMOKE.md'),'utf8');
 const smokeHashes=[...new Set([...text.matchAll(/https:\/\/testnet\.snowtrace\.io\/tx\/(0x[0-9a-f]{64})/g)].map(m=>m[1]))];
 assert.equal(smokeHashes.length,18,'Expected the recorded18-receipt user smoke');
 const fullLedger=process.argv.includes('--full-ledger'),ranges=[],scanned=[];
 let deployment=null;
 if(fullLedger){
  // Public transaction recorded in INBOX, not a key or an inferred start block.
  deployment=await rpc('eth_getTransactionReceipt',['0x42cdaae9a91984232225e6b9a57ce22447cae526703ad17eadc6e0ce8bc3a049']);
  assert(deployment?.contractAddress?.toLowerCase()===token&&Number(BigInt(deployment.status))===1,'Deployment identity mismatch');
  const start=Number(BigInt(deployment.blockNumber));assert(start<=snapshot);
  // Independently checked provider bounds; never skip a range after an error.
  const rangeSize=secondary?1000:100;
  for(let from=start;from<=snapshot;from+=rangeSize){
   const to=Math.min(from+rangeSize-1,snapshot);
   const logs=await rpc('eth_getLogs',[{address:token,fromBlock:'0x'+from.toString(16),toBlock:'0x'+to.toString(16)}]);
   assert(Array.isArray(logs),'Incomplete log response');
   for(const l of logs)assert(l.address.toLowerCase()===token&&!l.removed&&Number(BigInt(l.blockNumber))>=from&&Number(BigInt(l.blockNumber))<=to,'Out-of-range log');
   ranges.push({from,to,logs:logs.length});scanned.push(...logs);
   if(ranges.length%10===0)console.log(`Read ${ranges.length} contiguous ranges of at most${rangeSize} blocks`);
  }
 }
 const hashes=[...new Set([...smokeHashes,...scanned.map(l=>l.transactionHash)])];
 const receipts=[];
 for(let i=0;i<hashes.length;i+=4){
  receipts.push(...await Promise.all(hashes.slice(i,i+4).map(h=>rpc('eth_getTransactionReceipt',[h]))));
 }
 const canonical=new Map();
 for(const r of receipts){
  assert(r&&Number(BigInt(r.status))===1&&hashes.includes(r.transactionHash),'Missing, failed or foreign receipt');
  const height=Number(BigInt(r.blockNumber));assert(height<=snapshot,'Receipt newer than audit snapshot');
  if(!canonical.has(height))canonical.set(height,(await rpc('eth_getBlockByNumber',[r.blockNumber,false])).hash.toLowerCase());
  assert.equal(canonical.get(height),r.blockHash.toLowerCase(),'Noncanonical receipt');
 }
 for(const l of scanned){
  const r=receipts.find(r=>r.transactionHash===l.transactionHash);
  assert(r&&r.logs.some(x=>x.logIndex===l.logIndex&&x.blockHash===l.blockHash&&x.data===l.data&&JSON.stringify(x.topics)===JSON.stringify(l.topics)),'Scanned log absent from canonical receipt');
 }
 const events=[],claims=[];let nativeBurn=0n,marketFee=0n;
 for(const r of receipts){
  const logs=r.logs.flatMap(l=>{
   assert(l.transactionHash===r.transactionHash&&l.blockHash===r.blockHash&&!l.removed,'Receipt log mismatch');
   try{return [{...l,decoded:decodeEventLog({abi,data:l.data,topics:l.topics,strict:true})}];}catch{return [];}
  });
  const burns=logs.filter(l=>l.address.toLowerCase()===token&&l.decoded.eventName==='Transfer'&&l.decoded.args.to.toLowerCase()===zero&&l.decoded.args.value>0n);
  const assigned=new Set();
  for(const l of burns){
   const from=l.decoded.args.from.toLowerCase(),amount=l.decoded.args.value;
   const matching=logs.find(x=>!assigned.has(x.logIndex)&&BigInt(x.logIndex)>BigInt(l.logIndex)&&(
    (x.address.toLowerCase()===token&&x.decoded.eventName==='SealPaid'&&x.decoded.args.player.toLowerCase()===from&&x.decoded.args.amount===amount)||
    (from===market&&x.address.toLowerCase()===market&&x.decoded.eventName==='Bought'&&x.decoded.args.currency===1&&x.decoded.args.burned===amount)));
   if(matching)assigned.add(matching.logIndex);
   events.push({chainId:43113,token,transactionHash:r.transactionHash,blockHash:r.blockHash,logIndex:Number(BigInt(l.logIndex)),
    blockNumber:Number(BigInt(r.blockNumber)),from,receiptStatus:1,canonical:true,
    category:matching?.decoded.eventName==='SealPaid'?'seal':matching?.decoded.eventName==='Bought'?'market':'other',amount:formatEther(amount)});
  }
  for(const l of logs){
   if(l.address.toLowerCase()===cfg.SeasonRewards.toLowerCase()&&l.decoded.eventName==='Claimed')claims.push({transactionHash:r.transactionHash,player:l.decoded.args.player,amount:formatEther(l.decoded.args.amount)});
   if(l.address.toLowerCase()===market&&l.decoded.eventName==='Bought'){
    if(l.decoded.args.currency===0)nativeBurn+=l.decoded.args.burned;
    else marketFee+=l.decoded.args.fee;
   }
  }
 }
 const fromBlock=deployment?Number(BigInt(deployment.blockNumber)):Math.min(...receipts.map(r=>Number(BigInt(r.blockNumber))));
 const reviews=events.filter(e=>smokeHashes.includes(e.transactionHash)).map(e=>({eventId:e.transactionHash.toLowerCase()+':'+e.logIndex,verdict:'demo',
   evidence:['reports/chain/FUJI-SMOKE.md: user-executed scripted18-receipt integration test']}));
 const accounting=summarizeBurnEvidence({chainId:43113,token,fromBlock,toBlock:snapshot,events,reviews,completeClosedPeriod:false});
 let reconciliation=null;
 if(fullLedger){
  const transfers=receipts.flatMap(r=>r.logs.flatMap(l=>{
   if(l.address.toLowerCase()!==token)return [];
   try{const e=decodeEventLog({abi,data:l.data,topics:l.topics,strict:true});if(e.eventName!=='Transfer')return [];
    assert(scanned.some(s=>s.transactionHash===l.transactionHash&&s.logIndex===l.logIndex),'Receipt transfer missing from range scan');
    return [{transactionHash:r.transactionHash,blockHash:r.blockHash,blockNumber:Number(BigInt(r.blockNumber)),logIndex:Number(BigInt(l.logIndex)),from:e.args.from,to:e.args.to,amount:formatEther(e.args.value)}];
   }catch(error){if(error.code==='ERR_ASSERTION')throw error;return [];}
  }));
  const read=async(functionName,args=[])=>decodeFunctionResult({abi,functionName,data:await rpc('eth_call',[{to:token,data:encodeFunctionData({abi,functionName,args})},'0x'+snapshot.toString(16)])});
  const holders=[...new Set(transfers.flatMap(t=>[t.from.toLowerCase(),t.to.toLowerCase()]))].filter(a=>a!==zero);
  const observedBalances={};
  for(let i=0;i<holders.length;i+=4)await Promise.all(holders.slice(i,i+4).map(async a=>{observedBalances[a]=formatEther(await read('balanceOf',[a]));}));
  reconciliation=reconcileTokenHistory({transfers,observedSupply:formatEther(await read('totalSupply')),observedBalances});
  assert.equal(reconciliation.minted,'1000000000','Unexpected genesis issuance');
  assert.equal(reconciliation.burned,accounting.totals.gross,'Burn receipt/history mismatch');
 }
 assert.equal((await rpc('eth_getBlockByNumber',['0x'+snapshot.toString(16),false])).hash,snapshotBlock.hash,'Snapshot reorganized during audit');
 const report={observedAt:new Date().toISOString(),mode:'read-only public Fuji receipts',provider,snapshotBlock:snapshot,snapshotHash:snapshotBlock.hash,
  confirmationPolicy:'Snapshot12 blocks behind observed head; each receipt block checked against canonical block hash. Not a cross-provider attestation.',
  scope:fullLedger?'All token logs from verified deployment to pinned snapshot, plus18 smoke receipts. Current/open observation, not a complete closed season or a human-user count.':'Only18 hashes from the existing smoke report. Not a complete period, not a count of all users or all burns.',
  ranges,reconciliation,
  receipts:receipts.map(r=>({hash:r.transactionHash,block:Number(BigInt(r.blockNumber)),status:1})),claims,
  nativeAvaxSink:formatEther(nativeBurn),yarnMarketFee:formatEther(marketFee),accounting,
  conclusion:'Recorded smoke burns are demo activity. Other burns stay unreviewed. No observed burn is certified voluntary repeat demand or eligible to fund a closed-period routine budget.'};
 writeFileSync(resolve(root,secondary?'reports/chain/PUBLIC-LEDGER-CROSSCHECK.json':fullLedger?'reports/chain/PUBLIC-LEDGER-AUDIT.json':'reports/chain/PUBLIC-BURN-AUDIT.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({receipts:receipts.length,claims,burns:accounting.totals,budgetEligibleBurn:accounting.budgetEligibleBurn,nativeAvaxSink:report.nativeAvaxSink},null,2));
}else console.log('Usage: node tools/chain/audit-public-burns.mjs --read-only [--full-ledger] [--publicnode --snapshot=BLOCK]');
